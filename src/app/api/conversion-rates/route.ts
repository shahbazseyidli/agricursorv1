/**
 * Conversion Rates API
 * 
 * Returns currency and unit conversion rates for frontend use.
 * This enables the hybrid conversion approach where API returns raw data
 * and frontend handles conversions.
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
        rateToAZN: true,
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

    // Format currencies
    const currencyRates: Record<string, {
      code: string;
      symbol: string;
      rateToAZN: number;
      rateFromAZN: number;
      nameAz: string;
      nameEn: string | null;
    }> = {};

    for (const cur of currencies) {
      currencyRates[cur.code] = {
        code: cur.code,
        symbol: cur.symbol,
        rateToAZN: cur.rateToAZN,
        rateFromAZN: cur.rateToAZN === 0 ? 1 : 1 / cur.rateToAZN,
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
        baseCurrency: "AZN",
        baseUnit: "kg",
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching conversion rates:", error);
    
    // Return default rates on error
    return NextResponse.json({
      success: true,
      data: {
        currencies: {
          AZN: { code: "AZN", symbol: "₼", rateToAZN: 1, rateFromAZN: 1, nameAz: "Azərbaycan Manatı", nameEn: "Azerbaijani Manat" },
          USD: { code: "USD", symbol: "$", rateToAZN: 0.59, rateFromAZN: 1.70, nameAz: "ABŞ Dolları", nameEn: "US Dollar" },
          EUR: { code: "EUR", symbol: "€", rateToAZN: 0.55, rateFromAZN: 1.82, nameAz: "Avro", nameEn: "Euro" },
          RUB: { code: "RUB", symbol: "₽", rateToAZN: 53.0, rateFromAZN: 0.019, nameAz: "Rus Rublu", nameEn: "Russian Ruble" },
          TRY: { code: "TRY", symbol: "₺", rateToAZN: 19.0, rateFromAZN: 0.053, nameAz: "Türk Lirəsi", nameEn: "Turkish Lira" },
        },
        units: {
          kg: { code: "kg", nameAz: "Kiloqram", nameEn: "Kilogram", symbol: "kg", conversionRate: 1, baseUnit: "kg", category: "weight" },
          "100kg": { code: "100kg", nameAz: "100 Kiloqram", nameEn: "100 Kilograms", symbol: "100kg", conversionRate: 0.01, baseUnit: "kg", category: "weight" },
          ton: { code: "ton", nameAz: "Ton", nameEn: "Tonne", symbol: "t", conversionRate: 0.001, baseUnit: "kg", category: "weight" },
          lb: { code: "lb", nameAz: "Funt", nameEn: "Pound", symbol: "lb", conversionRate: 2.205, baseUnit: "kg", category: "weight" },
          g: { code: "g", nameAz: "Qram", nameEn: "Gram", symbol: "g", conversionRate: 1000, baseUnit: "kg", category: "weight" },
        },
        baseCurrency: "AZN",
        baseUnit: "kg",
        lastUpdated: new Date().toISOString(),
      },
    });
  }
}

