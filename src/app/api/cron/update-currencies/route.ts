import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Exchange rate API - using exchangerate-api.com (free tier)
const EXCHANGE_API_URL = "https://api.exchangerate-api.com/v4/latest/USD";

interface ExchangeRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

export async function GET(req: Request) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Allow in development
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Fetch exchange rates
    const response = await fetch(EXCHANGE_API_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.status}`);
    }

    const data: ExchangeRates = await response.json();
    
    // Get AZN rate from USD (1 USD = X AZN)
    const usdToAzn = data.rates["AZN"] || 1.7; // fallback
    
    // Update all currencies in database
    const currencies = await prisma.currency.findMany();
    let updated = 0;
    
    for (const currency of currencies) {
      const rateFromUsd = data.rates[currency.code];
      if (rateFromUsd) {
        // Calculate rate to AZN: 1 AZN = X currency
        // If 1 USD = 1.7 AZN and 1 USD = 0.85 EUR
        // Then 1 AZN = 0.85/1.7 = 0.5 EUR
        const rateToAzn = rateFromUsd / usdToAzn;
        
        await prisma.currency.update({
          where: { id: currency.id },
          data: {
            rateToAZN: rateToAzn,
            lastUpdated: new Date(),
          },
        });
        updated++;
      }
    }
    
    // Add missing currencies from API
    const existingCodes = currencies.map(c => c.code);
    const missingCurrencies = Object.keys(data.rates).filter(code => !existingCodes.includes(code));
    
    // Common currency names mapping
    const currencyNames: Record<string, { az: string; en: string; symbol: string }> = {
      "BDT": { az: "Banqladeş Takası", en: "Bangladesh Taka", symbol: "৳" },
      "VND": { az: "Vyetnam Donqu", en: "Vietnamese Dong", symbol: "₫" },
      "NGN": { az: "Nigeriya Nairası", en: "Nigerian Naira", symbol: "₦" },
      "EGP": { az: "Misir Funtu", en: "Egyptian Pound", symbol: "E£" },
      "ZMW": { az: "Zambiya Kvaçası", en: "Zambian Kwacha", symbol: "ZK" },
      "KES": { az: "Keniya Şillinqi", en: "Kenyan Shilling", symbol: "KSh" },
      "TZS": { az: "Tanzaniya Şillinqi", en: "Tanzanian Shilling", symbol: "TSh" },
      "UGX": { az: "Uqanda Şillinqi", en: "Ugandan Shilling", symbol: "USh" },
      "GHS": { az: "Qana Sedisi", en: "Ghanaian Cedi", symbol: "₵" },
      "XOF": { az: "CFA Frankı (BCEAO)", en: "CFA Franc BCEAO", symbol: "CFA" },
      "XAF": { az: "CFA Frankı (BEAC)", en: "CFA Franc BEAC", symbol: "FCFA" },
      "MMK": { az: "Myanma Kyatı", en: "Myanmar Kyat", symbol: "K" },
      "LKR": { az: "Şri Lanka Rupisi", en: "Sri Lankan Rupee", symbol: "Rs" },
      "NPR": { az: "Nepal Rupisi", en: "Nepalese Rupee", symbol: "रू" },
      "AFN": { az: "Əfqanıstan Əfqanisi", en: "Afghan Afghani", symbol: "؋" },
    };
    
    for (const code of missingCurrencies.slice(0, 20)) {
      const rateFromUsd = data.rates[code];
      const rateToAzn = rateFromUsd / usdToAzn;
      const info = currencyNames[code] || { az: code, en: code, symbol: code };
      
      try {
        await prisma.currency.create({
          data: {
            code,
            symbol: info.symbol,
            nameAz: info.az,
            nameEn: info.en,
            rateToAZN: rateToAzn,
            isBase: false,
            isActive: true,
            lastUpdated: new Date(),
          },
        });
        updated++;
      } catch (e) {
        // Skip if already exists
      }
    }

    return NextResponse.json({
      success: true,
      updated,
      date: data.date,
      usdToAzn,
    });
  } catch (error) {
    console.error("Currency update error:", error);
    return NextResponse.json(
      { error: "Failed to update currencies" },
      { status: 500 }
    );
  }
}

