/**
 * Global AZ Aggregate Price Calculator
 * 
 * Calculates aggregate prices for Azerbaijan by:
 * - GlobalProduct (all varieties combined)
 * - MarketType (RETAIL, WHOLESALE, FARMGATE, PROCESSING)
 * - Period (WEEKLY, MONTHLY, ANNUAL)
 * 
 * This data is used for cross-country comparison with EU and FAO data.
 * 
 * Run with: npx tsx scripts/calculate-global-az-aggregates.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

async function calculateGlobalAzAggregates() {
  console.log("🚀 Starting Global AZ Aggregate calculation...\n");
  
  // Get all GlobalProducts that have local products
  const globalProducts = await prisma.globalProduct.findMany({
    where: {
      localProducts: {
        some: {}
      }
    },
    include: {
      localProducts: {
        select: { id: true, name: true }
      }
    }
  });
  
  console.log(`📦 GlobalProducts with AZ data: ${globalProducts.length}`);
  
  // Get market types
  const marketTypes = await prisma.marketType.findMany();
  console.log(`🏪 Market types: ${marketTypes.map(m => m.code).join(", ")}`);
  
  // Get date range from prices
  const dateRange = await prisma.price.aggregate({
    _min: { date: true },
    _max: { date: true }
  });
  
  console.log(`📅 Date range: ${dateRange._min.date?.toISOString().split('T')[0]} to ${dateRange._max.date?.toISOString().split('T')[0]}`);
  
  const aggregates: AggregateData[] = [];
  
  // For each GlobalProduct
  for (const gp of globalProducts) {
    const localProductIds = gp.localProducts.map(lp => lp.id);
    
    if (localProductIds.length === 0) continue;
    
    // For each MarketType
    for (const mt of marketTypes) {
      const marketTypeCode = normalizeMarketType(mt.code);
      
      // Get all prices for this GlobalProduct and MarketType
      const prices = await prisma.price.findMany({
        where: {
          productId: { in: localProductIds },
          market: {
            marketTypeId: mt.id
          }
        },
        select: {
          date: true,
          priceMin: true,
          priceAvg: true,
          priceMax: true,
        },
        orderBy: { date: "asc" }
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
        
        // Weekly key: year-week
        const weekKey = `${year}-W${week.toString().padStart(2, '0')}`;
        if (!weeklyGroups.has(weekKey)) weeklyGroups.set(weekKey, []);
        weeklyGroups.get(weekKey)!.push(price);
        
        // Monthly key: year-month
        const monthKey = `${year}-M${month.toString().padStart(2, '0')}`;
        if (!monthlyGroups.has(monthKey)) monthlyGroups.set(monthKey, []);
        monthlyGroups.get(monthKey)!.push(price);
        
        // Annual key: year
        const yearKey = `${year}`;
        if (!annualGroups.has(yearKey)) annualGroups.set(yearKey, []);
        annualGroups.get(yearKey)!.push(price);
      }
      
      // Calculate weekly aggregates
      for (const [key, group] of weeklyGroups) {
        const [yearStr, weekStr] = key.split("-W");
        const year = parseInt(yearStr);
        const week = parseInt(weekStr);
        
        const stats = calculateStats(group);
        const dates = group.map(p => new Date(p.date)).sort((a, b) => a.getTime() - b.getTime());
        
        aggregates.push({
          globalProductId: gp.id,
          marketTypeCode,
          periodType: "WEEKLY",
          period: week,
          year,
          ...stats,
          startDate: dates[0],
          endDate: dates[dates.length - 1],
        });
      }
      
      // Calculate monthly aggregates
      for (const [key, group] of monthlyGroups) {
        const [yearStr, monthStr] = key.split("-M");
        const year = parseInt(yearStr);
        const month = parseInt(monthStr);
        
        const stats = calculateStats(group);
        const dates = group.map(p => new Date(p.date)).sort((a, b) => a.getTime() - b.getTime());
        
        aggregates.push({
          globalProductId: gp.id,
          marketTypeCode,
          periodType: "MONTHLY",
          period: month,
          year,
          ...stats,
          startDate: dates[0],
          endDate: dates[dates.length - 1],
        });
      }
      
      // Calculate annual aggregates
      for (const [key, group] of annualGroups) {
        const year = parseInt(key);
        
        const stats = calculateStats(group);
        const dates = group.map(p => new Date(p.date)).sort((a, b) => a.getTime() - b.getTime());
        
        aggregates.push({
          globalProductId: gp.id,
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
    
    process.stdout.write(`\r  Processed: ${gp.nameAz || gp.nameEn}                    `);
  }
  
  console.log(`\n\n📊 Total aggregates to insert: ${aggregates.length}`);
  
  // Clear existing aggregates
  await prisma.globalAzAggregate.deleteMany({});
  console.log("🗑️  Cleared existing aggregates");
  
  // Insert new aggregates in batches
  const batchSize = 100;
  let inserted = 0;
  let skipped = 0;
  
  for (let i = 0; i < aggregates.length; i += batchSize) {
    const batch = aggregates.slice(i, i + batchSize);
    
    for (const a of batch) {
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
      } catch (e) {
        skipped++;
      }
    }
    
    process.stdout.write(`\r  Inserted: ${inserted}, Skipped: ${skipped} / ${aggregates.length}`);
  }
  
  console.log("");
  
  // Summary
  console.log("\n\n📊 Summary by period type:");
  
  const weeklyCount = await prisma.globalAzAggregate.count({ where: { periodType: "WEEKLY" } });
  const monthlyCount = await prisma.globalAzAggregate.count({ where: { periodType: "MONTHLY" } });
  const annualCount = await prisma.globalAzAggregate.count({ where: { periodType: "ANNUAL" } });
  
  console.log(`  WEEKLY:  ${weeklyCount}`);
  console.log(`  MONTHLY: ${monthlyCount}`);
  console.log(`  ANNUAL:  ${annualCount}`);
  
  console.log("\n📊 Summary by market type:");
  const byMarketType = await prisma.globalAzAggregate.groupBy({
    by: ["marketTypeCode"],
    _count: true,
  });
  
  for (const mt of byMarketType) {
    console.log(`  ${mt.marketTypeCode}: ${mt._count}`);
  }
  
  // Show sample for Apple
  const appleGp = await prisma.globalProduct.findUnique({ where: { slug: "apple" } });
  if (appleGp) {
    const appleSample = await prisma.globalAzAggregate.findMany({
      where: {
        globalProductId: appleGp.id,
        periodType: "ANNUAL",
      },
      orderBy: { year: "desc" },
      take: 5,
    });
    
    console.log("\n🍎 Apple annual aggregates (last 5 years):");
    for (const a of appleSample) {
      console.log(`  ${a.year} | ${a.marketTypeCode} | ${a.avgPrice.toFixed(2)} AZN/kg (${a.sampleCount} samples)`);
    }
  }
  
  console.log("\n✨ Global AZ Aggregate calculation completed!");
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

calculateGlobalAzAggregates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

