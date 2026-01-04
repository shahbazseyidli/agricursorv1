import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Comparison API - Compare AZ market type average with EU country prices
 * 
 * Query params:
 * - productSlug: global product slug
 * - marketType: RETAIL, WHOLESALE, PRODUCER, FIELD
 * - euCountry: EU country code (BE, DE, FR, etc.)
 * - currency: target currency (default AZN)
 * - range: all, 1y, 3y, 5y
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productSlug = searchParams.get("productSlug");
    const marketTypeCode = searchParams.get("marketType") || "RETAIL";
    const euCountryCode = searchParams.get("euCountry");
    const targetCurrency = searchParams.get("currency") || "AZN";
    const range = searchParams.get("range") || "all";
    
    if (!productSlug) {
      return NextResponse.json(
        { error: "productSlug is required" },
        { status: 400 }
      );
    }
    
    // Get currency conversion rate (USD-based)
    let fxRate = 1;
    let currencySymbol = "$";
    if (targetCurrency !== "USD") {
      const currency = await prisma.currency.findUnique({
        where: { code: targetCurrency },
      });
      if (currency) {
        fxRate = currency.rateToUSD;
        currencySymbol = currency.symbol;
      }
    }
    
    // Find global product
    const globalProduct = await prisma.globalProduct.findUnique({
      where: { slug: productSlug },
      include: {
        localProducts: {
          include: {
            aggregates: {
              where: {
                periodType: "Month",
                marketType: {
                  code: marketTypeCode
                }
              },
              include: {
                marketType: true
              },
              orderBy: [{ year: "desc" }, { period: "desc" }],
              take: 36 // Last 3 years
            }
          }
        },
        euProducts: {
          include: {
            prices: {
              where: {
                // Don't filter by priceStage - use whatever is available
                ...(euCountryCode ? { country: { code: euCountryCode } } : {})
              },
              include: {
                country: true
              },
              orderBy: [{ year: "desc" }, { period: "desc" }],
              take: 100
            }
          }
        }
      }
    });
    
    if (!globalProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    
    // Get AZ aggregate data
    const azProduct = globalProduct.localProducts[0];
    const azAggregates = azProduct?.aggregates || [];
    
    // Format AZ data for chart
    const azChartData = azAggregates.map(agg => ({
      date: new Date(agg.year, agg.period - 1, 15).toISOString().split("T")[0],
      year: agg.year,
      month: agg.period,
      avgPrice: agg.avgPrice * fxRate,
      minPrice: agg.minPrice * fxRate,
      maxPrice: agg.maxPrice * fxRate,
      priceCount: agg.priceCount,
      marketType: agg.marketType?.nameAz || marketTypeCode,
      source: "AZ"
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Get latest AZ price
    const latestAzPrice = azAggregates[0] ? {
      avgPrice: azAggregates[0].avgPrice * fxRate,
      minPrice: azAggregates[0].minPrice * fxRate,
      maxPrice: azAggregates[0].maxPrice * fxRate,
      date: new Date(azAggregates[0].year, azAggregates[0].period - 1, 15),
      marketType: azAggregates[0].marketType?.nameAz || marketTypeCode,
      priceCount: azAggregates[0].priceCount
    } : null;
    
    // Get EU data (if country specified)
    let euChartData: any[] = [];
    let latestEuPrice = null;
    let euCountry = null;
    
    if (euCountryCode) {
      euCountry = await prisma.euCountry.findUnique({
        where: { code: euCountryCode }
      });
      
      const euPrices = globalProduct.euProducts.flatMap(ep => 
        ep.prices.filter(p => p.country.code === euCountryCode)
      );
      
      // Convert EU prices (€/100kg to €/kg, then to target currency)
      euChartData = euPrices.map(p => {
        const pricePerKg = p.price / 100;
        const convertedPrice = targetCurrency === "EUR" 
          ? pricePerKg 
          : pricePerKg * fxRate;
        
        return {
          date: p.startDate?.toISOString().split("T")[0] || `${p.year}-${String(p.period || 6).padStart(2, '0')}-15`,
          year: p.year,
          period: p.period,
          avgPrice: convertedPrice,
          minPrice: convertedPrice * 0.95,
          maxPrice: convertedPrice * 1.05,
          priceStage: p.priceStage,
          source: p.source,
          sourceLabel: "EU"
        };
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      if (euPrices.length > 0) {
        const latest = euPrices[0];
        const pricePerKg = latest.price / 100;
        const convertedPrice = targetCurrency === "EUR" ? pricePerKg : pricePerKg * fxRate;
        
        latestEuPrice = {
          avgPrice: convertedPrice,
          date: latest.startDate || new Date(latest.year, 11, 31),
          priceStage: latest.priceStage,
          source: latest.source,
          country: euCountry?.nameAz || euCountryCode
        };
      }
    }
    
    // Calculate price difference
    let priceDifference = null;
    if (latestAzPrice && latestEuPrice) {
      const diff = latestAzPrice.avgPrice - latestEuPrice.avgPrice;
      const percentage = (diff / latestEuPrice.avgPrice) * 100;
      priceDifference = {
        absolute: diff,
        percentage,
        azHigher: diff > 0
      };
    }
    
    // Get available EU countries with data for this product
    const availableEuCountries = await getAvailableEuCountries(globalProduct.id, marketTypeCode);
    
    return NextResponse.json({
      product: {
        slug: globalProduct.slug,
        nameAz: globalProduct.nameAz,
        nameEn: globalProduct.nameEn
      },
      marketType: {
        code: marketTypeCode,
        name: getMarketTypeName(marketTypeCode),
        euEquivalent: mapMarketTypeToEuPriceStage(marketTypeCode)
      },
      currency: {
        code: targetCurrency,
        symbol: currencySymbol,
        fxRate
      },
      az: {
        chartData: azChartData,
        latestPrice: latestAzPrice,
        dataCount: azChartData.length
      },
      eu: {
        country: euCountry ? {
          code: euCountry.code,
          name: euCountry.nameAz || euCountry.nameEn
        } : null,
        chartData: euChartData,
        latestPrice: latestEuPrice,
        dataCount: euChartData.length
      },
      comparison: {
        priceDifference,
        availableEuCountries
      }
    });
    
  } catch (error) {
    console.error("Comparison API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Map AZ market type to EU price stage
function mapMarketTypeToEuPriceStage(marketType: string): string {
  const mapping: Record<string, string> = {
    "RETAIL": "RETAIL",
    "WHOLESALE": "WHOLESALE", 
    "PROCESSING": "PRODUCER",
    "FIELD": "PRODUCER", // Farmgate = Producer
  };
  return mapping[marketType] || "PRODUCER";
}

function getMarketTypeName(code: string): string {
  const names: Record<string, string> = {
    "RETAIL": "Pərakəndə satış",
    "WHOLESALE": "Topdansatış",
    "PROCESSING": "Müəssisə tərəfindən alış",
    "FIELD": "Sahədən satış (Farmgate)"
  };
  return names[code] || code;
}

async function getAvailableEuCountries(globalProductId: string, marketType: string) {
  const euPriceStage = mapMarketTypeToEuPriceStage(marketType);
  
  // Get EU countries with data
  const euCountries = await prisma.euPrice.findMany({
    where: {
      product: {
        globalProductId
      },
      priceStage: euPriceStage
    },
    select: {
      country: {
        select: {
          code: true,
          nameAz: true,
          nameEn: true
        }
      }
    },
    distinct: ["countryId"]
  });
  
  const countries = euCountries.map(c => ({
    code: c.country.code,
    name: c.country.nameAz || c.country.nameEn,
    flag: getFlagEmoji(c.country.code),
    type: "eu" as const
  }));
  
  // Add Azerbaijan if it has data
  const azHasData = await prisma.azPriceAggregate.count({
    where: {
      product: {
        globalProduct: {
          id: globalProductId
        }
      },
      marketType: {
        code: marketType
      }
    }
  });
  
  if (azHasData > 0) {
    countries.unshift({
      code: "AZ",
      name: "Azərbaycan",
      flag: "🇦🇿",
      type: "az" as const
    });
  }
  
  return countries;
}

function getFlagEmoji(countryCode: string) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

