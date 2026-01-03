import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const maxDuration = 30;

// Extract product keywords
function extractKeywords(query: string): string[] {
  const normalizedQuery = query.toLowerCase();
  const keywords: string[] = [];

  const productKeywords: Record<string, string[]> = {
    alma: ["alma", "apple", "elma"],
    pomidor: ["pomidor", "tomato", "tomat"],
    kartof: ["kartof", "potato", "yer alması"],
    üzüm: ["üzüm", "grape", "uzum"],
    nar: ["nar", "pomegranate"],
    portağal: ["portağal", "orange", "portagal"],
    limon: ["limon", "lemon"],
    soğan: ["soğan", "onion", "sogan"],
    xiyar: ["xiyar", "cucumber"],
    bibər: ["bibər", "pepper", "biber"],
    armud: ["armud", "pear"],
    şaftalı: ["şaftalı", "peach", "shaftali"],
    ərik: ["ərik", "apricot", "erik"],
    gilas: ["gilas", "cherry", "albalı"],
    kələm: ["kələm", "cabbage", "kelem"],
    yerkökü: ["yerkökü", "carrot", "yerkoku"],
    badam: ["badam", "almond"],
    fındıq: ["fındıq", "hazelnut", "findiq"],
    qoz: ["qoz", "walnut"],
  };

  for (const [product, aliases] of Object.entries(productKeywords)) {
    if (aliases.some((alias) => normalizedQuery.includes(alias))) {
      keywords.push(product);
    }
  }

  return keywords;
}

interface ChartDataPoint {
  source: string;
  sourceUrl: string; // Link to data source
  priceType: string; // Producer/Farmgate/Wholesale/Retail
  country: string;
  price: number;
  unit: string;
  currency: string;
  year: number;
  period?: number; // Week or month number
  priceInAZN: number; // Converted to AZN for comparison
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query?.trim()) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    const keywords = extractKeywords(query);

    if (keywords.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Məhsul tapılmadı. Alma, pomidor, kartof kimi məhsul adı daxil edin.",
        chartData: [],
      });
    }

    // Find product
    const product = await prisma.globalProduct.findFirst({
      where: {
        OR: [
          { nameAz: { contains: keywords[0] } },
          { nameEn: { contains: keywords[0] } },
          { slug: { contains: keywords[0] } },
        ],
      },
      select: { id: true, nameAz: true, nameEn: true, slug: true },
    });

    if (!product) {
      return NextResponse.json({
        success: false,
        error: `"${keywords[0]}" məhsulu bazada tapılmadı.`,
        chartData: [],
      });
    }

    // Fetch data from all sources in parallel
    const [azAggregates, euPrices, faoPrices] = await Promise.all([
      prisma.globalAzAggregate.findMany({
        where: { globalProductId: product.id },
        orderBy: [{ year: "desc" }, { period: "desc" }],
        take: 4, // Get a few for average
      }),
      prisma.euPrice.findMany({
        where: { product: { globalProductId: product.id } },
        orderBy: [{ year: "desc" }, { period: "desc" }],
        take: 10,
        include: { country: true },
      }),
      prisma.faoPrice.findMany({
        where: { product: { globalProductId: product.id } },
        orderBy: { year: "desc" },
        take: 10,
        include: { country: true },
      }),
    ]);

    // Exchange rates (approximate)
    const EUR_TO_AZN = 1.85;
    const USD_TO_AZN = 1.70;

    const chartData: ChartDataPoint[] = [];

    // Add AZ data
    if (azAggregates.length > 0) {
      const latestAz = azAggregates[0];
      chartData.push({
        source: "Agro.gov.az",
        sourceUrl: "https://agro.gov.az",
        priceType: latestAz.marketTypeCode === "FARMGATE" ? "Sahə qiyməti" : 
                   latestAz.marketTypeCode === "RETAIL" ? "Pərakəndə" :
                   latestAz.marketTypeCode === "WHOLESALE" ? "Topdan" : "İstehsalçı",
        country: "Azərbaycan",
        price: latestAz.avgPrice,
        unit: "kg",
        currency: "AZN",
        year: latestAz.year,
        period: latestAz.period,
        priceInAZN: latestAz.avgPrice, // Already in AZN/kg
      });
    }

    // Add EU data (convert EUR/100kg to AZN/kg)
    const seenEuCountries = new Set<string>();
    for (const eu of euPrices) {
      if (seenEuCountries.has(eu.country.code)) continue;
      seenEuCountries.add(eu.country.code);
      
      // EUR/100kg -> AZN/kg = (price * EUR_TO_AZN) / 100
      const priceInAZN = (eu.price * EUR_TO_AZN) / 100;
      
      chartData.push({
        source: "EUROSTAT",
        sourceUrl: "https://ec.europa.eu/eurostat",
        priceType: "İstehsalçı qiyməti", // Producer price
        country: eu.country.nameAz || eu.country.nameEn,
        price: eu.price,
        unit: "100kg",
        currency: "EUR",
        year: eu.year,
        priceInAZN,
      });
    }

    // Add FAO data (convert USD/ton to AZN/kg)
    const seenFaoCountries = new Set<string>();
    for (const fao of faoPrices) {
      if (seenFaoCountries.has(fao.country.code)) continue;
      seenFaoCountries.add(fao.country.code);
      
      // USD/ton -> AZN/kg = (price * USD_TO_AZN) / 1000
      const priceInAZN = (fao.price * USD_TO_AZN) / 1000;
      
      chartData.push({
        source: "FAOSTAT",
        sourceUrl: "https://www.fao.org/faostat",
        priceType: "İstehsalçı qiyməti", // Producer price
        country: fao.country.nameAz || fao.country.nameEn,
        price: fao.price,
        unit: "ton",
        currency: "USD",
        year: fao.year,
        priceInAZN,
      });
    }

    // Sort by price (AZN) descending
    chartData.sort((a, b) => b.priceInAZN - a.priceInAZN);

    return NextResponse.json({
      success: true,
      product: {
        name: product.nameAz || product.nameEn,
        slug: product.slug,
      },
      chartData: chartData.slice(0, 10), // Top 10 for chart
      exchangeRates: {
        EUR_TO_AZN,
        USD_TO_AZN,
      },
    });
  } catch (error) {
    console.error("Chart API error:", error);
    return NextResponse.json(
      { error: "Xəta baş verdi" },
      { status: 500 }
    );
  }
}

