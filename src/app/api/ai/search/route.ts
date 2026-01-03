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

// Fetch relevant data context based on query
async function getDataContext(
  query: string,
  productSlug?: string
): Promise<string> {
  const keywords = extractKeywords(query);
  let context = "";

  // If specific product is mentioned or provided
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

  // Fetch AZ market data
  if (targetProducts.length > 0) {
    for (const product of targetProducts) {
      // Get latest AZ prices
      const azPrices = await prisma.price.findMany({
        where: {
          product: { globalProductId: product.id },
        },
        orderBy: { date: "desc" },
        take: 10,
        include: {
          market: { include: { marketType: true } },
          product: true,
        },
      });

      if (azPrices.length > 0) {
        context += `\n📊 ${product.nameAz || product.nameEn} - Azərbaycan Bazar Qiymətləri (son 10):\n`;
        for (const price of azPrices) {
          context += `  - ${price.market.name} (${price.market.marketType?.nameAz || "Digər"}): ${price.priceAvg.toFixed(2)} AZN/kg (${price.date.toISOString().split("T")[0]})\n`;
        }
      }

      // Get AZ aggregates
      const azAggregates = await prisma.globalAzAggregate.findMany({
        where: { globalProductId: product.id },
        orderBy: [{ year: "desc" }, { period: "desc" }],
        take: 12,
      });

      if (azAggregates.length > 0) {
        context += `\n📈 ${product.nameAz || product.nameEn} - AZ Orta Qiymətlər:\n`;
        for (const agg of azAggregates) {
          context += `  - ${agg.year}/${agg.period} (${agg.marketTypeCode}): ${agg.avgPrice.toFixed(2)} AZN/kg\n`;
        }
      }

      // Get EU prices
      const euPrices = await prisma.euPrice.findMany({
        where: {
          product: { globalProductId: product.id },
        },
        orderBy: [{ year: "desc" }, { period: "desc" }],
        take: 10,
        include: {
          country: true,
        },
      });

      if (euPrices.length > 0) {
        context += `\n🇪🇺 ${product.nameAz || product.nameEn} - Avropa Qiymətləri:\n`;
        for (const price of euPrices) {
          context += `  - ${price.country.nameAz || price.country.nameEn}: ${price.price.toFixed(2)} EUR/100kg (${price.year}/${price.period || ""})\n`;
        }
      }

      // Get FAO prices
      const faoPrices = await prisma.faoPrice.findMany({
        where: {
          product: { globalProductId: product.id },
        },
        orderBy: { year: "desc" },
        take: 10,
        include: {
          country: true,
        },
      });

      if (faoPrices.length > 0) {
        context += `\n🌍 ${product.nameAz || product.nameEn} - Qlobal İstehsalçı Qiymətləri (FAO):\n`;
        for (const price of faoPrices) {
          context += `  - ${price.country.nameAz || price.country.nameEn}: ${price.price.toFixed(0)} USD/ton (${price.year})\n`;
        }
      }
    }
  }

  // If no specific product, get general stats
  if (!context) {
    const productCount = await prisma.globalProduct.count();
    const marketCount = await prisma.market.count();
    const priceCount = await prisma.price.count();
    const euCountryCount = await prisma.euCountry.count();
    const faoCountryCount = await prisma.faoCountry.count();

    context = `📊 Ümumi Statistika:
- ${productCount} məhsul
- ${marketCount} Azərbaycan bazarı
- ${priceCount}+ qiymət qeydi
- ${euCountryCount} Avropa İttifaqı ölkəsi
- ${faoCountryCount} FAO ölkəsi

Data mənbələri: agro.gov.az, Eurostat, FAOSTAT`;

    // Get some recent price updates
    const recentPrices = await prisma.price.findMany({
      orderBy: { date: "desc" },
      take: 5,
      include: {
        product: { include: { globalProduct: true } },
        market: true,
      },
    });

    if (recentPrices.length > 0) {
      context += `\n\n📰 Son Qiymət Yeniləmələri:\n`;
      for (const price of recentPrices) {
        const name = price.product.globalProduct?.nameAz || price.product.name;
        context += `  - ${name}: ${price.priceAvg.toFixed(2)} AZN/kg (${price.market.name})\n`;
      }
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

