/**
 * Conversion Rates API
 * 
 * Returns currency and unit conversion rates for frontend use.
 * This enables the hybrid conversion approach where API returns raw data
 * and frontend handles conversions.
 * 
 * Base Currency: USD
 * Base Unit: kg
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch currencies
    const currencies = await prisma.currency.findMany({
      where: { isActive: true },
      select: {
        code: true,
        symbol: true,
        rateToUSD: true,
        nameAz: true,
        nameEn: true,
      },
    });

    // Fetch units
    const units = await prisma.unit.findMany({
      where: { isActive: true },
      select: {
        code: true,
        nameAz: true,
        nameEn: true,
        symbol: true,
        conversionRate: true,
        baseUnit: true,
        category: true,
      },
    });

    // Format currencies (USD-based)
    const currencyRates: Record<string, {
      code: string;
      symbol: string;
      rateToUSD: number;
      rateFromUSD: number;
      nameAz: string;
      nameEn: string | null;
    }> = {};

    for (const cur of currencies) {
      currencyRates[cur.code] = {
        code: cur.code,
        symbol: cur.symbol,
        rateToUSD: cur.rateToUSD, // 1 USD = X of this currency
        rateFromUSD: cur.rateToUSD === 0 ? 1 : 1 / cur.rateToUSD, // 1 of this currency = X USD
        nameAz: cur.nameAz,
        nameEn: cur.nameEn,
      };
    }

    // Format units
    const unitRates: Record<string, {
      code: string;
      nameAz: string;
      nameEn: string;
      symbol: string | null;
      conversionRate: number;
      baseUnit: string;
      category: string;
    }> = {};

    for (const unit of units) {
      unitRates[unit.code] = {
        code: unit.code,
        nameAz: unit.nameAz,
        nameEn: unit.nameEn,
        symbol: unit.symbol,
        conversionRate: unit.conversionRate,
        baseUnit: unit.baseUnit,
        category: unit.category,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        currencies: currencyRates,
        units: unitRates,
        baseCurrency: "USD",
        baseUnit: "kg",
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching conversion rates:", error);
    
    // Return default rates on error (USD-based)
    return NextResponse.json({
      success: true,
      data: {
        currencies: {
          USD: { code: "USD", symbol: "$", rateToUSD: 1, rateFromUSD: 1, nameAz: "ABŞ Dolları", nameEn: "US Dollar" },
          EUR: { code: "EUR", symbol: "€", rateToUSD: 0.92, rateFromUSD: 1.09, nameAz: "Avro", nameEn: "Euro" },
          AZN: { code: "AZN", symbol: "₼", rateToUSD: 1.70, rateFromUSD: 0.59, nameAz: "Azərbaycan Manatı", nameEn: "Azerbaijani Manat" },
          RUB: { code: "RUB", symbol: "₽", rateToUSD: 90.0, rateFromUSD: 0.011, nameAz: "Rus Rublu", nameEn: "Russian Ruble" },
          TRY: { code: "TRY", symbol: "₺", rateToUSD: 32.0, rateFromUSD: 0.031, nameAz: "Türk Lirəsi", nameEn: "Turkish Lira" },
          GBP: { code: "GBP", symbol: "£", rateToUSD: 0.79, rateFromUSD: 1.27, nameAz: "İngilis Funtu", nameEn: "British Pound" },
        },
        units: {
          kg: { code: "kg", nameAz: "Kiloqram", nameEn: "Kilogram", symbol: "kg", conversionRate: 1, baseUnit: "kg", category: "weight" },
          "100kg": { code: "100kg", nameAz: "100 Kiloqram", nameEn: "100 Kilograms", symbol: "100kg", conversionRate: 0.01, baseUnit: "kg", category: "weight" },
          ton: { code: "ton", nameAz: "Ton", nameEn: "Tonne", symbol: "t", conversionRate: 0.001, baseUnit: "kg", category: "weight" },
          lb: { code: "lb", nameAz: "Funt", nameEn: "Pound", symbol: "lb", conversionRate: 2.205, baseUnit: "kg", category: "weight" },
          g: { code: "g", nameAz: "Qram", nameEn: "Gram", symbol: "g", conversionRate: 1000, baseUnit: "kg", category: "weight" },
        },
        baseCurrency: "USD",
        baseUnit: "kg",
        lastUpdated: new Date().toISOString(),
      },
    });
  }
}
