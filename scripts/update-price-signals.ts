/**
 * Price Signals Update Script
 * 
 * This script updates the price_signals table with latest price changes
 * from AZ and FPMA data sources.
 * 
 * Logic:
 * 1. Fetch prices from last 12 months (AZ + FPMA)
 * 2. For each product+variety+country+market+priceStage combination:
 *    - currentPrice = most recent price
 *    - previousPrice = price before current
 *    - monthAgoPrice = price from 25-45 days ago (1M)
 *    - threeMonthAgoPrice = price from 80-100 days ago (3M)
 *    - sixMonthAgoPrice = price from 170-190 days ago (6M)
 *    - yearAgoPrice = price from 350-380 days ago (12M)
 *    - Calculate change percentages
 *    - Determine status based on ±2% threshold
 * 3. Upsert into price_signals table
 * 
 * Run: npx tsx scripts/update-price-signals.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Constants
const THRESHOLD_PERCENT = 2; // ±2% threshold for "changed" status

// Period ranges (min-max days ago)
const PERIODS = {
  MONTH: { min: 25, max: 45 },
  THREE_MONTH: { min: 80, max: 100 },
  SIX_MONTH: { min: 170, max: 190 },
  YEAR: { min: 350, max: 380 },
};

interface PricePoint {
  date: Date;
  price: number; // USD/kg normalized
}

interface SignalData {
  globalProductId: string;
  globalVarietyId: string | null;
  globalCountryId: string;
  globalMarketId: string;
  globalPriceStageId: string | null;
  dataSource: 'AZ' | 'FPMA';
  prices: PricePoint[];
}

// Currency rates cache
let currencyRates: Map<string, number> = new Map();

// Unit conversion cache
let unitConversions: Map<string, number> = new Map();

async function loadCurrencyRates(): Promise<void> {
  const currencies = await prisma.currency.findMany({
    where: { isActive: true },
    select: { code: true, rateToUSD: true },
  });
  
  currencies.forEach(c => {
    // rateToUSD: 1 USD = X of this currency
    // To convert to USD: price / rateToUSD
    currencyRates.set(c.code, c.rateToUSD);
  });
  
  console.log(`📊 Loaded ${currencyRates.size} currency rates`);
}

async function loadUnitConversions(): Promise<void> {
  const units = await prisma.unit.findMany({
    where: { isActive: true },
    select: { code: true, conversionRate: true, baseUnit: true },
  });
  
  // Build conversion to kg
  units.forEach(u => {
    if (u.baseUnit === 'kg') {
      unitConversions.set(u.code.toLowerCase(), u.conversionRate);
    }
  });
  
  // Add common conversions manually
  unitConversions.set('kg', 1);
  unitConversions.set('100kg', 100);
  unitConversions.set('100 kg', 100);
  unitConversions.set('tonne', 1000);
  unitConversions.set('ton', 1000);
  unitConversions.set('lb', 0.453592);
  unitConversions.set('gram', 0.001);
  unitConversions.set('g', 0.001);
  
  console.log(`📏 Loaded ${unitConversions.size} unit conversions`);
}

function convertToUsdPerKg(price: number, currency: string, unit: string): number | null {
  const currencyRate = currencyRates.get(currency);
  if (!currencyRate) {
    console.warn(`⚠️ Unknown currency: ${currency}`);
    return null;
  }
  
  // Convert to USD
  const priceInUsd = price / currencyRate;
  
  // Normalize unit to lowercase
  const unitLower = unit.toLowerCase().trim();
  
  // Get conversion factor
  let conversionFactor = unitConversions.get(unitLower);
  
  if (!conversionFactor) {
    // Try to extract number from unit (e.g., "15 kg" -> 15)
    const match = unitLower.match(/(\d+)\s*kg/);
    if (match) {
      conversionFactor = parseFloat(match[1]);
    } else {
      console.warn(`⚠️ Unknown unit: ${unit}`);
      return null;
    }
  }
  
  // Convert to per kg: if original is per 100kg, divide by 100
  const pricePerKg = priceInUsd / conversionFactor;
  
  return pricePerKg;
}

async function fetchAzPrices(): Promise<SignalData[]> {
  console.log('🇦🇿 Fetching AZ prices (last 12 months)...');
  
  const yearAgo = new Date();
  yearAgo.setDate(yearAgo.getDate() - 400); // Extra buffer for 12 months
  
  const prices = await prisma.price.findMany({
    where: {
      date: { gte: yearAgo },
    },
    include: {
      product: {
        select: {
          globalProductId: true,
        },
      },
      productType: {
        select: {
          globalProductVarietyId: true,
        },
      },
      market: {
        select: {
          globalMarketId: true,
          marketType: {
            select: {
              globalPriceStageId: true,
            },
          },
          country: {
            select: {
              globalCountryId: true,
            },
          },
        },
      },
    },
    orderBy: { date: 'desc' },
  });
  
  // Group by unique key
  const groupedData = new Map<string, SignalData>();
  
  for (const price of prices) {
    const globalProductId = price.product.globalProductId;
    const globalCountryId = price.market.country.globalCountryId;
    const globalMarketId = price.market.globalMarketId;
    const globalPriceStageId = price.market.marketType.globalPriceStageId;
    const globalVarietyId = price.productType?.globalProductVarietyId || null;
    
    if (!globalProductId || !globalCountryId || !globalMarketId) {
      continue; // Skip if not linked to global entities
    }
    
    const key = `${globalProductId}|${globalVarietyId}|${globalCountryId}|${globalMarketId}|${globalPriceStageId}`;
    
    // Convert price to USD/kg
    const priceUsdKg = convertToUsdPerKg(price.priceAvg, price.currency, price.unit);
    if (priceUsdKg === null) continue;
    
    if (!groupedData.has(key)) {
      groupedData.set(key, {
        globalProductId,
        globalVarietyId,
        globalCountryId,
        globalMarketId,
        globalPriceStageId,
        dataSource: 'AZ',
        prices: [],
      });
    }
    
    groupedData.get(key)!.prices.push({
      date: price.date,
      price: priceUsdKg,
    });
  }
  
  console.log(`   Found ${groupedData.size} unique AZ price series`);
  return Array.from(groupedData.values());
}

async function fetchFpmaPrices(): Promise<SignalData[]> {
  console.log('🌍 Fetching FPMA prices (last 12 months)...');
  
  const yearAgo = new Date();
  yearAgo.setDate(yearAgo.getDate() - 400); // Extra buffer for 12 months
  
  const prices = await prisma.fpmaPrice.findMany({
    where: {
      date: { gte: yearAgo },
    },
    include: {
      serie: {
        select: {
          currency: true,
          measureUnit: true,
          globalPriceStageId: true,
          commodity: {
            select: {
              globalProductId: true,
              globalProductVarietyId: true,
            },
          },
          country: {
            select: {
              globalCountryId: true,
            },
          },
          market: {
            select: {
              globalMarketId: true,
            },
          },
        },
      },
    },
    orderBy: { date: 'desc' },
  });
  
  // Group by unique key
  const groupedData = new Map<string, SignalData>();
  
  for (const price of prices) {
    const globalProductId = price.serie.commodity.globalProductId;
    const globalCountryId = price.serie.country.globalCountryId;
    const globalMarketId = price.serie.market.globalMarketId;
    const globalPriceStageId = price.serie.globalPriceStageId;
    const globalVarietyId = price.serie.commodity.globalProductVarietyId || null;
    
    if (!globalProductId || !globalCountryId || !globalMarketId) {
      continue; // Skip if not linked to global entities
    }
    
    const key = `${globalProductId}|${globalVarietyId}|${globalCountryId}|${globalMarketId}|${globalPriceStageId}`;
    
    // Use normalized price if available, otherwise original
    const priceValue = price.priceNormalized || price.price;
    
    // Convert price to USD/kg
    const priceUsdKg = convertToUsdPerKg(priceValue, price.serie.currency, price.serie.measureUnit);
    if (priceUsdKg === null) continue;
    
    if (!groupedData.has(key)) {
      groupedData.set(key, {
        globalProductId,
        globalVarietyId,
        globalCountryId,
        globalMarketId,
        globalPriceStageId,
        dataSource: 'FPMA',
        prices: [],
      });
    }
    
    groupedData.get(key)!.prices.push({
      date: price.date,
      price: priceUsdKg,
    });
  }
  
  console.log(`   Found ${groupedData.size} unique FPMA price series`);
  return Array.from(groupedData.values());
}

function findPriceInRange(prices: PricePoint[], minDaysAgo: number, maxDaysAgo: number): PricePoint | null {
  const now = new Date();
  const minDate = new Date(now.getTime() - maxDaysAgo * 24 * 60 * 60 * 1000);
  const maxDate = new Date(now.getTime() - minDaysAgo * 24 * 60 * 60 * 1000);
  
  // Filter prices in range
  const inRange = prices.filter(p => p.date >= minDate && p.date <= maxDate);
  
  if (inRange.length === 0) return null;
  
  // Return the most recent one in range
  return inRange.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
}

function calculateChange(current: number, previous: number | null): number | null {
  if (previous === null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function calculateStatus(changePercent: number | null): 'INCREASED' | 'DECREASED' | 'STABLE' {
  if (changePercent === null) return 'STABLE';
  if (changePercent > THRESHOLD_PERCENT) return 'INCREASED';
  if (changePercent < -THRESHOLD_PERCENT) return 'DECREASED';
  return 'STABLE';
}

async function processSignals(allData: SignalData[]): Promise<void> {
  console.log(`\n📈 Processing ${allData.length} price series...`);
  
  let created = 0;
  let updated = 0;
  let skipped = 0;
  
  for (const data of allData) {
    // Skip if no prices
    if (data.prices.length === 0) {
      skipped++;
      continue;
    }
    
    // Sort prices by date descending
    const sortedPrices = [...data.prices].sort((a, b) => b.date.getTime() - a.date.getTime());
    
    // Get current price (most recent)
    const currentPricePoint = sortedPrices[0];
    
    // Get previous price (second most recent, if exists)
    const previousPricePoint = sortedPrices.length > 1 ? sortedPrices[1] : null;
    
    // Get historical prices
    const monthAgoPricePoint = findPriceInRange(sortedPrices, PERIODS.MONTH.min, PERIODS.MONTH.max);
    const threeMonthAgoPricePoint = findPriceInRange(sortedPrices, PERIODS.THREE_MONTH.min, PERIODS.THREE_MONTH.max);
    const sixMonthAgoPricePoint = findPriceInRange(sortedPrices, PERIODS.SIX_MONTH.min, PERIODS.SIX_MONTH.max);
    const yearAgoPricePoint = findPriceInRange(sortedPrices, PERIODS.YEAR.min, PERIODS.YEAR.max);
    
    // Calculate changes
    const mom = calculateChange(currentPricePoint.price, monthAgoPricePoint?.price ?? null);
    const threeMonthChange = calculateChange(currentPricePoint.price, threeMonthAgoPricePoint?.price ?? null);
    const sixMonthChange = calculateChange(currentPricePoint.price, sixMonthAgoPricePoint?.price ?? null);
    const yearChange = calculateChange(currentPricePoint.price, yearAgoPricePoint?.price ?? null);
    
    // Determine statuses
    const momStatus = calculateStatus(mom);
    const threeMonthStatus = calculateStatus(threeMonthChange);
    const sixMonthStatus = calculateStatus(sixMonthChange);
    const yearStatus = calculateStatus(yearChange);
    
    try {
      // Find existing signal
      const existing = await prisma.priceSignal.findFirst({
        where: {
          globalProductId: data.globalProductId,
          globalVarietyId: data.globalVarietyId,
          globalCountryId: data.globalCountryId,
          globalMarketId: data.globalMarketId,
          globalPriceStageId: data.globalPriceStageId,
        },
      });
      
      const signalData = {
        currentPrice: currentPricePoint.price,
        currentPriceDate: currentPricePoint.date,
        previousPrice: previousPricePoint?.price ?? null,
        monthAgoPrice: monthAgoPricePoint?.price ?? null,
        threeMonthAgoPrice: threeMonthAgoPricePoint?.price ?? null,
        sixMonthAgoPrice: sixMonthAgoPricePoint?.price ?? null,
        yearAgoPrice: yearAgoPricePoint?.price ?? null,
        mom: mom !== null ? Math.round(mom * 100) / 100 : null,
        threeMonthChange: threeMonthChange !== null ? Math.round(threeMonthChange * 100) / 100 : null,
        sixMonthChange: sixMonthChange !== null ? Math.round(sixMonthChange * 100) / 100 : null,
        yearChange: yearChange !== null ? Math.round(yearChange * 100) / 100 : null,
        momStatus,
        threeMonthStatus,
        sixMonthStatus,
        yearStatus,
        dataSource: data.dataSource,
      };
      
      if (existing) {
        await prisma.priceSignal.update({
          where: { id: existing.id },
          data: signalData,
        });
        updated++;
      } else {
        await prisma.priceSignal.create({
          data: {
            globalProductId: data.globalProductId,
            globalVarietyId: data.globalVarietyId,
            globalCountryId: data.globalCountryId,
            globalMarketId: data.globalMarketId,
            globalPriceStageId: data.globalPriceStageId,
            ...signalData,
          },
        });
        created++;
      }
    } catch (error) {
      console.error(`Error upserting signal:`, error);
      skipped++;
    }
  }
  
  console.log(`\n✅ Done!`);
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
}

async function main() {
  console.log('🚀 Starting Price Signals Update...\n');
  
  try {
    // Load conversion data
    await loadCurrencyRates();
    await loadUnitConversions();
    
    // Fetch prices from both sources
    const azPrices = await fetchAzPrices();
    const fpmaPrices = await fetchFpmaPrices();
    
    // Combine all data
    const allData = [...azPrices, ...fpmaPrices];
    
    // Process and save signals
    await processSignals(allData);
    
    // Show summary
    const totalSignals = await prisma.priceSignal.count();
    const changedSignals = await prisma.priceSignal.count({
      where: {
        OR: [
          { momStatus: { not: 'STABLE' } },
          { threeMonthStatus: { not: 'STABLE' } },
          { sixMonthStatus: { not: 'STABLE' } },
          { yearStatus: { not: 'STABLE' } },
        ],
      },
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total signals: ${totalSignals}`);
    console.log(`   Changed signals (any period): ${changedSignals}`);
    console.log(`   Stable signals: ${totalSignals - changedSignals}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
