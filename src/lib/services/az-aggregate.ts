/**
 * Azerbaijan Price Aggregate Service
 * 
 * Calculates weekly and monthly average prices from raw price data
 * Aggregated by market type (Retail, Wholesale, Farmgate, Processing)
 * Used for comparison with EU prices
 */

import { prisma } from "@/lib/prisma";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, getWeek, getMonth, getYear } from "date-fns";

// Source information
export const AZ_SOURCE = {
  code: "AZ_AGRO",
  name: "Azərbaycan Kənd Təsərrüfatı Nazirliyi (agro.gov.az)",
  url: "https://agro.gov.az/"
};

interface AggregateResult {
  success: boolean;
  periodsProcessed: number;
  aggregatesCreated: number;
  aggregatesUpdated: number;
  errors: string[];
}

/**
 * Get ISO week number (1-53)
 */
function getISOWeek(date: Date): number {
  return getWeek(date, { weekStartsOn: 1 });
}

/**
 * Calculate weekly aggregates for a product
 */
export async function calculateWeeklyAggregates(
  productId: string,
  year: number,
  countryId?: string
): Promise<AggregateResult> {
  const errors: string[] = [];
  let aggregatesCreated = 0;
  let aggregatesUpdated = 0;
  
  try {
    // Get product's country if not specified
    if (!countryId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { countryId: true }
      });
      if (!product) {
        return { success: false, periodsProcessed: 0, aggregatesCreated: 0, aggregatesUpdated: 0, errors: ["Product not found"] };
      }
      countryId = product.countryId;
    }
    
    // Get all market types for this country
    const marketTypes = await prisma.marketType.findMany({
      where: { countryId }
    });
    
    // Get all product types for this product
    const productTypes = await prisma.productType.findMany({
      where: { productId }
    });
    
    // Add null for "all types" aggregate
    const productTypeIds: (string | null)[] = [null, ...productTypes.map(pt => pt.id)];
    
    // Process each week of the year
    for (let week = 1; week <= 53; week++) {
      // Calculate week start and end dates
      const yearStart = new Date(year, 0, 1);
      const weekStart = startOfWeek(new Date(year, 0, 1 + (week - 1) * 7), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      
      // Skip if week is in different year
      if (getYear(weekStart) !== year && getYear(weekEnd) !== year) continue;
      
      // Process each market type
      for (const marketType of marketTypes) {
        // Process each product type (including null for all)
        for (const productTypeId of productTypeIds) {
          try {
            // Get prices for this week/marketType/productType
            const prices = await prisma.price.findMany({
              where: {
                productId,
                countryId,
                date: {
                  gte: weekStart,
                  lte: weekEnd
                },
                productTypeId: productTypeId || undefined,
                market: {
                  marketTypeId: marketType.id
                }
              },
              select: {
                priceAvg: true,
                priceMin: true,
                priceMax: true
              }
            });
            
            if (prices.length === 0) continue;
            
            // Calculate aggregates
            const avgPrice = prices.reduce((sum, p) => sum + p.priceAvg, 0) / prices.length;
            const minPrice = Math.min(...prices.map(p => p.priceMin));
            const maxPrice = Math.max(...prices.map(p => p.priceMax));
            
            // Upsert aggregate record
            const existing = await prisma.azPriceAggregate.findFirst({
              where: {
                productId,
                productTypeId: productTypeId || undefined,
                marketTypeId: marketType.id,
                countryId,
                year,
                period: week,
                periodType: "Week"
              }
            });
            
            const aggregateData = {
              productId,
              productTypeId,
              countryId,
              marketTypeId: marketType.id,
              avgPrice: Math.round(avgPrice * 100) / 100,
              minPrice: Math.round(minPrice * 100) / 100,
              maxPrice: Math.round(maxPrice * 100) / 100,
              priceCount: prices.length,
              periodType: "Week",
              period: week,
              year,
              startDate: weekStart,
              endDate: weekEnd,
              source: AZ_SOURCE.code,
              sourceName: AZ_SOURCE.name
            };
            
            if (existing) {
              await prisma.azPriceAggregate.update({
                where: { id: existing.id },
                data: aggregateData
              });
              aggregatesUpdated++;
            } else {
              await prisma.azPriceAggregate.create({
                data: aggregateData
              });
              aggregatesCreated++;
            }
            
          } catch (error) {
            errors.push(`Week ${week}, MarketType ${marketType.code}, ProductType ${productTypeId}: ${error}`);
          }
        }
      }
    }
    
    return {
      success: true,
      periodsProcessed: 53,
      aggregatesCreated,
      aggregatesUpdated,
      errors
    };
    
  } catch (error) {
    return {
      success: false,
      periodsProcessed: 0,
      aggregatesCreated,
      aggregatesUpdated,
      errors: [...errors, String(error)]
    };
  }
}

/**
 * Calculate monthly aggregates for a product
 */
export async function calculateMonthlyAggregates(
  productId: string,
  year: number,
  countryId?: string
): Promise<AggregateResult> {
  const errors: string[] = [];
  let aggregatesCreated = 0;
  let aggregatesUpdated = 0;
  
  try {
    // Get product's country if not specified
    if (!countryId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { countryId: true }
      });
      if (!product) {
        return { success: false, periodsProcessed: 0, aggregatesCreated: 0, aggregatesUpdated: 0, errors: ["Product not found"] };
      }
      countryId = product.countryId;
    }
    
    // Get all market types for this country
    const marketTypes = await prisma.marketType.findMany({
      where: { countryId }
    });
    
    // Get all product types for this product
    const productTypes = await prisma.productType.findMany({
      where: { productId }
    });
    
    // Add null for "all types" aggregate
    const productTypeIds: (string | null)[] = [null, ...productTypes.map(pt => pt.id)];
    
    // Process each month of the year
    for (let month = 1; month <= 12; month++) {
      const monthStart = startOfMonth(new Date(year, month - 1, 1));
      const monthEnd = endOfMonth(monthStart);
      
      // Process each market type
      for (const marketType of marketTypes) {
        // Process each product type (including null for all)
        for (const productTypeId of productTypeIds) {
          try {
            // Get prices for this month/marketType/productType
            const prices = await prisma.price.findMany({
              where: {
                productId,
                countryId,
                date: {
                  gte: monthStart,
                  lte: monthEnd
                },
                productTypeId: productTypeId || undefined,
                market: {
                  marketTypeId: marketType.id
                }
              },
              select: {
                priceAvg: true,
                priceMin: true,
                priceMax: true
              }
            });
            
            if (prices.length === 0) continue;
            
            // Calculate aggregates
            const avgPrice = prices.reduce((sum, p) => sum + p.priceAvg, 0) / prices.length;
            const minPrice = Math.min(...prices.map(p => p.priceMin));
            const maxPrice = Math.max(...prices.map(p => p.priceMax));
            
            // Upsert aggregate record
            const existing = await prisma.azPriceAggregate.findFirst({
              where: {
                productId,
                productTypeId: productTypeId || undefined,
                marketTypeId: marketType.id,
                countryId,
                year,
                period: month,
                periodType: "Month"
              }
            });
            
            const aggregateData = {
              productId,
              productTypeId,
              countryId,
              marketTypeId: marketType.id,
              avgPrice: Math.round(avgPrice * 100) / 100,
              minPrice: Math.round(minPrice * 100) / 100,
              maxPrice: Math.round(maxPrice * 100) / 100,
              priceCount: prices.length,
              periodType: "Month",
              period: month,
              year,
              startDate: monthStart,
              endDate: monthEnd,
              source: AZ_SOURCE.code,
              sourceName: AZ_SOURCE.name
            };
            
            if (existing) {
              await prisma.azPriceAggregate.update({
                where: { id: existing.id },
                data: aggregateData
              });
              aggregatesUpdated++;
            } else {
              await prisma.azPriceAggregate.create({
                data: aggregateData
              });
              aggregatesCreated++;
            }
            
          } catch (error) {
            errors.push(`Month ${month}, MarketType ${marketType.code}, ProductType ${productTypeId}: ${error}`);
          }
        }
      }
    }
    
    return {
      success: true,
      periodsProcessed: 12,
      aggregatesCreated,
      aggregatesUpdated,
      errors
    };
    
  } catch (error) {
    return {
      success: false,
      periodsProcessed: 0,
      aggregatesCreated,
      aggregatesUpdated,
      errors: [...errors, String(error)]
    };
  }
}

/**
 * Sync all aggregates for all products in a year range
 */
export async function syncAllAggregates(
  startYear: number,
  endYear: number,
  countryId?: string
): Promise<{
  success: boolean;
  productsProcessed: number;
  totalAggregatesCreated: number;
  totalAggregatesUpdated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let totalAggregatesCreated = 0;
  let totalAggregatesUpdated = 0;
  
  try {
    // Get all products (optionally filtered by country)
    const products = await prisma.product.findMany({
      where: countryId ? { countryId } : undefined,
      select: { id: true, name: true, countryId: true }
    });
    
    console.log(`AZ Aggregate Sync: Processing ${products.length} products for years ${startYear}-${endYear}`);
    
    for (const product of products) {
      for (let year = startYear; year <= endYear; year++) {
        // Weekly aggregates
        const weeklyResult = await calculateWeeklyAggregates(product.id, year, product.countryId);
        totalAggregatesCreated += weeklyResult.aggregatesCreated;
        totalAggregatesUpdated += weeklyResult.aggregatesUpdated;
        if (weeklyResult.errors.length > 0) {
          errors.push(...weeklyResult.errors.slice(0, 5)); // Limit errors
        }
        
        // Monthly aggregates
        const monthlyResult = await calculateMonthlyAggregates(product.id, year, product.countryId);
        totalAggregatesCreated += monthlyResult.aggregatesCreated;
        totalAggregatesUpdated += monthlyResult.aggregatesUpdated;
        if (monthlyResult.errors.length > 0) {
          errors.push(...monthlyResult.errors.slice(0, 5));
        }
      }
      
      console.log(`AZ Aggregate Sync: Completed ${product.name}`);
    }
    
    return {
      success: true,
      productsProcessed: products.length,
      totalAggregatesCreated,
      totalAggregatesUpdated,
      errors
    };
    
  } catch (error) {
    return {
      success: false,
      productsProcessed: 0,
      totalAggregatesCreated,
      totalAggregatesUpdated,
      errors: [...errors, String(error)]
    };
  }
}

/**
 * Get aggregated prices for a product (for API)
 */
export async function getAggregatedPrices(params: {
  productId: string;
  marketTypeCode?: string;
  productTypeId?: string;
  periodType: "Week" | "Month";
  startYear: number;
  endYear: number;
}): Promise<{
  date: Date;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  priceCount: number;
  marketType: string;
  source: string;
}[]> {
  const where: Record<string, unknown> = {
    productId: params.productId,
    periodType: params.periodType,
    year: {
      gte: params.startYear,
      lte: params.endYear
    }
  };
  
  if (params.productTypeId) {
    where.productTypeId = params.productTypeId;
  }
  
  if (params.marketTypeCode) {
    where.marketType = { code: params.marketTypeCode };
  }
  
  const aggregates = await prisma.azPriceAggregate.findMany({
    where,
    include: {
      marketType: true
    },
    orderBy: [
      { year: "asc" },
      { period: "asc" }
    ]
  });
  
  return aggregates.map(agg => ({
    date: agg.startDate,
    avgPrice: agg.avgPrice,
    minPrice: agg.minPrice,
    maxPrice: agg.maxPrice,
    priceCount: agg.priceCount,
    marketType: agg.marketType.nameAz,
    source: agg.sourceName
  }));
}

/**
 * Compare AZ and EU prices for a product
 */
export async function compareWithEU(params: {
  localProductId: string;
  euCountryCode: string;
  marketTypeCode: string; // AZ market type
  priceStage?: string;    // EU price stage
  startYear: number;
  endYear: number;
}): Promise<{
  azData: { date: Date; price: number; source: string }[];
  euData: { date: Date; price: number; source: string }[];
  comparison: {
    azAvg: number;
    euAvg: number;
    difference: number;
    percentDiff: number;
  } | null;
}> {
  // Get AZ aggregates
  const azAggregates = await prisma.azPriceAggregate.findMany({
    where: {
      productId: params.localProductId,
      marketType: { code: params.marketTypeCode },
      periodType: "Month",
      year: { gte: params.startYear, lte: params.endYear }
    },
    include: { marketType: true },
    orderBy: [{ year: "asc" }, { period: "asc" }]
  });
  
  // Find linked EU product
  const euProduct = await prisma.euProduct.findFirst({
    where: { localProductId: params.localProductId }
  });
  
  if (!euProduct) {
    return {
      azData: azAggregates.map(a => ({
        date: a.startDate,
        price: a.avgPrice,
        source: a.sourceName
      })),
      euData: [],
      comparison: null
    };
  }
  
  // Get EU country
  const euCountry = await prisma.euCountry.findUnique({
    where: { code: params.euCountryCode }
  });
  
  if (!euCountry) {
    return {
      azData: azAggregates.map(a => ({
        date: a.startDate,
        price: a.avgPrice,
        source: a.sourceName
      })),
      euData: [],
      comparison: null
    };
  }
  
  // Get EU prices
  const euPrices = await prisma.euPrice.findMany({
    where: {
      productId: euProduct.id,
      countryId: euCountry.id,
      year: { gte: params.startYear, lte: params.endYear },
      priceStage: params.priceStage || undefined
    },
    orderBy: [{ year: "asc" }, { period: "asc" }]
  });
  
  // Format data
  const azData = azAggregates.map(a => ({
    date: a.startDate,
    price: a.avgPrice,
    source: a.sourceName
  }));
  
  const euData = euPrices.map(p => ({
    date: p.startDate || new Date(p.year, (p.period || 1) - 1, 1),
    price: p.price,
    source: p.sourceName || p.source
  }));
  
  // Calculate comparison (if both have data)
  let comparison = null;
  if (azData.length > 0 && euData.length > 0) {
    const azAvg = azData.reduce((sum, d) => sum + d.price, 0) / azData.length;
    const euAvg = euData.reduce((sum, d) => sum + d.price, 0) / euData.length;
    const difference = azAvg - euAvg;
    const percentDiff = ((azAvg - euAvg) / euAvg) * 100;
    
    comparison = {
      azAvg: Math.round(azAvg * 100) / 100,
      euAvg: Math.round(euAvg * 100) / 100,
      difference: Math.round(difference * 100) / 100,
      percentDiff: Math.round(percentDiff * 10) / 10
    };
  }
  
  return { azData, euData, comparison };
}







