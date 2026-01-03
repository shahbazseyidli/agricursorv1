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
    const targetCurrency = searchParams.get("currency") || "AZN";
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

    // ============================================
    // FAO FPMA DATA
    // ============================================
    if (dataSource === "FAO_FPMA" || (dataSource === "auto" && countryCode !== "AZ")) {
      // Try FPMA data first for non-AZ countries
      const globalProduct = await prisma.globalProduct.findUnique({
        where: { slug },
        include: {
          fpmaCommodities: {
            include: {
              series: {
                where: {
                  country: {
                    OR: [
                      { iso2: countryCode },
                      { iso3: countryCode },
                    ]
                  }
                },
                include: {
                  country: true,
                  market: true,
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

          // Get unique markets
          const uniqueMarkets = [...new Set(allSeries
            .map(s => JSON.stringify({
              id: s.market.id,
              name: s.market.name,
              hasData: true
            }))
          )].map(s => JSON.parse(s));

          // Format for chart
          const chartData = allPrices.map(p => ({
            date: p.date.toISOString().split("T")[0],
            priceMin: p.priceNormalized || p.price,
            priceAvg: p.priceNormalized || p.price,
            priceMax: p.priceNormalized || p.price,
            market: p.market.name,
            marketId: p.market.id,
            marketType: p.priceType,
            priceStage: p.globalPriceStage?.code,
            priceUsd: p.priceUsd,
            originalCurrency: p.currency,
          })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          // Latest price
          const latestPriceData = allPrices[allPrices.length - 1];
          const latestPrice = latestPriceData ? {
            priceMin: latestPriceData.priceNormalized || latestPriceData.price,
            priceAvg: latestPriceData.priceNormalized || latestPriceData.price,
            priceMax: latestPriceData.priceNormalized || latestPriceData.price,
            date: latestPriceData.date,
            currency: latestPriceData.currency,
            currencySymbol: latestPriceData.currency,
            market: latestPriceData.market.name,
            marketType: latestPriceData.priceType,
          } : null;

          // Price change
          let priceChange = null;
          if (allPrices.length >= 2) {
            const latest = allPrices[allPrices.length - 1];
            const prev = allPrices[Math.max(0, allPrices.length - 30)];
            const change = (latest.priceNormalized || latest.price) - (prev.priceNormalized || prev.price);
            const percentage = (change / (prev.priceNormalized || prev.price)) * 100;
            priceChange = {
              value: change,
              percentage,
              direction: change > 0 ? "up" : change < 0 ? "down" : "stable",
            };
          }

          // Country info
          const fpmaCountry = allSeries[0]?.country;

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
                code: countryCode,
                name: fpmaCountry?.nameEn || countryCode
              },
              source: "FAO_FPMA"
            },
          });
        }
      }
      
      // If FPMA data not found and dataSource was explicitly FAO_FPMA, return empty
      if (dataSource === "FAO_FPMA") {
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
            country: { code: countryCode, name: countryCode },
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

    // Build where clause
    const where: any = {
      productId: product.id,
      date: { 
        gte: startDate,
        ...(range === "custom" ? { lte: endDate } : {})
      },
    };

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
          name: "Azərbaycan"
        },
        source: "AZ_DATA"
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
