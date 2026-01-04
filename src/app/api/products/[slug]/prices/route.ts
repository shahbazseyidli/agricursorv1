import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subMonths, subYears, subDays, startOfYear, format } from "date-fns";

// Helper to convert price using FX rate and unit
function convertPriceWithUnit(price: number, fxRate: number, unitRate: number): number {
  // price is in AZN/kg
  // fxRate: how many target currency = 1 AZN
  // unitRate: how many target units = 1 kg
  // Final price = price * fxRate / unitRate
  return (price * fxRate) / unitRate;
}

// Wrapper for backward compatibility
function convertPrice(price: number, rateToAZN: number): number {
  return price * rateToAZN;
}

// Helper to convert EU price (€/100kg to €/kg)
function convertEuPriceToKg(pricePerHundredKg: number): number {
  return pricePerHundredKg / 100;
}

// Helper to normalize FPMA price to per kg based on measure_unit
function normalizeFpmaPriceToKg(price: number, measureUnit: string): number {
  if (!measureUnit) return price;
  
  const unit = measureUnit.toLowerCase().trim();
  
  // Parse numeric values from unit strings like "100 kg", "10 Kg", "2.5 kg"
  const kgMatch = unit.match(/^([\d.]+)\s*kg$/i);
  if (kgMatch) {
    const kgAmount = parseFloat(kgMatch[1]);
    return price / kgAmount; // e.g., 362 per 100kg → 3.62 per kg
  }
  
  // Handle specific units
  if (unit === "kg" || unit === "1 kg") return price;
  if (unit === "100 kg") return price / 100;
  if (unit === "10 kg") return price / 10;
  if (unit === "50 kg") return price / 50;
  if (unit === "25 kg") return price / 25;
  if (unit === "tonne") return price / 1000;
  if (unit === "lb" || unit === "libra") return price * 2.20462; // lb to kg
  if (unit === "liter" || unit === "liters") return price; // assume 1L ≈ 1kg for liquids
  
  // Handle units with grams
  const gmsMatch = unit.match(/^([\d.]+)\s*(gms|grams?)$/i);
  if (gmsMatch) {
    const grams = parseFloat(gmsMatch[1]);
    return (price / grams) * 1000; // Convert to per kg
  }
  
  // Spanish quintal (46 kg)
  if (unit.includes("spanish quintal")) return price / 46;
  
  // Bolivian arroba (11.5 kg)
  if (unit.includes("bolivian arroba")) return price / 11.5;
  
  // Default: return as is (for unknown units)
  return price;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const marketId = searchParams.get("market");
    const marketTypeId = searchParams.get("marketType");
    const productTypeId = searchParams.get("productType");
    const range = searchParams.get("range") || "6m";
    const compareMarkets = searchParams.get("compareMarkets");
    const targetCurrency = searchParams.get("currency") || "USD";
    const targetUnit = searchParams.get("unit") || "kg";
    const isGuest = searchParams.get("guest") === "true";
    const countryCode = searchParams.get("country")?.toUpperCase() || "AZ";

    // Get unit conversion rate
    let unitConversionRate = 1;
    if (targetUnit !== "kg") {
      const unit = await prisma.unit.findUnique({
        where: { code: targetUnit },
      });
      if (unit) {
        // conversionRate in DB is: how many targetUnit = 1 kg
        // e.g., lb has conversionRate 2.20462 (1 kg = 2.20462 lb)
        // So price per lb = price per kg / 2.20462
        // For 100kg: conversionRate 0.01 (1 kg = 0.01 100kg units)
        // price per 100kg = price per kg / 0.01 = price * 100
        unitConversionRate = unit.conversionRate;
      }
    }

    // Get currency conversion rate
    let fxRate = 1;
    let currencySymbol = "₼";
    if (targetCurrency !== "AZN") {
      const currency = await prisma.currency.findUnique({
        where: { code: targetCurrency },
      });
      if (currency) {
        fxRate = currency.rateToAZN;
        currencySymbol = currency.symbol;
      }
    }

    // Calculate date range
    let startDate: Date;
    let endDate: Date = new Date();
    const now = new Date();
    
    const customStartDate = searchParams.get("startDate");
    const customEndDate = searchParams.get("endDate");

    if (range === "custom" && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
    } else {
      switch (range) {
        case "1m":
          startDate = subMonths(now, 1);
          break;
        case "3m":
          startDate = subMonths(now, 3);
          break;
        case "6m":
          startDate = subMonths(now, 6);
          break;
        case "1y":
          startDate = subYears(now, 1);
          break;
        case "all":
          startDate = new Date("2000-01-01");
          break;
        default:
          startDate = subMonths(now, 6);
      }
    }

    // Get data source from query param
    const dataSource = searchParams.get("dataSource") || "auto";
    
    // Get filter params for FPMA and AZ
    const priceStageParam = searchParams.get("priceStage"); // GlobalPriceStage code
    const globalMarketParam = searchParams.get("globalMarket"); // GlobalMarket ID

    // ============================================
    // FAO FPMA DATA
    // ============================================
    if (dataSource === "FAO_FPMA" || (dataSource === "auto" && countryCode !== "AZ")) {
      // Build FPMA series filter
      const seriesWhere: any = {
        country: {
          OR: [
            { iso2: countryCode },
            { iso3: countryCode },
          ]
        }
      };
      
      // Apply priceStage filter (GlobalPriceStage code)
      if (priceStageParam) {
        seriesWhere.globalPriceStage = {
          code: priceStageParam
        };
      }
      
      // Apply market filter (FpmaMarket ID or GlobalMarket ID)
      if (globalMarketParam) {
        // First check if it's a GlobalMarket ID
        const globalMarket = await prisma.globalMarket.findUnique({
          where: { id: globalMarketParam },
          include: { fpmaMarkets: true }
        });
        
        if (globalMarket && globalMarket.fpmaMarkets.length > 0) {
          seriesWhere.marketId = { in: globalMarket.fpmaMarkets.map(m => m.id) };
        } else {
          // Try as FpmaMarket ID directly
          seriesWhere.marketId = globalMarketParam;
        }
      }

      // Try FPMA data first for non-AZ countries
      const globalProduct = await prisma.globalProduct.findUnique({
        where: { slug },
        include: {
          fpmaCommodities: {
            include: {
              series: {
                where: seriesWhere,
                include: {
                  country: true,
                  market: {
                    include: {
                      globalMarket: true
                    }
                  },
                  globalPriceStage: true,
                  prices: {
                    where: {
                      date: { gte: startDate, lte: endDate }
                    },
                    orderBy: { date: "asc" },
                  }
                }
              }
            }
          }
        }
      });

      if (globalProduct && globalProduct.fpmaCommodities.length > 0) {
        const allSeries = globalProduct.fpmaCommodities.flatMap(c => c.series);
        const allPrices = allSeries.flatMap(s => s.prices.map(p => ({
          ...p,
          market: s.market,
          priceType: s.priceType,
          globalPriceStage: s.globalPriceStage,
          currency: s.currency,
          measureUnit: s.measureUnit,
        })));

        if (allPrices.length > 0) {
          // Get unique price stages
          const uniquePriceStages = [...new Set(allSeries
            .filter(s => s.globalPriceStage)
            .map(s => JSON.stringify({
              id: s.globalPriceStage!.id,
              code: s.globalPriceStage!.code,
              name: s.globalPriceStage!.nameAz || s.globalPriceStage!.nameEn,
              hasData: true
            }))
          )].map(s => JSON.parse(s));

          // Get unique GlobalMarkets (via FpmaMarket -> GlobalMarket)
          const globalMarketsByName = new Map<string, { 
            id: string; 
            name: string; 
            hasData: boolean;
            isNationalAvg: boolean;
          }>();
          allSeries.forEach(s => {
            const gm = s.market.globalMarket;
            const marketName = gm?.name || s.market.name;
            const marketId = gm?.id || s.market.id;
            
            if (!globalMarketsByName.has(marketName)) {
              globalMarketsByName.set(marketName, {
                id: marketId,
                name: marketName,
                hasData: true,
                isNationalAvg: gm?.isNationalAvg || marketName.toLowerCase().includes('national')
              });
            }
          });
          const uniqueMarkets = Array.from(globalMarketsByName.values());

          // Format for chart - normalize all prices to per kg
          const chartData = allPrices.map(p => {
            const normalizedPrice = normalizeFpmaPriceToKg(p.price, p.measureUnit);
            return {
              date: p.date.toISOString().split("T")[0],
              priceMin: normalizedPrice,
              priceAvg: normalizedPrice,
              priceMax: normalizedPrice,
              market: p.market.globalMarket?.name || p.market.name,
              marketId: p.market.globalMarket?.id || p.market.id,
              marketType: p.priceType,
              priceStage: p.globalPriceStage?.code,
              priceUsd: p.priceUsd,
              originalCurrency: p.currency,
              originalUnit: p.measureUnit,
            };
          }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          // Latest price - normalized to per kg
          const latestPriceData = allPrices[allPrices.length - 1];
          const latestNormalizedPrice = latestPriceData 
            ? normalizeFpmaPriceToKg(latestPriceData.price, latestPriceData.measureUnit)
            : 0;
          const latestPrice = latestPriceData ? {
            priceMin: latestNormalizedPrice,
            priceAvg: latestNormalizedPrice,
            priceMax: latestNormalizedPrice,
            date: latestPriceData.date,
            currency: latestPriceData.currency,
            currencySymbol: latestPriceData.currency,
            market: latestPriceData.market.globalMarket?.name || latestPriceData.market.name,
            marketType: latestPriceData.priceType,
          } : null;

          // Price change - use normalized prices
          let priceChange = null;
          if (allPrices.length >= 2) {
            const latest = allPrices[allPrices.length - 1];
            const prev = allPrices[Math.max(0, allPrices.length - 30)];
            const latestNorm = normalizeFpmaPriceToKg(latest.price, latest.measureUnit);
            const prevNorm = normalizeFpmaPriceToKg(prev.price, prev.measureUnit);
            const change = latestNorm - prevNorm;
            const percentage = (change / prevNorm) * 100;
            priceChange = {
              value: change,
              percentage,
              direction: change > 0 ? "up" : change < 0 ? "down" : "stable",
            };
          }

          // Get country info from GlobalCountry
          const fpmaCountry = allSeries[0]?.country;
          const globalCountry = fpmaCountry ? await prisma.globalCountry.findFirst({
            where: {
              OR: [
                { iso2: fpmaCountry.iso2 || "" },
                { iso3: fpmaCountry.iso3 }
              ]
            }
          }) : null;

          return NextResponse.json({
            data: chartData,
            comparisonData: [],
            filters: {
              marketTypes: uniquePriceStages,
              markets: uniqueMarkets,
              productTypes: [],
              priceStages: uniquePriceStages
            },
            stats: {
              latestPrice,
              priceChange,
              totalRecords: allPrices.length,
              marketTypeStats: [],
              priceChanges: {},
              dateRange: {
                from: allPrices[0]?.date,
                to: allPrices[allPrices.length - 1]?.date
              },
              isGuest,
              currency: {
                code: latestPriceData?.currency || "USD",
                symbol: latestPriceData?.currency || "$",
                fxRate: 1
              },
              country: {
                code: globalCountry?.iso2 || countryCode,
                iso3: globalCountry?.iso3 || fpmaCountry?.iso3,
                name: globalCountry?.nameAz || globalCountry?.nameEn || fpmaCountry?.nameEn || countryCode,
                flag: globalCountry?.flagEmoji
              },
              source: "FAO_FPMA"
            },
          });
        }
      }
      
      // If FPMA data not found and dataSource was explicitly FAO_FPMA, return empty
      if (dataSource === "FAO_FPMA") {
        // Get country info for empty response
        const globalCountry = await prisma.globalCountry.findFirst({
          where: {
            OR: [
              { iso2: countryCode },
              { iso3: countryCode }
            ]
          }
        });
        
        return NextResponse.json({
          data: [],
          comparisonData: [],
          filters: { marketTypes: [], markets: [], productTypes: [], priceStages: [] },
          stats: {
            latestPrice: null,
            priceChange: null,
            totalRecords: 0,
            marketTypeStats: [],
            priceChanges: {},
            dateRange: { from: null, to: null },
            isGuest,
            currency: { code: "USD", symbol: "$", fxRate: 1 },
            country: { 
              code: globalCountry?.iso2 || countryCode, 
              iso3: globalCountry?.iso3,
              name: globalCountry?.nameAz || globalCountry?.nameEn || countryCode,
              flag: globalCountry?.flagEmoji
            },
            source: "FAO_FPMA",
            noData: true
          },
        });
      }
    }

    // ============================================
    // EU COUNTRY DATA
    // ============================================
    if (countryCode !== "AZ" && dataSource !== "AGRO_AZ") {
      // Find EU country
      const euCountry = await prisma.euCountry.findUnique({
        where: { code: countryCode }
      });

      if (!euCountry) {
        return NextResponse.json(
          { error: "Ölkə tapılmadı" },
          { status: 404 }
        );
      }

      // For EU data, we need to be more flexible with date ranges
      // since EU data is annual and may not have recent data
      // Determine the start year based on range, but allow for historical data
      const currentYear = new Date().getFullYear();
      let euStartYear = startDate.getFullYear();
      
      // For short ranges (1m, 3m, 6m), include at least 3 years of data
      // For EU annual data, short date ranges don't make sense
      if (range === "1m" || range === "3m" || range === "6m" || range === "1y") {
        euStartYear = Math.min(euStartYear, currentYear - 3);
      }
      // For "all" range, get everything from 2000
      if (range === "all") {
        euStartYear = 2000;
      }

      // Find global product first, then EU product
      const globalProduct = await prisma.globalProduct.findUnique({
        where: { slug },
        include: {
          euProducts: {
            include: {
              prices: {
                where: {
                  countryId: euCountry.id,
                  year: { gte: euStartYear }
                },
                orderBy: [{ year: "asc" }, { period: "asc" }]
              }
            }
          }
        }
      });

      if (!globalProduct || globalProduct.euProducts.length === 0) {
        // No EU data for this product
        return NextResponse.json({
          data: [],
          comparisonData: [],
          filters: {
            marketTypes: [],
            markets: [],
            productTypes: [],
            priceStages: []
          },
          stats: {
            latestPrice: null,
            priceChange: null,
            totalRecords: 0,
            marketTypeStats: [],
            priceChanges: {},
            dateRange: { from: null, to: null },
            isGuest,
            currency: { code: targetCurrency, symbol: currencySymbol, fxRate },
            country: { code: countryCode, name: euCountry.nameAz || euCountry.nameEn },
            source: "EU_DATA",
            noData: true
          },
        });
      }

      // Get all prices for this country
      const allEuPrices = globalProduct.euProducts.flatMap(ep => ep.prices);

      // Get unique price stages for filter
      const uniquePriceStages = [...new Set(allEuPrices.map(p => p.priceStage).filter(Boolean))];
      const priceStagesWithAvailability = uniquePriceStages.map(stage => ({
        id: stage,
        name: stage === "PRODUCER" ? "İstehsalçı qiyməti" : 
              stage === "RETAIL" ? "Pərakəndə satış" : 
              stage === "WHOLESALE" ? "Topdansatış" : 
              stage === "FARMGATE" ? "Fermer qiyməti" : stage || "Digər",
        code: stage,
        hasData: true
      }));

      // Format EU prices for chart
      // EU data is annual, so we create points for each year
      const chartData = allEuPrices.map(p => {
        // Convert €/100kg to €/kg for display
        const pricePerKg = convertEuPriceToKg(p.price);
        // Then apply currency conversion
        const convertedPrice = targetCurrency === "EUR" 
          ? pricePerKg 
          : convertPrice(pricePerKg, fxRate);

        return {
          date: p.startDate?.toISOString().split("T")[0] || `${p.year}-01-01`,
          priceMin: convertedPrice * 0.95, // EU data often has only single price
          priceAvg: convertedPrice,
          priceMax: convertedPrice * 1.05,
          year: p.year,
          period: p.period,
          periodType: p.periodType,
          source: p.source,
          priceStage: p.priceStage,
          variety: p.variety,
          market: p.market || `${euCountry.nameEn} ortalaması`,
          marketType: p.priceStage === "PRODUCER" ? "İstehsalçı" : 
                      p.priceStage === "RETAIL" ? "Pərakəndə" : p.priceStage,
          originalUnit: globalProduct.euProducts[0]?.unit || "€/100kg",
          displayUnit: "kg"
        };
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Latest price
      const latestPriceData = allEuPrices[allEuPrices.length - 1];
      const latestPrice = latestPriceData ? {
        priceMin: convertEuPriceToKg(latestPriceData.price) * 0.95,
        priceAvg: convertEuPriceToKg(latestPriceData.price),
        priceMax: convertEuPriceToKg(latestPriceData.price) * 1.05,
        date: latestPriceData.startDate || new Date(`${latestPriceData.year}-12-31`),
        currency: targetCurrency === "EUR" ? "EUR" : targetCurrency,
        currencySymbol: targetCurrency === "EUR" ? "€" : currencySymbol,
        market: `${euCountry.nameAz || euCountry.nameEn} ortalaması`,
        marketType: latestPriceData.priceStage === "PRODUCER" ? "İstehsalçı qiyməti" : latestPriceData.priceStage,
        source: latestPriceData.source,
        year: latestPriceData.year
      } : null;

      // Price change calculation for EU (compare years)
      const years = [...new Set(allEuPrices.map(p => p.year))].sort((a, b) => b - a);
      let priceChange = null;
      if (years.length >= 2) {
        const latestYearPrices = allEuPrices.filter(p => p.year === years[0]);
        const prevYearPrices = allEuPrices.filter(p => p.year === years[1]);
        
        if (latestYearPrices.length > 0 && prevYearPrices.length > 0) {
          const latestAvg = latestYearPrices.reduce((sum, p) => sum + p.price, 0) / latestYearPrices.length;
          const prevAvg = prevYearPrices.reduce((sum, p) => sum + p.price, 0) / prevYearPrices.length;
          const change = latestAvg - prevAvg;
          const percentage = (change / prevAvg) * 100;
          
          priceChange = {
            value: convertEuPriceToKg(change),
            percentage,
            direction: change > 0 ? "up" : change < 0 ? "down" : "stable",
            compareYears: `${years[1]} → ${years[0]}`
          };
        }
      }

      // Date range
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);

      return NextResponse.json({
        data: chartData,
        comparisonData: [],
        filters: {
          marketTypes: priceStagesWithAvailability, // Use priceStages as marketTypes for EU
          markets: [], // EU has no markets
          productTypes: [], // EU products have no subtypes in this context
          priceStages: priceStagesWithAvailability
        },
        stats: {
          latestPrice,
          priceChange,
          totalRecords: allEuPrices.length,
          marketTypeStats: [], // EU doesn't have AZ-style market types
          priceChanges: {
            year1: priceChange // Use year-over-year change
          },
          dateRange: {
            from: new Date(`${minYear}-01-01`),
            to: new Date(`${maxYear}-12-31`)
          },
          isGuest,
          currency: {
            code: targetCurrency === "EUR" ? "EUR" : targetCurrency,
            symbol: targetCurrency === "EUR" ? "€" : currencySymbol,
            fxRate: targetCurrency === "EUR" ? 1 : fxRate
          },
          country: {
            code: countryCode,
            name: euCountry.nameAz || euCountry.nameEn
          },
          source: "EU_DATA",
          dataInfo: {
            originalUnit: "€/100kg",
            displayUnit: "kg",
            note: "Eurostat istehsalçı qiymətləri"
          }
        },
      });
    }

    // ============================================
    // AZERBAIJAN DATA (existing logic)
    // ============================================
    
    // Get product - first try GlobalProduct, then local
    let product = await prisma.product.findFirst({
      where: { slug },
      include: {
        productTypes: true,
        country: true,
      },
    });

    // If not found by slug, try finding via GlobalProduct
    if (!product) {
      const globalProduct = await prisma.globalProduct.findUnique({
        where: { slug },
        include: {
          localProducts: {
            include: {
              productTypes: true,
              country: true,
            }
          }
        }
      });

      if (globalProduct?.localProducts[0]) {
        product = globalProduct.localProducts[0];
      }
    }

    if (!product) {
      return NextResponse.json(
        { error: "Məhsul tapılmadı" },
        { status: 404 }
      );
    }

    // ============================================
    // Check if National Average is selected (use AzPriceAggregate)
    // ============================================
    if (globalMarketParam) {
      const selectedGlobalMarket = await prisma.globalMarket.findUnique({
        where: { id: globalMarketParam }
      });
      
      if (selectedGlobalMarket?.isNationalAvg && selectedGlobalMarket?.aggregationType) {
        // Use AzPriceAggregate data
        const periodType = selectedGlobalMarket.aggregationType; // "WEEKLY" or "MONTHLY"
        
        // Build aggregate query
        const aggregateWhere: any = {
          productId: product.id,
          startDate: { gte: startDate },
          periodType: periodType,
        };
        
        // Apply GlobalPriceStage filter → MarketType
        if (priceStageParam) {
          const globalPriceStage = await prisma.globalPriceStage.findUnique({
            where: { code: priceStageParam },
            include: { azMarketTypes: true }
          });
          
          if (globalPriceStage && globalPriceStage.azMarketTypes.length > 0) {
            aggregateWhere.marketTypeId = { in: globalPriceStage.azMarketTypes.map(mt => mt.id) };
          }
        }
        
        if (productTypeId) {
          aggregateWhere.productTypeId = productTypeId;
        }
        
        const aggregates = await prisma.azPriceAggregate.findMany({
          where: aggregateWhere,
          include: {
            marketType: true,
            productType: true,
          },
          orderBy: [{ year: "asc" }, { period: "asc" }],
        });
        
        // Get GlobalCountry for Azerbaijan
        const azGlobalCountry = await prisma.globalCountry.findFirst({
          where: { iso2: "AZ" }
        });
        
        // Format aggregate data for chart
        const chartData = aggregates.map(a => ({
          date: a.startDate.toISOString().split("T")[0],
          priceMin: convertPriceWithUnit(a.minPrice, fxRate, unitConversionRate),
          priceAvg: convertPriceWithUnit(a.avgPrice, fxRate, unitConversionRate),
          priceMax: convertPriceWithUnit(a.maxPrice, fxRate, unitConversionRate),
          market: selectedGlobalMarket.nameAz || selectedGlobalMarket.name,
          marketId: selectedGlobalMarket.id,
          marketType: a.marketType.nameAz,
          marketTypeId: a.marketTypeId,
          productType: a.productType?.name || null,
          productTypeId: a.productTypeId,
          periodType: a.periodType,
          period: a.period,
          year: a.year,
        }));
        
        // Latest aggregate price
        const latestAggregate = aggregates[aggregates.length - 1];
        
        // Get market types for filters
        const marketTypes = await prisma.marketType.findMany({
          where: { countryId: product.countryId },
          include: { globalPriceStage: true }
        });
        
        const marketTypesWithAvailability = marketTypes.map(mt => ({
          id: mt.id,
          code: mt.code,
          name: mt.nameAz,
          hasData: true,
          globalPriceStageId: mt.globalPriceStageId,
          globalPriceStageCode: mt.globalPriceStage?.code
        }));
        
        // Get GlobalMarkets for AZ
        const azGlobalMarkets = await prisma.globalMarket.findMany({
          where: { 
            globalCountry: { iso2: "AZ" }
          },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
        });
        
        const marketsWithAvailability = azGlobalMarkets.map(gm => ({
          id: gm.id,
          name: gm.nameAz || gm.name,
          hasData: true,
          isNationalAvg: gm.isNationalAvg,
          aggregationType: gm.aggregationType
        }));
        
        return NextResponse.json({
          data: chartData,
          comparisonData: [],
          filters: {
            marketTypes: marketTypesWithAvailability,
            markets: marketsWithAvailability,
            productTypes: product.productTypes.map(pt => ({
              id: pt.id,
              name: pt.name,
              hasData: true
            })),
            priceStages: marketTypesWithAvailability
          },
          stats: {
            latestPrice: latestAggregate ? {
              priceMin: convertPriceWithUnit(latestAggregate.minPrice, fxRate, unitConversionRate),
              priceAvg: convertPriceWithUnit(latestAggregate.avgPrice, fxRate, unitConversionRate),
              priceMax: convertPriceWithUnit(latestAggregate.maxPrice, fxRate, unitConversionRate),
              date: latestAggregate.startDate,
              currency: targetCurrency,
              currencySymbol,
              market: selectedGlobalMarket.nameAz || selectedGlobalMarket.name,
              marketType: latestAggregate.marketType.nameAz,
            } : null,
            priceChange: null,
            totalRecords: aggregates.length,
            marketTypeStats: [],
            priceChanges: {},
            dateRange: {
              from: aggregates[0]?.startDate,
              to: aggregates[aggregates.length - 1]?.endDate
            },
            isGuest,
            currency: { code: targetCurrency, symbol: currencySymbol, fxRate },
            unit: { code: targetUnit, conversionRate: unitConversionRate },
            country: {
              code: "AZ",
              iso3: "AZE",
              name: azGlobalCountry?.nameAz || "Azərbaycan",
              flag: azGlobalCountry?.flagEmoji || "🇦🇿"
            },
            source: "AGRO_AZ",
            aggregationType: periodType
          },
        });
      }
    }

    // Build where clause for regular AZ price data
    const where: any = {
      productId: product.id,
      date: { 
        gte: startDate,
        ...(range === "custom" ? { lte: endDate } : {})
      },
    };

    // Apply GlobalPriceStage filter → MarketType
    if (priceStageParam) {
      const globalPriceStage = await prisma.globalPriceStage.findUnique({
        where: { code: priceStageParam },
        include: { azMarketTypes: true }
      });
      
      if (globalPriceStage && globalPriceStage.azMarketTypes.length > 0) {
        const azMarketTypeIds = globalPriceStage.azMarketTypes.map(mt => mt.id);
        // Get markets with these market types
        const azMarketsForType = await prisma.market.findMany({
          where: { marketTypeId: { in: azMarketTypeIds } },
          select: { id: true }
        });
        where.marketId = { in: azMarketsForType.map(m => m.id) };
      }
    }
    
    // Apply GlobalMarket filter → AZ Market
    if (globalMarketParam && !priceStageParam) {
      const selectedGlobalMarket = await prisma.globalMarket.findUnique({
        where: { id: globalMarketParam },
        include: { azMarkets: true }
      });
      
      if (selectedGlobalMarket && selectedGlobalMarket.azMarkets.length > 0) {
        where.marketId = { in: selectedGlobalMarket.azMarkets.map(m => m.id) };
      }
    }

    if (marketId) {
      where.marketId = marketId;
    }

    if (productTypeId) {
      where.productTypeId = productTypeId;
    }

    // Get all market types with price availability
    const marketTypes = await prisma.marketType.findMany({
      where: {
        countryId: product.countryId,
      },
      include: {
        markets: {
          where: {
            prices: {
              some: { productId: product.id },
            },
          },
          select: { id: true },
        },
      },
    });

    const marketTypesWithAvailability = marketTypes.map((mt) => ({
      id: mt.id,
      code: mt.code,
      name: mt.nameAz,
      hasData: mt.markets.length > 0,
    }));

    // Get markets for selected market type
    const marketsWhere: any = {
      countryId: product.countryId,
    };
    
    if (marketTypeId) {
      marketsWhere.marketTypeId = marketTypeId;
    }

    const markets = await prisma.market.findMany({
      where: marketsWhere,
      include: {
        marketType: true,
        _count: {
          select: {
            prices: {
              where: { productId: product.id },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const marketsWithAvailability = markets.map((m) => ({
      id: m.id,
      name: m.name,
      marketTypeId: m.marketTypeId,
      marketTypeName: m.marketType.nameAz,
      hasData: m._count.prices > 0,
    }));

    // Get product types with price availability
    const productTypesWithAvailability = await Promise.all(
      product.productTypes.map(async (pt) => {
        const count = await prisma.price.count({
          where: {
            productId: product!.id,
            productTypeId: pt.id,
          },
        });
        return {
          id: pt.id,
          name: pt.name,
          hasData: count > 0,
        };
      })
    );

    // Filter by market type if selected
    if (marketTypeId && !marketId) {
      const marketIds = markets.filter((m) => m.marketTypeId === marketTypeId).map((m) => m.id);
      if (marketIds.length > 0) {
        where.marketId = { in: marketIds };
      }
    }

    // Fetch prices
    const prices = await prisma.price.findMany({
      where,
      include: {
        market: {
          include: { marketType: true },
        },
        productType: true,
      },
      orderBy: { date: "asc" },
    });

    // Guest user limitation
    let limitedPrices = prices;
    if (isGuest && prices.length > 0) {
      const firstMarketId = prices[0].marketId;
      limitedPrices = prices.filter((p) => p.marketId === firstMarketId);
      limitedPrices = limitedPrices.slice(0, Math.min(30, limitedPrices.length));
    }

    // Format for chart
    const chartData = limitedPrices.map((p) => ({
      date: p.date.toISOString().split("T")[0],
      priceMin: convertPriceWithUnit(Number(p.priceMin), fxRate, unitConversionRate),
      priceAvg: convertPriceWithUnit(Number(p.priceAvg), fxRate, unitConversionRate),
      priceMax: convertPriceWithUnit(Number(p.priceMax), fxRate, unitConversionRate),
      market: p.market.name,
      marketId: p.marketId,
      marketType: p.market.marketType.nameAz,
      marketTypeId: p.market.marketTypeId,
      productType: p.productType?.name || null,
      productTypeId: p.productTypeId,
    }));

    // Latest price stats
    const latestPrice = prices[prices.length - 1];
    const previousPrice = prices.length > 1 ? prices[prices.length - 2] : null;

    let priceChange = null;
    if (latestPrice && previousPrice) {
      const change = Number(latestPrice.priceAvg) - Number(previousPrice.priceAvg);
      const percentage = (change / Number(previousPrice.priceAvg)) * 100;
      priceChange = {
        value: convertPrice(change, fxRate),
        percentage,
        direction: change > 0 ? "up" : change < 0 ? "down" : "stable",
      };
    }

    // Market type stats
    const marketTypeStats = await Promise.all(
      marketTypes.map(async (mt) => {
        const latestPriceForType = await prisma.price.findFirst({
          where: {
            productId: product!.id,
            market: { marketTypeId: mt.id },
            ...(productTypeId ? { productTypeId } : {}),
          },
          orderBy: { date: "desc" },
          select: { date: true },
        });

        if (!latestPriceForType) return null;

        const pricesForDate = await prisma.price.findMany({
          where: {
            productId: product!.id,
            market: { marketTypeId: mt.id },
            date: latestPriceForType.date,
            ...(productTypeId ? { productTypeId } : {}),
          },
        });

        if (pricesForDate.length === 0) return null;

        const avgPrice = pricesForDate.reduce((sum, p) => sum + Number(p.priceAvg), 0) / pricesForDate.length;
        const minPrice = Math.min(...pricesForDate.map((p) => Number(p.priceMin)));
        const maxPrice = Math.max(...pricesForDate.map((p) => Number(p.priceMax)));

        return {
          marketTypeId: mt.id,
          marketTypeCode: mt.code,
          marketTypeName: mt.nameAz,
          avgPrice: convertPrice(avgPrice, fxRate),
          minPrice: convertPrice(minPrice, fxRate),
          maxPrice: convertPrice(maxPrice, fxRate),
          date: latestPriceForType.date,
          currency: targetCurrency,
          currencySymbol,
          marketCount: pricesForDate.length,
        };
      })
    );

    // Price changes for periods
    const calculatePriceChange = async (daysAgo: number) => {
      const targetDate = subDays(now, daysAgo);
      
      const latestWhere: any = {
        productId: product!.id,
        ...(productTypeId ? { productTypeId } : {}),
      };
      
      if (marketId) {
        latestWhere.marketId = marketId;
      } else if (marketTypeId) {
        const marketIds = markets.filter((m) => m.marketTypeId === marketTypeId).map((m) => m.id);
        if (marketIds.length > 0) {
          latestWhere.marketId = { in: marketIds };
        }
      }

      const latestPrices = await prisma.price.findMany({
        where: latestWhere,
        orderBy: { date: "desc" },
        take: 100,
      });

      if (latestPrices.length === 0) return null;

      const latestAvg = latestPrices.reduce((sum, p) => sum + Number(p.priceAvg), 0) / latestPrices.length;

      const oldPrices = await prisma.price.findMany({
        where: {
          ...latestWhere,
          date: {
            gte: subDays(targetDate, 7),
            lte: targetDate,
          },
        },
        orderBy: { date: "desc" },
        take: 100,
      });

      if (oldPrices.length === 0) return null;

      const oldAvg = oldPrices.reduce((sum, p) => sum + Number(p.priceAvg), 0) / oldPrices.length;

      const change = latestAvg - oldAvg;
      const percentage = (change / oldAvg) * 100;

      return {
        oldPrice: oldAvg,
        newPrice: latestAvg,
        change,
        percentage,
        direction: change > 0 ? "up" : change < 0 ? "down" : "stable",
      };
    };

    const priceChanges = {
      days30: await calculatePriceChange(30),
      months6: await calculatePriceChange(180),
      year1: await calculatePriceChange(365),
    };

    // Comparison data
    let comparisonData: any[] = [];
    if (compareMarkets && !isGuest) {
      const compareMarketIds = compareMarkets.split(",");
      for (const cMarketId of compareMarketIds) {
        const cPrices = await prisma.price.findMany({
          where: {
            productId: product.id,
            marketId: cMarketId,
            date: { gte: startDate },
            ...(productTypeId ? { productTypeId } : {}),
          },
          include: {
            market: {
              include: { marketType: true },
            },
          },
          orderBy: { date: "asc" },
        });

        if (cPrices.length > 0) {
          comparisonData.push({
            marketId: cMarketId,
            marketName: cPrices[0].market.name,
            marketType: cPrices[0].market.marketType.nameAz,
            data: cPrices.map((p) => ({
              date: p.date.toISOString().split("T")[0],
              priceAvg: convertPriceWithUnit(Number(p.priceAvg), fxRate, unitConversionRate),
            })),
          });
        }
      }
    }

    // Date range
    const dateRangeResult = await prisma.price.aggregate({
      where: { productId: product.id },
      _min: { date: true },
      _max: { date: true },
    });

    return NextResponse.json({
      data: chartData,
      comparisonData,
      filters: {
        marketTypes: marketTypesWithAvailability,
        markets: marketsWithAvailability,
        productTypes: productTypesWithAvailability,
      },
      stats: {
        latestPrice: latestPrice
          ? {
              priceMin: convertPriceWithUnit(Number(latestPrice.priceMin), fxRate, unitConversionRate),
              priceAvg: convertPriceWithUnit(Number(latestPrice.priceAvg), fxRate, unitConversionRate),
              priceMax: convertPriceWithUnit(Number(latestPrice.priceMax), fxRate, unitConversionRate),
              date: latestPrice.date,
              currency: targetCurrency,
              currencySymbol,
              market: latestPrice.market.name,
              marketType: latestPrice.market.marketType.nameAz,
            }
          : null,
        priceChange,
        totalRecords: isGuest ? limitedPrices.length : prices.length,
        marketTypeStats: isGuest ? [] : marketTypeStats.filter((s) => s !== null),
        priceChanges: isGuest ? {} : priceChanges,
        dateRange: {
          from: dateRangeResult._min.date,
          to: dateRangeResult._max.date,
        },
        isGuest,
        currency: {
          code: targetCurrency,
          symbol: currencySymbol,
          fxRate,
        },
        unit: {
          code: targetUnit,
          conversionRate: unitConversionRate
        },
        country: {
          code: "AZ",
          iso3: "AZE",
          name: "Azərbaycan",
          flag: "🇦🇿"
        },
        source: "AGRO_AZ"
      },
    });
  } catch (error) {
    console.error("Prices API error:", error);
    return NextResponse.json(
      { error: "Xəta baş verdi" },
      { status: 500 }
    );
  }
}
