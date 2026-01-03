/**
 * FPMA Data Import Script
 * Imports FAO Food Price Monitoring & Analysis data
 * 
 * Data source: https://fpma.fao.org/giews/v4/global/price_module/api/v1/
 * 
 * This script:
 * 1. Fetches all series metadata
 * 2. Creates countries, markets, commodities, sources
 * 3. Fetches price data for each series (2000-present)
 * 4. Links commodities to GlobalProducts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// API endpoints
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

// Commodity to GlobalProduct mapping (base codes)
const COMMODITY_MAPPING: Record<string, string> = {
  "070190": "potato",
  "070200": "tomato",
  "070310": "onion",
  "070320": "garlic",
  "070490": "cabbage",
  "070610": "carrot",
  "070700": "cucumber",
  "070930": "eggplant",
  "070960": "pepper",
  "080310": "banana",
  "080390": "banana",
  "080440": "avocado",
  "080510": "orange",
  "080530": "lemon",
  "080550": "lemon",
  "080610": "grape",
  "080711": "watermelon",
  "080719": "melon",
  "080810": "apple",
  "080820": "pear",
  "080930": "peach",
  "080940": "plum",
};

// Unit normalization
function normalizeUnit(fpmaUnit: string): { normalized: string; conversionFactor: number } {
  const unitLower = fpmaUnit.toLowerCase().trim();
  
  // Direct kg matches
  if (unitLower === "kg" || unitLower === "1 kg") {
    return { normalized: "kg", conversionFactor: 1 };
  }
  
  // Weight with multiplier
  const kgMatch = unitLower.match(/^(\d+(?:\.\d+)?)\s*kg$/i);
  if (kgMatch) {
    return { normalized: "kg", conversionFactor: parseFloat(kgMatch[1]) };
  }
  
  // 100 kg
  if (unitLower.includes("100 kg") || unitLower.includes("100kg")) {
    return { normalized: "kg", conversionFactor: 100 };
  }
  
  // Liters
  if (unitLower === "liter" || unitLower === "litre") {
    return { normalized: "liter", conversionFactor: 1 };
  }
  
  // Libra/lb
  if (unitLower.includes("libra") || unitLower === "lb") {
    return { normalized: "kg", conversionFactor: 0.4536 };
  }
  
  // Special units
  if (unitLower.includes("spanish quintal")) {
    return { normalized: "kg", conversionFactor: 46 };
  }
  if (unitLower.includes("bolivian arroba")) {
    return { normalized: "kg", conversionFactor: 11.5 };
  }
  
  // Dozen
  if (unitLower.includes("dozen")) {
    return { normalized: "piece", conversionFactor: 12 };
  }
  
  // Default - return as is
  return { normalized: unitLower, conversionFactor: 1 };
}

// Extract variety from commodity name
function extractVariety(name: string): string | null {
  const match = name.match(/\(([^)]+)\)/);
  if (match) {
    const variety = match[1].toLowerCase().trim();
    // Common varieties
    if (variety.includes("imported")) return "imported";
    if (variety.includes("red")) return "red";
    if (variety.includes("white")) return "white";
    if (variety.includes("yellow")) return "yellow";
    if (variety.includes("organic")) return "organic";
    if (variety.includes("fresh")) return "fresh";
    if (variety.includes("pasteurized")) return "pasteurized";
    return variety;
  }
  return null;
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

async function fetchWithRetry(url: string, retries = 3): Promise<any> {
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

async function main() {
  console.log("🌍 FPMA Data Import Starting...\n");
  
  // Create sync record
  const sync = await prisma.fpmaDataSync.create({
    data: {
      syncType: "FULL",
      status: "RUNNING",
      startedAt: new Date(),
    },
  });

  try {
    // Step 1: Fetch all series metadata
    console.log("📡 Fetching series metadata...");
    const seriesData = await fetchWithRetry(SERIES_ENDPOINT);
    const allSeries: FpmaSeries[] = seriesData.results;
    console.log(`  Found ${allSeries.length} series\n`);

    // Step 2: Get market location types
    const marketLocationTypes = await prisma.marketLocationType.findMany();
    const marketTypeMap = new Map(marketLocationTypes.map(t => [t.code, t.id]));

    // Step 3: Get GlobalProducts for linking
    const globalProducts = await prisma.globalProduct.findMany();
    const globalProductMap = new Map(globalProducts.map(p => [p.slug, p.id]));

    // Step 4: Process countries
    console.log("🌐 Processing countries...");
    const countries = new Map<string, FpmaSeries>();
    for (const s of allSeries) {
      if (!countries.has(s.iso3_country_code)) {
        countries.set(s.iso3_country_code, s);
      }
    }

    for (const [iso3, sample] of countries) {
      await prisma.fpmaCountry.upsert({
        where: { iso3 },
        update: { nameEn: sample.country_name },
        create: {
          iso3,
          nameEn: sample.country_name,
          iso2: iso3.substring(0, 2), // Approximate
        },
      });
    }
    console.log(`  ✓ Created/Updated ${countries.size} countries\n`);

    // Step 5: Process sources
    console.log("📚 Processing sources...");
    const sources = new Map<number, FpmaSeries>();
    for (const s of allSeries) {
      if (!sources.has(s.source)) {
        sources.set(s.source, s);
      }
    }

    for (const [faoId, sample] of sources) {
      await prisma.fpmaSource.upsert({
        where: { faoId },
        update: { name: sample.source_name, url: sample.source_url },
        create: {
          faoId,
          name: sample.source_name,
          url: sample.source_url,
        },
      });
    }
    console.log(`  ✓ Created/Updated ${sources.size} sources\n`);

    // Step 6: Process markets
    console.log("🏪 Processing markets...");
    const markets = new Map<number, FpmaSeries>();
    for (const s of allSeries) {
      if (!markets.has(s.market)) {
        markets.set(s.market, s);
      }
    }

    const fpmaCountries = await prisma.fpmaCountry.findMany();
    const countryIdMap = new Map(fpmaCountries.map(c => [c.iso3, c.id]));

    for (const [faoId, sample] of markets) {
      const countryId = countryIdMap.get(sample.iso3_country_code);
      if (!countryId) continue;

      await prisma.fpmaMarket.upsert({
        where: { faoId },
        update: {
          name: sample.market_name,
          adminUnit: sample.admin_unit || null,
          info: sample.market_info || null,
          originalMarketType: sample.market_type,
        },
        create: {
          faoId,
          name: sample.market_name,
          countryId,
          adminUnit: sample.admin_unit || null,
          info: sample.market_info || null,
          originalMarketType: sample.market_type,
        },
      });
    }
    console.log(`  ✓ Created/Updated ${markets.size} markets\n`);

    // Step 7: Process commodities
    console.log("🥕 Processing commodities...");
    const commodities = new Map<string, FpmaSeries>();
    for (const s of allSeries) {
      if (!commodities.has(s.commodity_code)) {
        commodities.set(s.commodity_code, s);
      }
    }

    for (const [code, sample] of commodities) {
      const baseCode = code.split("_")[0];
      const variety = extractVariety(sample.commodity_name);
      const globalProductSlug = COMMODITY_MAPPING[baseCode];
      const globalProductId = globalProductSlug ? globalProductMap.get(globalProductSlug) : null;

      await prisma.fpmaCommodity.upsert({
        where: { code },
        update: {
          nameEn: sample.commodity_name,
          varietyName: variety,
          globalProductId,
        },
        create: {
          code,
          baseCode,
          nameEn: sample.commodity_name,
          varietyName: variety,
          globalProductId,
        },
      });
    }
    console.log(`  ✓ Created/Updated ${commodities.size} commodities\n`);

    // Step 8: Process series and prices
    console.log("📊 Processing series and prices...");
    
    const fpmaSources = await prisma.fpmaSource.findMany();
    const sourceIdMap = new Map(fpmaSources.map(s => [s.faoId, s.id]));
    
    const fpmaMarkets = await prisma.fpmaMarket.findMany();
    const marketIdMap = new Map(fpmaMarkets.map(m => [m.faoId, m.id]));
    
    const fpmaCommodities = await prisma.fpmaCommodity.findMany();
    const commodityIdMap = new Map(fpmaCommodities.map(c => [c.code, c.id]));

    let seriesCreated = 0;
    let pricesCreated = 0;
    let seriesErrors = 0;

    // Process in batches
    const batchSize = 50;
    for (let i = 0; i < allSeries.length; i += batchSize) {
      const batch = allSeries.slice(i, Math.min(i + batchSize, allSeries.length));
      
      console.log(`  Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allSeries.length / batchSize)}...`);

      for (const series of batch) {
        try {
          const countryId = countryIdMap.get(series.iso3_country_code);
          const commodityId = commodityIdMap.get(series.commodity_code);
          const marketId = marketIdMap.get(series.market);
          const sourceId = sourceIdMap.get(series.source);

          if (!countryId || !commodityId || !marketId || !sourceId) {
            seriesErrors++;
            continue;
          }

          // Normalize unit
          const unitInfo = normalizeUnit(series.measure_unit_label);
          
          // Get market location type
          const marketTypeCode = MARKET_TYPE_MAPPING[series.market_type] || "OTHER";
          const marketLocationTypeId = marketTypeMap.get(marketTypeCode);

          // Get date range from periodicity
          let startDate = new Date("2000-01-01");
          let endDate = new Date();
          
          if (series.periodicity && series.periodicity.length > 0) {
            const monthly = series.periodicity.find(p => p.period === "monthly");
            if (monthly) {
              startDate = new Date(monthly.start_date);
              endDate = new Date(monthly.end_date);
            }
          }

          // Create or update series
          const dbSeries = await prisma.fpmaSerie.upsert({
            where: { uuid: series.uuid },
            update: {
              priceType: series.price_type,
              currency: series.currency,
              measureUnit: series.measure_unit_label,
              measureUnitNormalized: unitInfo.normalized,
              conversionFactor: unitInfo.conversionFactor * (series.conversion_factor || 1),
              startDate,
              endDate,
              marketLocationTypeId,
            },
            create: {
              uuid: series.uuid,
              countryId,
              commodityId,
              marketId,
              sourceId,
              priceType: series.price_type,
              currency: series.currency,
              measureUnit: series.measure_unit_label,
              measureUnitNormalized: unitInfo.normalized,
              conversionFactor: unitInfo.conversionFactor * (series.conversion_factor || 1),
              startDate,
              endDate,
              marketLocationTypeId,
            },
          });

          seriesCreated++;

          // Fetch prices for this series
          try {
            const priceUrl = `${PRICE_ENDPOINT}${series.uuid}/`;
            const priceData = await fetchWithRetry(priceUrl);
            
            if (priceData.datapoints && priceData.datapoints.length > 0) {
              // Filter to only include data from 2000 onwards
              const validPrices = priceData.datapoints.filter((p: FpmaPrice) => {
                const year = parseInt(p.date.split("-")[0]);
                return year >= 2000;
              });

              // Batch insert prices
              const priceRecords = validPrices.map((p: FpmaPrice) => {
                const convFactor = unitInfo.conversionFactor * (series.conversion_factor || 1);
                return {
                  serieId: dbSeries.id,
                  price: p.price_value,
                  priceReal: p.price_value_real,
                  priceUsd: p.price_value_dollar,
                  priceNormalized: convFactor > 0 ? p.price_value / convFactor : p.price_value,
                  date: new Date(p.date),
                  periodicity: p.periodicity,
                };
              });

              // Delete existing prices and insert new ones
              await prisma.fpmaPrice.deleteMany({
                where: { serieId: dbSeries.id },
              });

              if (priceRecords.length > 0) {
                await prisma.fpmaPrice.createMany({
                  data: priceRecords,
                });
                pricesCreated += priceRecords.length;
              }
            }
          } catch (priceError) {
            // Price fetch error - continue with next series
          }
        } catch (seriesError) {
          seriesErrors++;
        }
      }
      
      // Small delay between batches
      await new Promise(r => setTimeout(r, 500));
    }

    console.log(`\n  ✓ Series created/updated: ${seriesCreated}`);
    console.log(`  ✓ Prices created: ${pricesCreated}`);
    console.log(`  ⚠ Series errors: ${seriesErrors}`);

    // Update sync record
    await prisma.fpmaDataSync.update({
      where: { id: sync.id },
      data: {
        status: "COMPLETED",
        seriesTotal: allSeries.length,
        seriesNew: seriesCreated,
        pricesTotal: pricesCreated,
        pricesNew: pricesCreated,
        completedAt: new Date(),
      },
    });

    console.log("\n✅ FPMA Data Import Completed!");

  } catch (error) {
    console.error("\n❌ Error:", error);
    
    await prisma.fpmaDataSync.update({
      where: { id: sync.id },
      data: {
        status: "FAILED",
        errorMessage: String(error),
        completedAt: new Date(),
      },
    });

    throw error;
  }
}

main()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




