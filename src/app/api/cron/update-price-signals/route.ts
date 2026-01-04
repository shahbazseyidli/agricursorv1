/**
 * Cron Job: Update Price Signals
 * 
 * Schedule: Every Wednesday at 14:00 UTC
 * 
 * This endpoint updates the price_signals table with the latest price data
 * from AZ and FPMA sources, calculating 1M, 3M, 6M, 12M changes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Verify cron secret for security
const CRON_SECRET = process.env.CRON_SECRET;

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
  price: number;
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
const currencyRates = new Map<string, number>();
const unitConversions = new Map<string, number>();

async function loadCurrencyRates(): Promise<void> {
  const currencies = await prisma.currency.findMany({
    where: { isActive: true },
    select: { code: true, rateToUSD: true },
  });
  
  currencies.forEach(c => {
    currencyRates.set(c.code, c.rateToUSD);
  });
}

async function loadUnitConversions(): Promise<void> {
  const units = await prisma.unit.findMany({
    where: { isActive: true },
    select: { code: true, conversionRate: true, baseUnit: true },
  });
  
  units.forEach(u => {
    if (u.baseUnit === 'kg') {
      unitConversions.set(u.code.toLowerCase(), u.conversionRate);
    }
  });
  
  // Add common conversions
  unitConversions.set('kg', 1);
  unitConversions.set('100kg', 100);
  unitConversions.set('100 kg', 100);
  unitConversions.set('tonne', 1000);
  unitConversions.set('ton', 1000);
}

function convertToUsdPerKg(price: number, currency: string, unit: string): number | null {
  const currencyRate = currencyRates.get(currency) || 1;
  const priceInUsd = price / currencyRate;
  
  const unitLower = unit.toLowerCase().trim();
  let conversionFactor = unitConversions.get(unitLower);
  
  if (!conversionFactor) {
    const match = unitLower.match(/(\d+)\s*kg/);
    if (match) {
      conversionFactor = parseFloat(match[1]);
    } else {
      conversionFactor = 1;
    }
  }
  
  return priceInUsd / conversionFactor;
}

function findPriceInRange(prices: PricePoint[], minDaysAgo: number, maxDaysAgo: number): PricePoint | null {
  const now = new Date();
  const minDate = new Date(now.getTime() - maxDaysAgo * 24 * 60 * 60 * 1000);
  const maxDate = new Date(now.getTime() - minDaysAgo * 24 * 60 * 60 * 1000);
  
  const inRange = prices.filter(p => p.date >= minDate && p.date <= maxDate);
  if (inRange.length === 0) return null;
  
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

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (if configured)
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Price Signals Cron] Starting update...');
    
    // Load conversion data
    await loadCurrencyRates();
    await loadUnitConversions();
    
    const yearAgo = new Date();
    yearAgo.setDate(yearAgo.getDate() - 400);
    
    const signalDataMap = new Map<string, SignalData>();
    
    // ----- Process AZ Data -----
    console.log('[Price Signals Cron] Processing AZ data...');
    
    const azCountry = await prisma.globalCountry.findFirst({
      where: { iso2: 'AZ' },
    });
    
    if (azCountry) {
      const azPrices = await prisma.price.findMany({
        where: { date: { gte: yearAgo } },
        include: {
          product: { select: { globalProductId: true } },
          productType: { select: { globalProductVarietyId: true } },
          market: {
            select: {
              globalMarketId: true,
              marketType: { select: { globalPriceStageId: true } },
              country: { select: { globalCountryId: true } },
            },
          },
        },
        orderBy: { date: 'desc' },
      });
      
      for (const price of azPrices) {
        const globalProductId = price.product.globalProductId;
        const globalCountryId = price.market.country.globalCountryId;
        const globalMarketId = price.market.globalMarketId;
        const globalPriceStageId = price.market.marketType.globalPriceStageId;
        const globalVarietyId = price.productType?.globalProductVarietyId || null;
        
        if (!globalProductId || !globalCountryId || !globalMarketId) continue;
        
        const key = `${globalProductId}|${globalVarietyId}|${globalCountryId}|${globalMarketId}|${globalPriceStageId}`;
        const priceUsdKg = convertToUsdPerKg(price.priceAvg, price.currency, price.unit);
        if (priceUsdKg === null) continue;
        
        if (!signalDataMap.has(key)) {
          signalDataMap.set(key, {
            globalProductId,
            globalVarietyId,
            globalCountryId,
            globalMarketId,
            globalPriceStageId,
            dataSource: 'AZ',
            prices: [],
          });
        }
        
        signalDataMap.get(key)!.prices.push({ date: price.date, price: priceUsdKg });
      }
    }
    
    // ----- Process FPMA Data -----
    console.log('[Price Signals Cron] Processing FPMA data...');
    
    const fpmaPrices = await prisma.fpmaPrice.findMany({
      where: { date: { gte: yearAgo } },
      include: {
        serie: {
          select: {
            currency: true,
            measureUnit: true,
            globalPriceStageId: true,
            commodity: { select: { globalProductId: true, globalProductVarietyId: true } },
            country: { select: { globalCountryId: true } },
            market: { select: { globalMarketId: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    });
    
    for (const price of fpmaPrices) {
      const globalProductId = price.serie.commodity.globalProductId;
      const globalCountryId = price.serie.country.globalCountryId;
      const globalMarketId = price.serie.market.globalMarketId;
      const globalPriceStageId = price.serie.globalPriceStageId;
      const globalVarietyId = price.serie.commodity.globalProductVarietyId || null;
      
      if (!globalProductId || !globalCountryId || !globalMarketId) continue;
      
      const key = `${globalProductId}|${globalVarietyId}|${globalCountryId}|${globalMarketId}|${globalPriceStageId}`;
      const priceValue = price.priceNormalized || price.price;
      const priceUsdKg = convertToUsdPerKg(priceValue, price.serie.currency, price.serie.measureUnit);
      if (priceUsdKg === null) continue;
      
      if (!signalDataMap.has(key)) {
        signalDataMap.set(key, {
          globalProductId,
          globalVarietyId,
          globalCountryId,
          globalMarketId,
          globalPriceStageId,
          dataSource: 'FPMA',
          prices: [],
        });
      }
      
      signalDataMap.get(key)!.prices.push({ date: price.date, price: priceUsdKg });
    }
    
    console.log(`[Price Signals Cron] Total ${signalDataMap.size} price series to process`);
    
    // ----- Process and Save Signals -----
    let created = 0;
    let updated = 0;
    
    for (const data of signalDataMap.values()) {
      if (data.prices.length === 0) continue;
      
      const sortedPrices = [...data.prices].sort((a, b) => b.date.getTime() - a.date.getTime());
      const currentPricePoint = sortedPrices[0];
      const previousPricePoint = sortedPrices.length > 1 ? sortedPrices[1] : null;
      
      const monthAgoPricePoint = findPriceInRange(sortedPrices, PERIODS.MONTH.min, PERIODS.MONTH.max);
      const threeMonthAgoPricePoint = findPriceInRange(sortedPrices, PERIODS.THREE_MONTH.min, PERIODS.THREE_MONTH.max);
      const sixMonthAgoPricePoint = findPriceInRange(sortedPrices, PERIODS.SIX_MONTH.min, PERIODS.SIX_MONTH.max);
      const yearAgoPricePoint = findPriceInRange(sortedPrices, PERIODS.YEAR.min, PERIODS.YEAR.max);
      
      const mom = calculateChange(currentPricePoint.price, monthAgoPricePoint?.price ?? null);
      const threeMonthChange = calculateChange(currentPricePoint.price, threeMonthAgoPricePoint?.price ?? null);
      const sixMonthChange = calculateChange(currentPricePoint.price, sixMonthAgoPricePoint?.price ?? null);
      const yearChange = calculateChange(currentPricePoint.price, yearAgoPricePoint?.price ?? null);
      
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
        momStatus: calculateStatus(mom),
        threeMonthStatus: calculateStatus(threeMonthChange),
        sixMonthStatus: calculateStatus(sixMonthChange),
        yearStatus: calculateStatus(yearChange),
        dataSource: data.dataSource,
      };
      
      const existing = await prisma.priceSignal.findFirst({
        where: {
          globalProductId: data.globalProductId,
          globalVarietyId: data.globalVarietyId,
          globalCountryId: data.globalCountryId,
          globalMarketId: data.globalMarketId,
          globalPriceStageId: data.globalPriceStageId,
        },
      });
      
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
    }
    
    console.log(`[Price Signals Cron] Completed: ${created} created, ${updated} updated`);
    
    return NextResponse.json({
      success: true,
      message: 'Price signals updated successfully',
      stats: {
        total: signalDataMap.size,
        created,
        updated,
      },
    });
    
  } catch (error) {
    console.error('[Price Signals Cron] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update price signals' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for Vercel Pro
