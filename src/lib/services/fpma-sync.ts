/**
 * FPMA Sync Service
 * Incremental sync for FAO Food Price Monitoring & Analysis data
 * 
 * Runs daily at 04:00 UTC - fetches only new/updated prices
 */

import { prisma } from "@/lib/prisma";

const FPMA_API_BASE = "https://fpma.fao.org/giews/v4/global/price_module/api/v1";
const SERIES_ENDPOINT = `${FPMA_API_BASE}/FpmaSerieDomestic/`;
const PRICE_ENDPOINT = `${FPMA_API_BASE}/FpmaSeriePrice/`;

// Market type normalization mapping
const MARKET_TYPE_MAPPING: Record<string, string> = {
  "National Average": "NATIONAL_AVERAGE",
  "National average": "NATIONAL_AVERAGE",
  "National average prices": "NATIONAL_AVERAGE",
  "Average": "NATIONAL_AVERAGE",
  "Average prices": "NATIONAL_AVERAGE",
  "National capital city": "CAPITAL_CITY",
  "National Capital city": "CAPITAL_CITY",
  "National Capital City": "CAPITAL_CITY",
  "National Capital": "CAPITAL_CITY",
  "National capital territory": "CAPITAL_CITY",
  "Regional Average": "REGIONAL_AVERAGE",
  "Regional average": "REGIONAL_AVERAGE",
  "State average": "REGIONAL_AVERAGE",
  "Provincial average": "REGIONAL_AVERAGE",
  "Média provincial": "REGIONAL_AVERAGE",
  "Regional capital": "REGIONAL_CAPITAL",
  "Regional capital city": "REGIONAL_CAPITAL",
  "Regional capital market": "REGIONAL_CAPITAL",
  "State Capital": "REGIONAL_CAPITAL",
  "State capital": "REGIONAL_CAPITAL",
  "Regional State Capital": "REGIONAL_CAPITAL",
  "Region capital": "REGIONAL_CAPITAL",
  "Provincial Capital": "PROVINCIAL",
  "Provincial capital": "PROVINCIAL",
  "Provincial market": "PROVINCIAL",
  "Province": "PROVINCIAL",
  "Capital of province": "PROVINCIAL",
  "Department Capital": "DEPARTMENT",
  "Department capital": "DEPARTMENT",
  "Capital of district": "DEPARTMENT",
  "District": "DEPARTMENT",
  "District capital": "DEPARTMENT",
  "City": "CITY",
  "Town": "CITY",
  "Urban agglomeration": "CITY",
  "Port city": "CITY",
  "Charter city": "CITY",
  "Regional town": "CITY",
  "Prefecture-level city": "CITY",
  "Retail": "RETAIL_MARKET",
  "retail": "RETAIL_MARKET",
  "RETAIL": "RETAIL_MARKET",
  "Wholesale": "WHOLESALE_MARKET",
  "WHOLESALE": "WHOLESALE_MARKET",
};

// Unit normalization
function normalizeUnit(fpmaUnit: string): { normalized: string; conversionFactor: number } {
  const unitLower = fpmaUnit.toLowerCase().trim();
  
  if (unitLower === "kg" || unitLower === "1 kg") {
    return { normalized: "kg", conversionFactor: 1 };
  }
  
  const kgMatch = unitLower.match(/^(\d+(?:\.\d+)?)\s*kg$/i);
  if (kgMatch) {
    return { normalized: "kg", conversionFactor: parseFloat(kgMatch[1]) };
  }
  
  if (unitLower.includes("100 kg") || unitLower.includes("100kg")) {
    return { normalized: "kg", conversionFactor: 100 };
  }
  
  if (unitLower === "liter" || unitLower === "litre") {
    return { normalized: "liter", conversionFactor: 1 };
  }
  
  if (unitLower.includes("libra") || unitLower === "lb") {
    return { normalized: "kg", conversionFactor: 0.4536 };
  }
  
  if (unitLower.includes("spanish quintal")) {
    return { normalized: "kg", conversionFactor: 46 };
  }
  
  if (unitLower.includes("bolivian arroba")) {
    return { normalized: "kg", conversionFactor: 11.5 };
  }
  
  if (unitLower.includes("dozen")) {
    return { normalized: "piece", conversionFactor: 12 };
  }
  
  return { normalized: unitLower, conversionFactor: 1 };
}

interface FpmaSeries {
  uuid: string;
  iso3_country_code: string;
  country_name: string;
  market: number;
  market_name: string;
  market_info: string;
  market_type: string;
  admin_unit: string;
  commodity: number;
  commodity_name: string;
  commodity_code: string;
  source: number;
  source_name: string;
  source_url: string;
  price_type: string;
  currency: string;
  measure_unit: number;
  measure_unit_label: string;
  conversion_factor: number;
  periodicity: Array<{ period: string; start_date: string; end_date: string }>;
}

interface FpmaPrice {
  id: number;
  price_value: number;
  price_value_real: number | null;
  price_value_dollar: number | null;
  date: string;
  periodicity: string;
}

async function fetchWithRetry(url: string, retries = 3): Promise<unknown> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.log(`  ⚠ Retry ${i + 1}/${retries} for ${url}`);
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

export interface FpmaSyncResult {
  success: boolean;
  seriesUpdated: number;
  pricesCreated: number;
  error?: string;
}

/**
 * Sync latest FPMA data (incremental - last 3 months)
 */
export async function syncLatest(): Promise<FpmaSyncResult> {
  console.log("🌍 FPMA Incremental Sync Starting...");
  
  // Create sync record
  const sync = await prisma.fpmaDataSync.create({
    data: {
      syncType: "INCREMENTAL",
      status: "RUNNING",
      startedAt: new Date(),
    },
  });

  try {
    // Fetch series that have been updated recently (last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const newerThan = `${threeMonthsAgo.getMonth() + 1} months ago`;
    
    const seriesUrl = `${SERIES_ENDPOINT}?newerThan=${encodeURIComponent(newerThan)}`;
    const seriesData = await fetchWithRetry(seriesUrl) as { results: FpmaSeries[] };
    const allSeries: FpmaSeries[] = seriesData.results;
    
    console.log(`  Found ${allSeries.length} active series`);

    // Get existing series from DB
    const existingSeries = await prisma.fpmaSerie.findMany({
      select: { uuid: true, id: true },
    });
    const seriesMap = new Map(existingSeries.map(s => [s.uuid, s.id]));

    // Get lookup maps
    const marketLocationTypes = await prisma.marketLocationType.findMany();
    const marketTypeMap = new Map(marketLocationTypes.map(t => [t.code, t.id]));

    let seriesUpdated = 0;
    let pricesCreated = 0;

    // Process only series that exist in our DB
    for (const series of allSeries) {
      const serieId = seriesMap.get(series.uuid);
      if (!serieId) continue; // Skip new series - they need full import

      try {
        // Update series metadata
        const unitInfo = normalizeUnit(series.measure_unit_label);
        const marketTypeCode = MARKET_TYPE_MAPPING[series.market_type] || "OTHER";
        const marketLocationTypeId = marketTypeMap.get(marketTypeCode);

        let endDate = new Date();
        if (series.periodicity && series.periodicity.length > 0) {
          const monthly = series.periodicity.find(p => p.period === "monthly");
          if (monthly) {
            endDate = new Date(monthly.end_date);
          }
        }

        await prisma.fpmaSerie.update({
          where: { id: serieId },
          data: {
            endDate,
            measureUnitNormalized: unitInfo.normalized,
            conversionFactor: unitInfo.conversionFactor * (series.conversion_factor || 1),
            marketLocationTypeId,
          },
        });

        // Fetch latest prices (last 3 months only)
        const priceUrl = `${PRICE_ENDPOINT}${series.uuid}/`;
        const priceData = await fetchWithRetry(priceUrl) as { datapoints: FpmaPrice[] };
        
        if (priceData.datapoints && priceData.datapoints.length > 0) {
          // Filter to last 3 months
          const cutoffDate = new Date();
          cutoffDate.setMonth(cutoffDate.getMonth() - 3);
          
          const recentPrices = priceData.datapoints.filter((p: FpmaPrice) => {
            return new Date(p.date) >= cutoffDate;
          });

          for (const p of recentPrices) {
            const convFactor = unitInfo.conversionFactor * (series.conversion_factor || 1);
            
            try {
              await prisma.fpmaPrice.upsert({
                where: {
                  serieId_date: {
                    serieId,
                    date: new Date(p.date),
                  },
                },
                update: {
                  price: p.price_value,
                  priceReal: p.price_value_real,
                  priceUsd: p.price_value_dollar,
                  priceNormalized: convFactor > 0 ? p.price_value / convFactor : p.price_value,
                },
                create: {
                  serieId,
                  price: p.price_value,
                  priceReal: p.price_value_real,
                  priceUsd: p.price_value_dollar,
                  priceNormalized: convFactor > 0 ? p.price_value / convFactor : p.price_value,
                  date: new Date(p.date),
                  periodicity: p.periodicity,
                },
              });
              pricesCreated++;
            } catch {
              // Skip duplicate errors
            }
          }
        }

        seriesUpdated++;
      } catch (error) {
        console.log(`  ⚠ Error updating series ${series.uuid}:`, error);
      }
    }

    // Update sync record
    await prisma.fpmaDataSync.update({
      where: { id: sync.id },
      data: {
        status: "COMPLETED",
        seriesUpdated,
        pricesNew: pricesCreated,
        completedAt: new Date(),
      },
    });

    console.log(`✅ FPMA Sync Complete: ${seriesUpdated} series, ${pricesCreated} prices`);

    return {
      success: true,
      seriesUpdated,
      pricesCreated,
    };

  } catch (error) {
    console.error("❌ FPMA Sync Error:", error);
    
    await prisma.fpmaDataSync.update({
      where: { id: sync.id },
      data: {
        status: "FAILED",
        errorMessage: String(error),
        completedAt: new Date(),
      },
    });

    return {
      success: false,
      seriesUpdated: 0,
      pricesCreated: 0,
      error: String(error),
    };
  }
}

/**
 * Get sync status
 */
export async function getSyncStatus() {
  const lastSync = await prisma.fpmaDataSync.findFirst({
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    countries: await prisma.fpmaCountry.count(),
    markets: await prisma.fpmaMarket.count(),
    commodities: await prisma.fpmaCommodity.count(),
    series: await prisma.fpmaSerie.count(),
    prices: await prisma.fpmaPrice.count(),
  };

  return {
    lastSync,
    stats,
  };
}

