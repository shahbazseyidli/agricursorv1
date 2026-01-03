/**
 * Global AZ Aggregate Price Calculator
 * 
 * Calculates aggregate prices for Azerbaijan by:
 * - GlobalProduct (all varieties combined)
 * - MarketType (RETAIL, WHOLESALE, FARMGATE, PROCESSING)
 * - Period (WEEKLY, MONTHLY, ANNUAL)
 */

import { prisma } from "@/lib/prisma";

// Market type code mapping
const MARKET_TYPE_MAP: Record<string, string> = {
  "WHOLESALE": "WHOLESALE",
  "TOPDAN": "WHOLESALE",
  "RETAIL": "RETAIL",
  "PƏRAKƏNDƏ": "RETAIL",
  "PERAKENDE": "RETAIL",
  "FARMGATE": "FARMGATE",
  "FIELD": "FARMGATE",
  "SAHƏ": "FARMGATE",
  "PROCESSING": "PROCESSING",
  "EMAL": "PROCESSING",
};

interface AggregateData {
  globalProductId: string;
  marketTypeCode: string;
  periodType: "WEEKLY" | "MONTHLY" | "ANNUAL";
  period: number | null;
  year: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  sampleCount: number;
  startDate: Date | null;
  endDate: Date | null;
}

function normalizeMarketType(code: string): string {
  const upper = code.toUpperCase();
  return MARKET_TYPE_MAP[upper] || upper;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function calculateStats(prices: { priceMin: number; priceAvg: number; priceMax: number }[]): {
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  sampleCount: number;
} {
  if (prices.length === 0) {
    return { avgPrice: 0, minPrice: 0, maxPrice: 0, sampleCount: 0 };
  }
  
  const avgPrices = prices.map(p => p.priceAvg);
  const minPrices = prices.map(p => p.priceMin);
  const maxPrices = prices.map(p => p.priceMax);
  
  return {
    avgPrice: avgPrices.reduce((a, b) => a + b, 0) / avgPrices.length,
    minPrice: Math.min(...minPrices),
    maxPrice: Math.max(...maxPrices),
    sampleCount: prices.length,
  };
}

/**
 * Recalculate aggregates for a specific GlobalProduct
 */
export async function recalculateAggregatesForProduct(globalProductId: string): Promise<number> {
  const globalProduct = await prisma.globalProduct.findUnique({
    where: { id: globalProductId },
    include: {
      localProducts: { select: { id: true } },
    },
  });
  
  if (!globalProduct || globalProduct.localProducts.length === 0) {
    return 0;
  }
  
  const localProductIds = globalProduct.localProducts.map(lp => lp.id);
  const marketTypes = await prisma.marketType.findMany();
  const aggregates: AggregateData[] = [];
  
  for (const mt of marketTypes) {
    const marketTypeCode = normalizeMarketType(mt.code);
    
    const prices = await prisma.price.findMany({
      where: {
        productId: { in: localProductIds },
        market: { marketTypeId: mt.id },
      },
      select: {
        date: true,
        priceMin: true,
        priceAvg: true,
        priceMax: true,
      },
      orderBy: { date: "asc" },
    });
    
    if (prices.length === 0) continue;
    
    // Group by week, month, year
    const weeklyGroups = new Map<string, typeof prices>();
    const monthlyGroups = new Map<string, typeof prices>();
    const annualGroups = new Map<string, typeof prices>();
    
    for (const price of prices) {
      const date = new Date(price.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const week = getWeekNumber(date);
      
      const weekKey = `${year}-W${week.toString().padStart(2, '0')}`;
      if (!weeklyGroups.has(weekKey)) weeklyGroups.set(weekKey, []);
      weeklyGroups.get(weekKey)!.push(price);
      
      const monthKey = `${year}-M${month.toString().padStart(2, '0')}`;
      if (!monthlyGroups.has(monthKey)) monthlyGroups.set(monthKey, []);
      monthlyGroups.get(monthKey)!.push(price);
      
      const yearKey = `${year}`;
      if (!annualGroups.has(yearKey)) annualGroups.set(yearKey, []);
      annualGroups.get(yearKey)!.push(price);
    }
    
    // Weekly aggregates
    for (const [key, group] of weeklyGroups) {
      const [yearStr, weekStr] = key.split("-W");
      const year = parseInt(yearStr);
      const week = parseInt(weekStr);
      const stats = calculateStats(group);
      const dates = group.map(p => new Date(p.date)).sort((a, b) => a.getTime() - b.getTime());
      
      aggregates.push({
        globalProductId,
        marketTypeCode,
        periodType: "WEEKLY",
        period: week,
        year,
        ...stats,
        startDate: dates[0],
        endDate: dates[dates.length - 1],
      });
    }
    
    // Monthly aggregates
    for (const [key, group] of monthlyGroups) {
      const [yearStr, monthStr] = key.split("-M");
      const year = parseInt(yearStr);
      const month = parseInt(monthStr);
      const stats = calculateStats(group);
      const dates = group.map(p => new Date(p.date)).sort((a, b) => a.getTime() - b.getTime());
      
      aggregates.push({
        globalProductId,
        marketTypeCode,
        periodType: "MONTHLY",
        period: month,
        year,
        ...stats,
        startDate: dates[0],
        endDate: dates[dates.length - 1],
      });
    }
    
    // Annual aggregates
    for (const [key, group] of annualGroups) {
      const year = parseInt(key);
      const stats = calculateStats(group);
      const dates = group.map(p => new Date(p.date)).sort((a, b) => a.getTime() - b.getTime());
      
      aggregates.push({
        globalProductId,
        marketTypeCode,
        periodType: "ANNUAL",
        period: null,
        year,
        ...stats,
        startDate: dates[0],
        endDate: dates[dates.length - 1],
      });
    }
  }
  
  // Delete existing aggregates for this product
  await prisma.globalAzAggregate.deleteMany({
    where: { globalProductId },
  });
  
  // Insert new aggregates
  let inserted = 0;
  for (const a of aggregates) {
    try {
      await prisma.globalAzAggregate.create({
        data: {
          globalProductId: a.globalProductId,
          marketTypeCode: a.marketTypeCode,
          periodType: a.periodType,
          period: a.period,
          year: a.year,
          avgPrice: a.avgPrice,
          minPrice: a.minPrice,
          maxPrice: a.maxPrice,
          sampleCount: a.sampleCount,
          startDate: a.startDate,
          endDate: a.endDate,
          currency: "AZN",
          unit: "kg",
          source: "agro.gov.az",
        },
      });
      inserted++;
    } catch {
      // Skip duplicates
    }
  }
  
  return inserted;
}

/**
 * Recalculate all aggregates for all GlobalProducts
 */
export async function recalculateAllAggregates(): Promise<{ total: number; products: number }> {
  const globalProducts = await prisma.globalProduct.findMany({
    where: {
      localProducts: { some: {} },
    },
    select: { id: true },
  });
  
  let total = 0;
  
  for (const gp of globalProducts) {
    const count = await recalculateAggregatesForProduct(gp.id);
    total += count;
  }
  
  return { total, products: globalProducts.length };
}

/**
 * Recalculate aggregates for products affected by new price data
 */
export async function recalculateAggregatesForAffectedProducts(productIds: string[]): Promise<number> {
  // Find GlobalProducts linked to these local products
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { globalProductId: true },
  });
  
  const globalProductIds = [...new Set(
    products
      .map(p => p.globalProductId)
      .filter((id): id is string => id !== null)
  )];
  
  let total = 0;
  
  for (const gpId of globalProductIds) {
    const count = await recalculateAggregatesForProduct(gpId);
    total += count;
  }
  
  return total;
}

