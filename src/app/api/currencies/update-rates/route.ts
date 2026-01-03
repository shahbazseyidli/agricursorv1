import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// FreeCurrencyAPI - Free plan: 5000 requests/month
// Docs: https://freecurrencyapi.com/docs/#official-libraries
const FREECURRENCY_API_KEY = process.env.FREECURRENCY_API_KEY || "";
const FREECURRENCY_API_URL = "https://api.freecurrencyapi.com/v1/latest";

// CBAR (Central Bank of Azerbaijan) - Official rates
// URL format: https://cbar.az/currencies/DD.MM.YYYY.xml
const CBAR_API_URL = "https://cbar.az/currencies";

// All currencies supported by FreeCurrencyAPI
const FREECURRENCY_SUPPORTED = [
  "USD", "EUR", "JPY", "BGN", "CZK", "DKK", "GBP", "HUF", "PLN", "RON",
  "SEK", "CHF", "ISK", "NOK", "HRK", "RUB", "TRY", "AUD", "BRL", "CAD",
  "CNY", "HKD", "IDR", "ILS", "INR", "KRW", "MXN", "MYR", "NZD", "PHP",
  "SGD", "THB", "ZAR"
];

// Currency metadata
const CURRENCY_INFO: Record<string, { symbol: string; nameAz: string; nameEn: string }> = {
  AZN: { symbol: "₼", nameAz: "Azərbaycan Manatı", nameEn: "Azerbaijani Manat" },
  USD: { symbol: "$", nameAz: "ABŞ Dolları", nameEn: "US Dollar" },
  EUR: { symbol: "€", nameAz: "Avro", nameEn: "Euro" },
  GBP: { symbol: "£", nameAz: "İngilis Funt Sterlinqi", nameEn: "British Pound" },
  RUB: { symbol: "₽", nameAz: "Rusiya Rublu", nameEn: "Russian Ruble" },
  TRY: { symbol: "₺", nameAz: "Türk Lirəsi", nameEn: "Turkish Lira" },
  GEL: { symbol: "₾", nameAz: "Gürcü Larisi", nameEn: "Georgian Lari" },
  AED: { symbol: "د.إ", nameAz: "BƏƏ Dirhəmi", nameEn: "UAE Dirham" },
  CHF: { symbol: "Fr", nameAz: "İsveçrə Frankı", nameEn: "Swiss Franc" },
  CNY: { symbol: "¥", nameAz: "Çin Yuanı", nameEn: "Chinese Yuan" },
  JPY: { symbol: "¥", nameAz: "Yapon Yeni", nameEn: "Japanese Yen" },
  CAD: { symbol: "C$", nameAz: "Kanada Dolları", nameEn: "Canadian Dollar" },
  AUD: { symbol: "A$", nameAz: "Avstraliya Dolları", nameEn: "Australian Dollar" },
  NZD: { symbol: "NZ$", nameAz: "Yeni Zelandiya Dolları", nameEn: "New Zealand Dollar" },
  SEK: { symbol: "kr", nameAz: "İsveç Kronu", nameEn: "Swedish Krona" },
  NOK: { symbol: "kr", nameAz: "Norveç Kronu", nameEn: "Norwegian Krone" },
  DKK: { symbol: "kr", nameAz: "Danimarka Kronu", nameEn: "Danish Krone" },
  PLN: { symbol: "zł", nameAz: "Polşa Zlotısı", nameEn: "Polish Zloty" },
  CZK: { symbol: "Kč", nameAz: "Çexiya Kronu", nameEn: "Czech Koruna" },
  HUF: { symbol: "Ft", nameAz: "Macarıstan Forinti", nameEn: "Hungarian Forint" },
  RON: { symbol: "lei", nameAz: "Rumıniya Leyi", nameEn: "Romanian Leu" },
  BGN: { symbol: "лв", nameAz: "Bolqarıstan Levi", nameEn: "Bulgarian Lev" },
  HRK: { symbol: "kn", nameAz: "Xorvatiya Kunası", nameEn: "Croatian Kuna" },
  ISK: { symbol: "kr", nameAz: "İslandiya Kronu", nameEn: "Icelandic Króna" },
  BRL: { symbol: "R$", nameAz: "Braziliya Realı", nameEn: "Brazilian Real" },
  MXN: { symbol: "$", nameAz: "Meksika Pesosu", nameEn: "Mexican Peso" },
  HKD: { symbol: "HK$", nameAz: "Honq Konq Dolları", nameEn: "Hong Kong Dollar" },
  SGD: { symbol: "S$", nameAz: "Sinqapur Dolları", nameEn: "Singapore Dollar" },
  KRW: { symbol: "₩", nameAz: "Cənubi Koreya Vonu", nameEn: "South Korean Won" },
  INR: { symbol: "₹", nameAz: "Hindistan Rupisi", nameEn: "Indian Rupee" },
  IDR: { symbol: "Rp", nameAz: "İndoneziya Rupisi", nameEn: "Indonesian Rupiah" },
  MYR: { symbol: "RM", nameAz: "Malayziya Rinqiti", nameEn: "Malaysian Ringgit" },
  PHP: { symbol: "₱", nameAz: "Filippin Pesosu", nameEn: "Philippine Peso" },
  THB: { symbol: "฿", nameAz: "Tayland Batı", nameEn: "Thai Baht" },
  ZAR: { symbol: "R", nameAz: "Cənubi Afrika Randı", nameEn: "South African Rand" },
  ILS: { symbol: "₪", nameAz: "İsrail Şekeli", nameEn: "Israeli Shekel" },
  SAR: { symbol: "﷼", nameAz: "Səudiyyə Rialı", nameEn: "Saudi Riyal" },
  QAR: { symbol: "﷼", nameAz: "Qətər Rialı", nameEn: "Qatari Riyal" },
  KWD: { symbol: "د.ك", nameAz: "Küveyt Dinarı", nameEn: "Kuwaiti Dinar" },
  BYN: { symbol: "Br", nameAz: "Belarus Rublu", nameEn: "Belarusian Ruble" },
  KZT: { symbol: "₸", nameAz: "Qazaxıstan Tengəsi", nameEn: "Kazakhstani Tenge" },
  UAH: { symbol: "₴", nameAz: "Ukrayna Qrivnası", nameEn: "Ukrainian Hryvnia" },
  MDL: { symbol: "L", nameAz: "Moldova Leyi", nameEn: "Moldovan Leu" },
  TMT: { symbol: "m", nameAz: "Türkmənistan Manatı", nameEn: "Turkmenistan Manat" },
  UZS: { symbol: "сўм", nameAz: "Özbək Somu", nameEn: "Uzbek Som" },
  KGS: { symbol: "с", nameAz: "Qırğız Somu", nameEn: "Kyrgyzstani Som" },
  PKR: { symbol: "₨", nameAz: "Pakistan Rupisi", nameEn: "Pakistani Rupee" },
  RSD: { symbol: "дин", nameAz: "Serbiya Dinarı", nameEn: "Serbian Dinar" },
};

// Parse CBAR XML response
function parseCBARXml(xml: string): Record<string, { value: number; nominal: number }> {
  const rates: Record<string, { value: number; nominal: number }> = {};
  
  // Match all Valute elements
  const valuteRegex = /<Valute Code="([A-Z]+)">\s*<Nominal>([^<]+)<\/Nominal>\s*<Name>[^<]+<\/Name>\s*<Value>([^<]+)<\/Value>\s*<\/Valute>/g;
  
  let match;
  while ((match = valuteRegex.exec(xml)) !== null) {
    const code = match[1];
    const nominalStr = match[2].replace(/[^0-9.]/g, "");
    const nominal = parseFloat(nominalStr) || 1;
    const value = parseFloat(match[3]);
    
    if (code && !isNaN(value)) {
      rates[code] = { value, nominal };
    }
  }
  
  return rates;
}

// Fetch rates from CBAR (Central Bank of Azerbaijan)
async function fetchCBARRates(): Promise<Record<string, number>> {
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, "0")}.${String(now.getMonth() + 1).padStart(2, "0")}.${now.getFullYear()}`;
  const url = `${CBAR_API_URL}/${dateStr}.xml`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      // Try yesterday if today's rates not available yet
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${String(yesterday.getDate()).padStart(2, "0")}.${String(yesterday.getMonth() + 1).padStart(2, "0")}.${yesterday.getFullYear()}`;
      const yesterdayUrl = `${CBAR_API_URL}/${yesterdayStr}.xml`;
      
      const retryResponse = await fetch(yesterdayUrl);
      if (!retryResponse.ok) {
        throw new Error(`CBAR API error: ${retryResponse.status}`);
      }
      
      const xml = await retryResponse.text();
      const rawRates = parseCBARXml(xml);
      
      // Convert to rateToAZN (how many of currency = 1 AZN)
      const rates: Record<string, number> = {};
      for (const [code, data] of Object.entries(rawRates)) {
        // CBAR gives: how many AZN = X units of currency
        // We need: how many currency = 1 AZN
        // rateToAZN = nominal / value
        rates[code] = data.nominal / data.value;
      }
      return rates;
    }
    
    const xml = await response.text();
    const rawRates = parseCBARXml(xml);
    
    const rates: Record<string, number> = {};
    for (const [code, data] of Object.entries(rawRates)) {
      rates[code] = data.nominal / data.value;
    }
    return rates;
  } catch (error) {
    console.error("CBAR fetch error:", error);
    return {};
  }
}

// Fetch rates from FreeCurrencyAPI for currencies not in CBAR
async function fetchFreeCurrencyRates(excludeCodes: string[]): Promise<Record<string, number>> {
  if (!FREECURRENCY_API_KEY) {
    console.warn("FreeCurrencyAPI key not configured");
    return {};
  }
  
  // Get currencies not in CBAR
  const neededCurrencies = FREECURRENCY_SUPPORTED.filter(c => !excludeCodes.includes(c));
  if (neededCurrencies.length === 0) return {};
  
  try {
    const url = `${FREECURRENCY_API_URL}?currencies=${neededCurrencies.join(",")}`;
    const response = await fetch(url, {
      headers: { "apikey": FREECURRENCY_API_KEY },
    });
    
    if (!response.ok) {
      throw new Error(`FreeCurrencyAPI error: ${response.status}`);
    }
    
    const data = await response.json();
    const usdRates = data.data;
    
    // FreeCurrencyAPI returns rates relative to USD
    // We need rates relative to AZN
    // Fixed: 1 USD = 1.70 AZN (CBAR official rate)
    const usdToAzn = 1.70;
    
    const rates: Record<string, number> = {};
    for (const [code, usdRate] of Object.entries(usdRates)) {
      // usdRate = how many of currency per 1 USD
      // aznRate = how many AZN per 1 USD = 1.70
      // rateToAZN = usdRate / aznRate
      rates[code] = (usdRate as number) / usdToAzn;
    }
    
    return rates;
  } catch (error) {
    console.error("FreeCurrencyAPI fetch error:", error);
    return {};
  }
}

// POST - Update FX rates from both CBAR and FreeCurrencyAPI
export async function POST() {
  try {
    const now = new Date();
    const updatedCurrencies: { code: string; rateToAZN: number; source: string }[] = [];
    
    // 1. Fetch CBAR rates (primary source for AZN-based rates)
    console.log("Fetching CBAR rates...");
    const cbarRates = await fetchCBARRates();
    const cbarCodes = Object.keys(cbarRates);
    console.log(`CBAR: Found ${cbarCodes.length} currencies`);
    
    // 2. Fetch FreeCurrencyAPI rates for missing currencies
    console.log("Fetching FreeCurrencyAPI rates...");
    const freeCurrencyRates = await fetchFreeCurrencyRates(cbarCodes);
    console.log(`FreeCurrencyAPI: Found ${Object.keys(freeCurrencyRates).length} additional currencies`);
    
    // 3. Update AZN (base currency)
    await prisma.currency.upsert({
      where: { code: "AZN" },
      update: { rateToAZN: 1, lastUpdated: now },
      create: {
        code: "AZN",
        symbol: "₼",
        nameAz: "Azərbaycan Manatı",
        nameEn: "Azerbaijani Manat",
        rateToAZN: 1,
        isBase: true,
        isActive: true,
        lastUpdated: now,
      },
    });
    updatedCurrencies.push({ code: "AZN", rateToAZN: 1, source: "base" });
    
    // 4. Update CBAR currencies
    for (const [code, rateToAZN] of Object.entries(cbarRates)) {
      const info = CURRENCY_INFO[code] || { symbol: code, nameAz: code, nameEn: code };
      
      await prisma.currency.upsert({
        where: { code },
        update: { rateToAZN, lastUpdated: now },
        create: {
          code,
          symbol: info.symbol,
          nameAz: info.nameAz,
          nameEn: info.nameEn,
          rateToAZN,
          isBase: false,
          isActive: true,
          lastUpdated: now,
        },
      });
      
      await prisma.fxRateHistory.create({
        data: { currencyCode: code, rateToAZN, source: "cbar", fetchedAt: now },
      });
      
      updatedCurrencies.push({ code, rateToAZN, source: "cbar" });
    }
    
    // 5. Update FreeCurrencyAPI currencies (only those not in CBAR)
    for (const [code, rateToAZN] of Object.entries(freeCurrencyRates)) {
      const info = CURRENCY_INFO[code] || { symbol: code, nameAz: code, nameEn: code };
      
      await prisma.currency.upsert({
        where: { code },
        update: { rateToAZN, lastUpdated: now },
        create: {
          code,
          symbol: info.symbol,
          nameAz: info.nameAz,
          nameEn: info.nameEn,
          rateToAZN,
          isBase: false,
          isActive: true,
          lastUpdated: now,
        },
      });
      
      await prisma.fxRateHistory.create({
        data: { currencyCode: code, rateToAZN, source: "freecurrencyapi", fetchedAt: now },
      });
      
      updatedCurrencies.push({ code, rateToAZN, source: "freecurrencyapi" });
    }
    
    return NextResponse.json({
      success: true,
      message: "FX rates updated successfully",
      updatedAt: now.toISOString(),
      summary: {
        total: updatedCurrencies.length,
        cbar: updatedCurrencies.filter(c => c.source === "cbar").length,
        freecurrencyapi: updatedCurrencies.filter(c => c.source === "freecurrencyapi").length,
      },
      currencies: updatedCurrencies,
    });
  } catch (error) {
    console.error("FX Rate Update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Xəta baş verdi" },
      { status: 500 }
    );
  }
}

// GET - Get last update info
export async function GET() {
  try {
    const currencies = await prisma.currency.findMany({
      where: { isActive: true },
      orderBy: { lastUpdated: "desc" },
      take: 1,
    });

    const cbarHistory = await prisma.fxRateHistory.findFirst({
      where: { source: "cbar" },
      orderBy: { fetchedAt: "desc" },
    });
    
    const freeCurrencyHistory = await prisma.fxRateHistory.findFirst({
      where: { source: "freecurrencyapi" },
      orderBy: { fetchedAt: "desc" },
    });

    const totalCurrencies = await prisma.currency.count({
      where: { isActive: true },
    });

    return NextResponse.json({
      lastUpdated: currencies[0]?.lastUpdated || null,
      totalCurrencies,
      sources: {
        cbar: {
          lastFetched: cbarHistory?.fetchedAt || null,
        },
        freecurrencyapi: {
          lastFetched: freeCurrencyHistory?.fetchedAt || null,
        },
      },
    });
  } catch (error) {
    console.error("FX Rate Info error:", error);
    return NextResponse.json(
      { error: "Xəta baş verdi" },
      { status: 500 }
    );
  }
}
