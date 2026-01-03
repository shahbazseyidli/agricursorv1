/**
 * V2 Comparison API
 * 
 * Returns raw price data for cross-country comparison.
 * Supports multiple data sources per country.
 * Frontend handles currency/unit conversion using conversion rates.
 * 
 * Query params:
 * - product: product slug (required)
 * - selections: JSON array of {countryCode, dataSource} (required)
 * - periodType: WEEKLY | MONTHLY | ANNUAL (default: ANNUAL)
 * - yearFrom: start year (default: 2015)
 * - yearTo: end year (default: 2025)
 * 
 * Example: ?product=apple&selections=[{"countryCode":"AZ","dataSource":"AGRO_AZ"},{"countryCode":"DE","dataSource":"FAOSTAT"}]
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// FAO code to ISO2 mapping
const FAO_TO_ISO: Record<string, string> = {
  "52": "AZ", "11": "AT", "255": "BE", "167": "CZ", "67": "FI",
  "68": "FR", "79": "DE", "99": "IS", "100": "IN", "106": "IT",
  "256": "LU", "162": "NO", "174": "PT", "185": "RU", "203": "ES",
  "229": "GB", "80": "BA", "233": "BF",
};

const ISO_TO_FAO: Record<string, string> = Object.fromEntries(
  Object.entries(FAO_TO_ISO).map(([k, v]) => [v, k])
);

interface Selection {
  countryCode: string;
  dataSource: string; // FAOSTAT | EUROSTAT | AGRO_AZ
}

interface PricePoint {
  year: number;
  period: number | null;
  price: number;
  priceMin?: number;
  priceMax?: number;
  sampleCount?: number;
}

interface Series {
  countryCode: string;
  countryName: string;
  dataSource: string;
  sourceName: string;
  currency: string;
  unit: string;
  periodType: string;
  data: PricePoint[];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const productSlug = searchParams.get("product");
    const selectionsParam = searchParams.get("selections");
    const periodType = searchParams.get("periodType") || "ANNUAL";
    const yearFrom = parseInt(searchParams.get("yearFrom") || "2015");
    const yearTo = parseInt(searchParams.get("yearTo") || "2025");
    
    if (!productSlug) {
      return NextResponse.json({
        success: false,
        error: "Product slug is required",
      }, { status: 400 });
    }
    
    // Parse selections
    let selections: Selection[] = [];
    if (selectionsParam) {
      try {
        selections = JSON.parse(selectionsParam);
      } catch {
        return NextResponse.json({
          success: false,
          error: "Invalid selections format",
        }, { status: 400 });
      }
    } else {
      // Default: AZ with AGRO_AZ
      selections = [{ countryCode: "AZ", dataSource: "AGRO_AZ" }];
    }
    
    // Get GlobalProduct
    const globalProduct = await prisma.globalProduct.findUnique({
      where: { slug: productSlug },
      include: {
        euProducts: { select: { id: true, nameEn: true } },
        faoProducts: { select: { id: true, itemCode: true, nameEn: true } },
      },
    });
    
    if (!globalProduct) {
      return NextResponse.json({
        success: false,
        error: "Product not found",
      }, { status: 404 });
    }
    
    const series: Series[] = [];
    
    // Process each selection
    for (const sel of selections) {
      const seriesData = await getSeriesData(
        sel,
        globalProduct,
        periodType,
        yearFrom,
        yearTo
      );
      
      if (seriesData) {
        series.push(seriesData);
      }
    }
    
    // Fetch conversion rates
    const currencies = await prisma.currency.findMany({
      where: { isActive: true },
    });
    
    const units = await prisma.unit.findMany({
      where: { isActive: true },
    });
    
    const conversionRates = {
      currencies: Object.fromEntries(
        currencies.map(c => [c.code, {
          code: c.code,
          symbol: c.symbol,
          rateToAZN: c.rateToAZN,
          rateFromAZN: c.rateToAZN === 0 ? 1 : 1 / c.rateToAZN,
        }])
      ),
      units: Object.fromEntries(
        units.map(u => [u.code, {
          code: u.code,
          nameAz: u.nameAz,
          nameEn: u.nameEn,
          conversionRate: u.conversionRate,
          baseUnit: u.baseUnit,
        }])
      ),
    };
    
    return NextResponse.json({
      success: true,
      data: {
        product: {
          slug: globalProduct.slug,
          nameAz: globalProduct.nameAz,
          nameEn: globalProduct.nameEn,
          category: globalProduct.category,
        },
        yearRange: { from: yearFrom, to: yearTo },
        series,
      },
      conversionRates,
    });
    
  } catch (error) {
    console.error("Error in V2 comparison API:", error);
    return NextResponse.json({
      success: false,
      error: "Internal server error",
    }, { status: 500 });
  }
}

async function getSeriesData(
  selection: Selection,
  globalProduct: {
    id: string;
    euProducts: { id: string; nameEn: string }[];
    faoProducts: { id: string; itemCode: string; nameEn: string }[];
  },
  periodType: string,
  yearFrom: number,
  yearTo: number
): Promise<Series | null> {
  const { countryCode, dataSource } = selection;
  
  if (dataSource === "AGRO_AZ") {
    // Get AZ aggregate data
    const azData = await prisma.globalAzAggregate.findMany({
      where: {
        globalProductId: globalProduct.id,
        marketTypeCode: "FARMGATE", // Use FARMGATE for FAO/EU comparison
        periodType: periodType,
        year: { gte: yearFrom, lte: yearTo },
      },
      orderBy: [{ year: "asc" }, { period: "asc" }],
    });
    
    if (azData.length === 0) return null;
    
    return {
      countryCode: "AZ",
      countryName: "Azərbaycan",
      dataSource: "AGRO_AZ",
      sourceName: "Agro.gov.az",
      currency: "AZN",
      unit: "kg",
      periodType,
      data: azData.map(d => ({
        year: d.year,
        period: d.period,
        price: d.avgPrice,
        priceMin: d.minPrice,
        priceMax: d.maxPrice,
        sampleCount: d.sampleCount,
      })),
    };
  }
  
  if (dataSource === "FAOSTAT") {
    // Find FAO country
    const faoCode = ISO_TO_FAO[countryCode] || countryCode;
    const faoCountry = await prisma.faoCountry.findFirst({
      where: { 
        OR: [
          { code: faoCode },
          { code: countryCode },
        ]
      },
    });
    
    if (!faoCountry || globalProduct.faoProducts.length === 0) return null;
    
    const faoProductIds = globalProduct.faoProducts.map(fp => fp.id);
    
    const faoData = await prisma.faoPrice.findMany({
      where: {
        productId: { in: faoProductIds },
        countryId: faoCountry.id,
        year: { gte: yearFrom, lte: yearTo },
        elementCode: "5532", // USD prices
      },
      orderBy: { year: "asc" },
    });
    
    if (faoData.length === 0) return null;
    
    return {
      countryCode,
      countryName: faoCountry.nameAz || faoCountry.nameEn,
      dataSource: "FAOSTAT",
      sourceName: "FAO - FAOSTAT",
      currency: "USD",
      unit: "ton",
      periodType: "ANNUAL",
      data: faoData.map(d => ({
        year: d.year,
        period: null,
        price: d.price,
      })),
    };
  }
  
  if (dataSource === "EUROSTAT") {
    // Find EU country
    const euCountry = await prisma.euCountry.findUnique({
      where: { code: countryCode },
    });
    
    if (!euCountry || globalProduct.euProducts.length === 0) return null;
    
    const euProductIds = globalProduct.euProducts.map(ep => ep.id);
    
    const euData = await prisma.euPrice.findMany({
      where: {
        productId: { in: euProductIds },
        countryId: euCountry.id,
        year: { gte: yearFrom, lte: yearTo },
        priceStage: "PRODUCER",
      },
      orderBy: [{ year: "asc" }, { period: "asc" }],
    });
    
    if (euData.length === 0) return null;
    
    return {
      countryCode,
      countryName: euCountry.nameAz || euCountry.nameEn,
      dataSource: "EUROSTAT",
      sourceName: "Eurostat",
      currency: "EUR",
      unit: "100kg",
      periodType: "ANNUAL",
      data: euData.map(d => ({
        year: d.year,
        period: d.period,
        price: d.price,
      })),
    };
  }
  
  return null;
}
