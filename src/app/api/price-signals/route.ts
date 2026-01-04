/**
 * Price Signals API
 * 
 * GET /api/price-signals
 * 
 * Query Parameters:
 * - limit: number (default: 9)
 * - random: boolean (default: true) - if true, returns random changed signals
 * - status: "all" | "changed" | "stable" (default: "changed")
 * - dataSource: "all" | "AZ" | "FPMA" (default: "all")
 * 
 * Returns price signals with related product, variety, country, market, and price stage info.
 * Includes 1M, 3M, 6M change data with priority sorting.
 * 
 * Priority System:
 * - High: All 3 periods (1M, 3M, 6M) have changes
 * - Medium: At least 2 periods have changes
 * - Low: Only 1 period has change
 * 
 * Default split for limit=9: 1 AZ + 8 FPMA, mixed randomly
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Calculate priority based on how many periods have changes
function calculatePriority(momStatus: string, threeMonthStatus: string, sixMonthStatus: string): number {
  const changedCount = [momStatus, threeMonthStatus, sixMonthStatus]
    .filter(s => s !== 'STABLE').length;
  
  if (changedCount === 3) return 3; // High priority
  if (changedCount === 2) return 2; // Medium priority
  if (changedCount === 1) return 1; // Low priority
  return 0; // No changes
}

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse parameters
    const limit = parseInt(searchParams.get('limit') || '9');
    const random = searchParams.get('random') !== 'false'; // default: true
    const status = searchParams.get('status') || 'changed';
    const dataSource = searchParams.get('dataSource') || 'all';
    
    // Build where clause for changed status
    const changedWhere = {
      OR: [
        { momStatus: { not: 'STABLE' } },
        { threeMonthStatus: { not: 'STABLE' } },
        { sixMonthStatus: { not: 'STABLE' } },
      ],
    };
    
    // Build base where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let where: any = {};
    
    if (status === 'changed') {
      where = { ...changedWhere };
    } else if (status === 'stable') {
      where = {
        momStatus: 'STABLE',
        threeMonthStatus: 'STABLE',
        sixMonthStatus: 'STABLE',
      };
    }
    
    // Filter by data source if specified
    if (dataSource !== 'all') {
      where.dataSource = dataSource;
    }
    
    // Include configuration for relations
    const includeConfig = {
      globalProduct: {
        select: {
          id: true,
          slug: true,
          nameAz: true,
          nameEn: true,
          image: true,
        },
      },
      globalVariety: {
        select: {
          id: true,
          slug: true,
          nameAz: true,
          nameEn: true,
        },
      },
      globalCountry: {
        select: {
          id: true,
          iso2: true,
          nameAz: true,
          nameEn: true,
          flagEmoji: true,
        },
      },
      globalMarket: {
        select: {
          id: true,
          name: true,
          nameAz: true,
          nameEn: true,
          isNationalAvg: true,
        },
      },
      globalPriceStage: {
        select: {
          id: true,
          code: true,
          nameAz: true,
          nameEn: true,
        },
      },
    };
    
    // Get total count for stats
    const totalCount = await prisma.priceSignal.count({ where });
    
    let signals;
    
    // Special handling for default 9 limit with 1 AZ + 8 FPMA split
    if (limit === 9 && dataSource === 'all' && status === 'changed') {
      // Get AZ signals with priority
      const azSignals = await prisma.priceSignal.findMany({
        where: { ...changedWhere, dataSource: 'AZ' },
        include: includeConfig,
      });
      
      // Get FPMA signals with priority
      const fpmaSignals = await prisma.priceSignal.findMany({
        where: { ...changedWhere, dataSource: 'FPMA' },
        include: includeConfig,
      });
      
      // Add priority to signals and sort
      const azWithPriority = azSignals.map(s => ({
        ...s,
        priority: calculatePriority(s.momStatus, s.threeMonthStatus, s.sixMonthStatus),
      }));
      
      const fpmaWithPriority = fpmaSignals.map(s => ({
        ...s,
        priority: calculatePriority(s.momStatus, s.threeMonthStatus, s.sixMonthStatus),
      }));
      
      // Group by priority
      const azByPriority = {
        high: shuffleArray(azWithPriority.filter(s => s.priority === 3)),
        medium: shuffleArray(azWithPriority.filter(s => s.priority === 2)),
        low: shuffleArray(azWithPriority.filter(s => s.priority === 1)),
      };
      
      const fpmaByPriority = {
        high: shuffleArray(fpmaWithPriority.filter(s => s.priority === 3)),
        medium: shuffleArray(fpmaWithPriority.filter(s => s.priority === 2)),
        low: shuffleArray(fpmaWithPriority.filter(s => s.priority === 1)),
      };
      
      // Select 1 AZ (prefer high priority)
      let selectedAz: typeof azWithPriority = [];
      if (azByPriority.high.length > 0) {
        selectedAz = [azByPriority.high[0]];
      } else if (azByPriority.medium.length > 0) {
        selectedAz = [azByPriority.medium[0]];
      } else if (azByPriority.low.length > 0) {
        selectedAz = [azByPriority.low[0]];
      }
      
      // Select 8 FPMA (prioritize by high -> medium -> low)
      let selectedFpma: typeof fpmaWithPriority = [];
      const fpmaPool = [
        ...fpmaByPriority.high,
        ...fpmaByPriority.medium,
        ...fpmaByPriority.low,
      ];
      selectedFpma = fpmaPool.slice(0, 8);
      
      // If not enough FPMA, fill with more AZ
      const remaining = 8 - selectedFpma.length;
      if (remaining > 0) {
        const azPool = [
          ...azByPriority.high.slice(1),
          ...azByPriority.medium.slice(selectedAz.length > 0 && selectedAz[0].priority === 2 ? 1 : 0),
          ...azByPriority.low.slice(selectedAz.length > 0 && selectedAz[0].priority === 1 ? 1 : 0),
        ];
        selectedAz = [...selectedAz, ...azPool.slice(0, remaining)];
      }
      
      // Combine and shuffle to mix AZ with FPMA
      const combined = shuffleArray([...selectedAz, ...selectedFpma]);
      signals = combined.slice(0, 9);
      
    } else if (random && totalCount > limit) {
      // Random selection with priority
      const allSignals = await prisma.priceSignal.findMany({
        where,
        include: includeConfig,
      });
      
      // Add priority and sort
      const withPriority = allSignals.map(s => ({
        ...s,
        priority: calculatePriority(s.momStatus, s.threeMonthStatus, s.sixMonthStatus),
      }));
      
      // Group by priority
      const byPriority = {
        high: shuffleArray(withPriority.filter(s => s.priority === 3)),
        medium: shuffleArray(withPriority.filter(s => s.priority === 2)),
        low: shuffleArray(withPriority.filter(s => s.priority === 1)),
        none: shuffleArray(withPriority.filter(s => s.priority === 0)),
      };
      
      // Select from high to low priority
      const prioritized = [
        ...byPriority.high,
        ...byPriority.medium,
        ...byPriority.low,
        ...byPriority.none,
      ];
      
      signals = prioritized.slice(0, limit);
    } else {
      // Just get the first N
      signals = await prisma.priceSignal.findMany({
        where,
        take: limit,
        orderBy: { currentPriceDate: 'desc' },
        include: includeConfig,
      });
    }
    
    // Format response
    const formattedSignals = signals.map(signal => ({
      id: signal.id,
      product: {
        id: signal.globalProduct.id,
        slug: signal.globalProduct.slug,
        nameAz: signal.globalProduct.nameAz,
        nameEn: signal.globalProduct.nameEn,
        image: signal.globalProduct.image,
      },
      variety: signal.globalVariety ? {
        id: signal.globalVariety.id,
        slug: signal.globalVariety.slug,
        nameAz: signal.globalVariety.nameAz || 'Base',
        nameEn: signal.globalVariety.nameEn || 'Base',
      } : {
        id: null,
        slug: 'base',
        nameAz: 'Base',
        nameEn: 'Base',
      },
      country: {
        id: signal.globalCountry.id,
        iso2: signal.globalCountry.iso2,
        nameAz: signal.globalCountry.nameAz,
        nameEn: signal.globalCountry.nameEn,
        flagEmoji: signal.globalCountry.flagEmoji,
      },
      market: {
        id: signal.globalMarket.id,
        name: signal.globalMarket.nameAz || signal.globalMarket.name,
        nameEn: signal.globalMarket.nameEn || signal.globalMarket.name,
        isNationalAvg: signal.globalMarket.isNationalAvg,
      },
      priceStage: signal.globalPriceStage ? {
        id: signal.globalPriceStage.id,
        code: signal.globalPriceStage.code,
        nameAz: signal.globalPriceStage.nameAz,
        nameEn: signal.globalPriceStage.nameEn,
      } : null,
      currentPrice: signal.currentPrice,
      currentPriceDate: signal.currentPriceDate.toISOString().split('T')[0],
      previousPrice: signal.previousPrice,
      // 1M, 3M, 6M data
      mom: signal.mom,
      threeMonthChange: signal.threeMonthChange,
      sixMonthChange: signal.sixMonthChange,
      momStatus: signal.momStatus,
      threeMonthStatus: signal.threeMonthStatus,
      sixMonthStatus: signal.sixMonthStatus,
      dataSource: signal.dataSource,
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedSignals,
      meta: {
        total: totalCount,
        limit,
        random,
        status,
        dataSource,
      },
    });
    
  } catch (error) {
    console.error('Price signals API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch price signals' },
      { status: 500 }
    );
  }
}
