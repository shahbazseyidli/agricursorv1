import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chat } from "@/lib/services/deepseek";

export const maxDuration = 60; // Allow up to 60 seconds for AI response

interface SearchRequest {
  query: string;
  productSlug?: string; // Optional: if searching about a specific product
}

// Extract relevant keywords from query
function extractKeywords(query: string): string[] {
  const normalizedQuery = query.toLowerCase();
  const keywords: string[] = [];

  // Common product names (AZ and EN)
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
    badam: ["badam", "almond"],
    fındıq: ["fındıq", "hazelnut", "findiq"],
    qoz: ["qoz", "walnut"],
    çiyələk: ["çiyələk", "strawberry", "ciyelek"],
    armud: ["armud", "pear"],
    şaftalı: ["şaftalı", "peach", "shaftali"],
    ərik: ["ərik", "apricot", "erik"],
    gilas: ["gilas", "cherry", "albalı"],
    kələm: ["kələm", "cabbage", "kelem"],
    yerkökü: ["yerkökü", "carrot", "yerkoku"],
  };

  // Check for product mentions
  for (const [product, aliases] of Object.entries(productKeywords)) {
    if (aliases.some((alias) => normalizedQuery.includes(alias))) {
      keywords.push(product);
    }
  }

  // Check for country mentions
  const countryKeywords = [
    "azərbaycan",
    "türkiyə",
    "gürcüstan",
    "rusiya",
    "iran",
    "almaniya",
    "fransa",
    "italiya",
    "ispaniya",
    "bolqarıstan",
    "yunanıstan",
    "polşa",
  ];
  for (const country of countryKeywords) {
    if (normalizedQuery.includes(country)) {
      keywords.push(country);
    }
  }

  return keywords;
}

// Fetch data for a single product - PARALLEL queries
async function getProductData(product: { id: string; slug: string; nameAz: string | null; nameEn: string }): Promise<string> {
  // Run all queries in parallel for speed
  const [azPrices, azAggregates, euPrices, faoPrices] = await Promise.all([
    // AZ market prices
    prisma.price.findMany({
      where: { product: { globalProductId: product.id } },
      orderBy: { date: "desc" },
      take: 10,
      include: {
        market: { include: { marketType: true } },
        product: true,
      },
    }),
    // AZ aggregates
    prisma.globalAzAggregate.findMany({
      where: { globalProductId: product.id },
      orderBy: [{ year: "desc" }, { period: "desc" }],
      take: 12,
    }),
    // EU prices
    prisma.euPrice.findMany({
      where: { product: { globalProductId: product.id } },
      orderBy: [{ year: "desc" }, { period: "desc" }],
      take: 10,
      include: { country: true },
    }),
    // FAO prices
    prisma.faoPrice.findMany({
      where: { product: { globalProductId: product.id } },
      orderBy: { year: "desc" },
      take: 10,
      include: { country: true },
    }),
  ]);

  let context = "";
  const productName = product.nameAz || product.nameEn;

  if (azPrices.length > 0) {
    context += `\n📊 ${productName} - Azerbaijan Market Prices (latest 10):\n`;
    for (const price of azPrices) {
      context += `  - ${price.market.name} (${price.market.marketType?.nameAz || "Other"}): ${price.priceAvg.toFixed(2)} AZN/kg (${price.date.toISOString().split("T")[0]})\n`;
    }
  }

  if (azAggregates.length > 0) {
    context += `\n📈 ${productName} - AZ Average Prices:\n`;
    for (const agg of azAggregates) {
      context += `  - ${agg.year}/${agg.period} (${agg.marketTypeCode}): ${agg.avgPrice.toFixed(2)} AZN/kg\n`;
    }
  }

  if (euPrices.length > 0) {
    context += `\n🇪🇺 ${productName} - European Prices:\n`;
    for (const price of euPrices) {
      context += `  - ${price.country.nameEn}: ${price.price.toFixed(2)} EUR/100kg (${price.year}/${price.period || ""})\n`;
    }
  }

  if (faoPrices.length > 0) {
    context += `\n🌍 ${productName} - Global Producer Prices (FAO):\n`;
    for (const price of faoPrices) {
      context += `  - ${price.country.nameEn}: ${price.price.toFixed(0)} USD/ton (${price.year})\n`;
    }
  }

  return context;
}

// Fetch relevant data context based on query - OPTIMIZED with parallel queries
async function getDataContext(
  query: string,
  productSlug?: string
): Promise<string> {
  const keywords = extractKeywords(query);

  // Find target products
  let targetProducts: { id: string; slug: string; nameAz: string | null; nameEn: string }[] = [];

  if (productSlug) {
    const product = await prisma.globalProduct.findUnique({
      where: { slug: productSlug },
      select: { id: true, slug: true, nameAz: true, nameEn: true },
    });
    if (product) targetProducts = [product];
  } else if (keywords.length > 0) {
    // Search for products matching keywords
    targetProducts = await prisma.globalProduct.findMany({
      where: {
        OR: [
          { nameAz: { contains: keywords[0] } },
          { nameEn: { contains: keywords[0] } },
          { slug: { contains: keywords[0] } },
        ],
      },
      select: { id: true, slug: true, nameAz: true, nameEn: true },
      take: 3,
    });
  }

  // Fetch data for all products in PARALLEL
  if (targetProducts.length > 0) {
    const productDataPromises = targetProducts.map(getProductData);
    const productDataResults = await Promise.all(productDataPromises);
    return productDataResults.join("");
  }

  // If no specific product, get general stats - all in PARALLEL
  const [productCount, marketCount, priceCount, euCountryCount, faoCountryCount, recentPrices] = await Promise.all([
    prisma.globalProduct.count(),
    prisma.market.count(),
    prisma.price.count(),
    prisma.euCountry.count(),
    prisma.faoCountry.count(),
    prisma.price.findMany({
      orderBy: { date: "desc" },
      take: 5,
      include: {
        product: { include: { globalProduct: true } },
        market: true,
      },
    }),
  ]);

  let context = `📊 General Statistics:
- ${productCount} products
- ${marketCount} Azerbaijan markets
- ${priceCount}+ price records
- ${euCountryCount} European Union countries
- ${faoCountryCount} FAO countries

Data sources: agro.gov.az, Eurostat, FAOSTAT`;

  if (recentPrices.length > 0) {
    context += `\n\n📰 Latest Price Updates:\n`;
    for (const price of recentPrices) {
      const name = price.product.globalProduct?.nameAz || price.product.name;
      context += `  - ${name}: ${price.priceAvg.toFixed(2)} AZN/kg (${price.market.name})\n`;
    }
  }

  return context;
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json();
    const { query, productSlug } = body;

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Sorğu boş ola bilməz" },
        { status: 400 }
      );
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: "DeepSeek API key konfiqurasiya olunmayıb" },
        { status: 500 }
      );
    }

    // Get relevant data context
    const context = await getDataContext(query, productSlug);

    // Call DeepSeek R1 API
    const response = await chat(query, context);

    return NextResponse.json({
      success: true,
      answer: response.content,
      reasoning: response.reasoning,
      usage: response.usage,
      context: context.substring(0, 500) + (context.length > 500 ? "..." : ""), // Truncate for response
    });
  } catch (error) {
    console.error("AI Search error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { 
        error: "AI xidmətində xəta baş verdi",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

