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
 * - marketType: FARMGATE | RETAIL | WHOLESALE | PROCESSING (default: FARMGATE)
 * - yearFrom: start year (default: 2015)
 * - yearTo: end year (default: 2025)
 * 
 * Example: ?product=apple&selections=[{"countryCode":"AZ","dataSource":"AGRO_AZ"},{"countryCode":"DE","dataSource":"FAOSTAT"}]&marketType=RETAIL
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// FAO code to ISO2 mapping (complete)
const FAO_TO_ISO: Record<string, string> = {
  "11": "AT", "52": "AZ", "255": "BE", "27": "BG", "80": "BA",
  "167": "CZ", "67": "FI", "68": "FR", "73": "GE", "79": "DE",
  "84": "GR", "97": "IS", "99": "HU", "100": "IN", "102": "IR",
  "106": "IT", "256": "LU", "150": "NL", "162": "NO", "173": "PL",
  "174": "PT", "183": "RO", "185": "RU", "203": "ES", "223": "TR",
  "230": "UA", "229": "GB",
};

const ISO_TO_FAO: Record<string, string> = Object.fromEntries(
  Object.entries(FAO_TO_ISO).map(([k, v]) => [v, k])
);

interface Selection {
  countryCode: string;
  dataSource: string; // FAOSTAT | EUROSTAT | AGRO_AZ | FAO_FPMA
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
    const marketType = searchParams.get("marketType") || "FARMGATE"; // FARMGATE | RETAIL | WHOLESALE | PROCESSING
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
        fpmaCommodities: { select: { id: true, code: true, nameEn: true } },
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
        marketType,
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
        marketType,
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

// Market type display names
const MARKET_TYPE_NAMES: Record<string, { az: string; en: string }> = {
  "FARMGATE": { az: "Sahə qiyməti", en: "Farmgate" },
  "RETAIL": { az: "Pərakəndə", en: "Retail" },
  "WHOLESALE": { az: "Topdan", en: "Wholesale" },
  "PROCESSING": { az: "Emal", en: "Processing" },
};

async function getSeriesData(
  selection: Selection,
  globalProduct: {
    id: string;
    euProducts: { id: string; nameEn: string }[];
    faoProducts: { id: string; itemCode: string; nameEn: string }[];
    fpmaCommodities: { id: string; code: string; nameEn: string }[];
  },
  periodType: string,
  marketType: string,
  yearFrom: number,
  yearTo: number
): Promise<Series | null> {
  const { countryCode, dataSource } = selection;
  
  if (dataSource === "AGRO_AZ") {
    // Get AZ aggregate data with selected market type
    const azData = await prisma.globalAzAggregate.findMany({
      where: {
        globalProductId: globalProduct.id,
        marketTypeCode: marketType, // Use user-selected market type
        periodType: periodType,
        year: { gte: yearFrom, lte: yearTo },
      },
      orderBy: [{ year: "asc" }, { period: "asc" }],
    });
    
    if (azData.length === 0) return null;
    
    const marketTypeName = MARKET_TYPE_NAMES[marketType]?.az || marketType;
    
    return {
      countryCode: "AZ",
      countryName: "Azərbaycan",
      dataSource: "AGRO_AZ",
      sourceName: `Agro.gov.az (${marketTypeName})`,
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
  
  if (dataSource === "FAO_FPMA") {
    // ISO3 to ISO2 mapping
    const ISO2_TO_ISO3: Record<string, string> = {
      "AF": "AFG", "AL": "ALB", "DZ": "DZA", "AO": "AGO", "AR": "ARG",
      "AM": "ARM", "AU": "AUS", "AT": "AUT", "AZ": "AZE", "BD": "BGD",
      "BY": "BLR", "BE": "BEL", "BJ": "BEN", "BO": "BOL", "BA": "BIH",
      "BW": "BWA", "BR": "BRA", "BG": "BGR", "BF": "BFA", "BI": "BDI",
      "KH": "KHM", "CM": "CMR", "CA": "CAN", "CF": "CAF", "TD": "TCD",
      "CL": "CHL", "CN": "CHN", "CO": "COL", "CD": "COD", "CG": "COG",
      "CR": "CRI", "CI": "CIV", "HR": "HRV", "CY": "CYP", "CZ": "CZE",
      "DK": "DNK", "DJ": "DJI", "DO": "DOM", "EC": "ECU", "EG": "EGY",
      "SV": "SLV", "ET": "ETH", "FI": "FIN", "FR": "FRA", "GA": "GAB",
      "GM": "GMB", "GE": "GEO", "DE": "DEU", "GH": "GHA", "GR": "GRC",
      "GT": "GTM", "GN": "GIN", "GW": "GNB", "HT": "HTI", "HN": "HND",
      "HU": "HUN", "IN": "IND", "ID": "IDN", "IR": "IRN", "IQ": "IRQ",
      "IE": "IRL", "IL": "ISR", "IT": "ITA", "JM": "JAM", "JP": "JPN",
      "JO": "JOR", "KZ": "KAZ", "KE": "KEN", "KG": "KGZ", "LA": "LAO",
      "LV": "LVA", "LB": "LBN", "LS": "LSO", "LR": "LBR", "LY": "LBY",
      "LT": "LTU", "MG": "MDG", "MW": "MWI", "MY": "MYS", "ML": "MLI",
      "MR": "MRT", "MX": "MEX", "MD": "MDA", "MN": "MNG", "MA": "MAR",
      "MZ": "MOZ", "MM": "MMR", "NA": "NAM", "NP": "NPL", "NL": "NLD",
      "NZ": "NZL", "NI": "NIC", "NE": "NER", "NG": "NGA", "NO": "NOR",
      "PK": "PAK", "PA": "PAN", "PY": "PRY", "PE": "PER", "PH": "PHL",
      "PL": "POL", "PT": "PRT", "RO": "ROU", "RU": "RUS", "RW": "RWA",
      "SN": "SEN", "RS": "SRB", "SL": "SLE", "SK": "SVK", "SI": "SVN",
      "SO": "SOM", "ZA": "ZAF", "KR": "KOR", "SS": "SSD", "ES": "ESP",
      "LK": "LKA", "SD": "SDN", "SZ": "SWZ", "SE": "SWE", "CH": "CHE",
      "SY": "SYR", "TJ": "TJK", "TZ": "TZA", "TH": "THA", "TG": "TGO",
      "TN": "TUN", "TR": "TUR", "TM": "TKM", "UG": "UGA", "UA": "UKR",
      "GB": "GBR", "US": "USA", "UY": "URY", "UZ": "UZB", "VE": "VEN",
      "VN": "VNM", "YE": "YEM", "ZM": "ZMB", "ZW": "ZWE",
    };
    
    // Find FPMA country
    const iso3 = ISO2_TO_ISO3[countryCode] || countryCode;
    const fpmaCountry = await prisma.fpmaCountry.findFirst({
      where: {
        OR: [
          { iso3: iso3 },
          { iso2: countryCode },
        ],
      },
    });
    
    if (!fpmaCountry || globalProduct.fpmaCommodities.length === 0) return null;
    
    const commodityIds = globalProduct.fpmaCommodities.map(c => c.id);
    
    // Get series for this country and commodities
    const series = await prisma.fpmaSerie.findMany({
      where: {
        commodityId: { in: commodityIds },
        countryId: fpmaCountry.id,
        priceType: marketType === "WHOLESALE" ? "WHOLESALE" : "RETAIL",
      },
      select: { id: true, currency: true, measureUnitNormalized: true, conversionFactor: true },
    });
    
    if (series.length === 0) return null;
    
    const seriesIds = series.map(s => s.id);
    
    // Get prices
    const fpmaData = await prisma.fpmaPrice.findMany({
      where: {
        serieId: { in: seriesIds },
        date: {
          gte: new Date(`${yearFrom}-01-01`),
          lte: new Date(`${yearTo}-12-31`),
        },
      },
      orderBy: { date: "asc" },
    });
    
    if (fpmaData.length === 0) return null;
    
    // Group by year/month and calculate average
    const groupedData = new Map<string, { sum: number; count: number }>();
    for (const d of fpmaData) {
      const year = d.date.getFullYear();
      const month = d.date.getMonth() + 1;
      const key = periodType === "MONTHLY" ? `${year}-${month}` : `${year}`;
      
      if (!groupedData.has(key)) {
        groupedData.set(key, { sum: 0, count: 0 });
      }
      const group = groupedData.get(key)!;
      group.sum += d.priceNormalized || d.price;
      group.count += 1;
    }
    
    const data: PricePoint[] = [];
    for (const [key, group] of groupedData) {
      const parts = key.split("-");
      data.push({
        year: parseInt(parts[0]),
        period: parts.length > 1 ? parseInt(parts[1]) : null,
        price: group.sum / group.count,
      });
    }
    
    // Sort by year and period
    data.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return (a.period || 0) - (b.period || 0);
    });
    
    const firstSeries = series[0];
    const priceTypeName = marketType === "WHOLESALE" ? "Topdansatış" : "Pərakəndə";
    
    return {
      countryCode,
      countryName: fpmaCountry.nameAz || fpmaCountry.nameEn,
      dataSource: "FAO_FPMA",
      sourceName: `FAO FPMA (${priceTypeName})`,
      currency: firstSeries.currency || "USD",
      unit: firstSeries.measureUnitNormalized || "kg",
      periodType: periodType === "MONTHLY" ? "MONTHLY" : "ANNUAL",
      data,
    };
  }
  
  return null;
}
