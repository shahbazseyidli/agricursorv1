import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

// DeepSeek API client
const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

// Compact multilingual system prompt - STRICT DATA ONLY
const SYSTEM_PROMPT = `Agricultural price analyst. STRICT RULES:
1. ONLY use the [DATA] provided. If no data for a product, say "Bu məhsul üzrə datamız yoxdur".
2. Never invent prices or data.
3. ALWAYS include year with each price (e.g., "1.47 AZN/kg (2025)").
4. ALWAYS mention data source: Agro.gov.az (AZ), EUROSTAT (EU), FAOSTAT (FAO).
5. Specify price type: İstehsalçı qiyməti (Producer), Sahə qiyməti (Farmgate), Pərakəndə (Retail).
6. Use **bold** for key numbers.
7. Reply in user's language. Be brief and factual.`;

// Extract relevant keywords from query
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
  };

  for (const [product, aliases] of Object.entries(productKeywords)) {
    if (aliases.some((alias) => normalizedQuery.includes(alias))) {
      keywords.push(product);
    }
  }

  return keywords;
}

// Fetch product data in parallel - FULL DATA for comprehensive analysis
async function getProductData(product: { id: string; nameAz: string | null; nameEn: string }): Promise<string> {
  // Get latest year data from each source - one record per country
  const [azAggregates, euPrices, faoPrices] = await Promise.all([
    // AZ: Get all market types for latest data
    prisma.globalAzAggregate.findMany({
      where: { globalProductId: product.id },
      orderBy: [{ year: "desc" }, { period: "desc" }],
      take: 10, // Multiple market types
    }),
    // EU: Get latest price per country (distinct countries)
    prisma.euPrice.findMany({
      where: { product: { globalProductId: product.id } },
      orderBy: [{ year: "desc" }, { period: "desc" }],
      take: 50, // Get more to cover all countries
      include: { country: true },
    }),
    // FAO: Get latest price per country
    prisma.faoPrice.findMany({
      where: { product: { globalProductId: product.id } },
      orderBy: { year: "desc" },
      take: 50, // Get more to cover all countries
      include: { country: true },
    }),
  ]);

  const lines: string[] = [];
  const name = product.nameAz || product.nameEn;

  // AZ data - show latest for each market type
  const seenMarketTypes = new Set<string>();
  for (const a of azAggregates) {
    if (seenMarketTypes.has(a.marketTypeCode)) continue;
    seenMarketTypes.add(a.marketTypeCode);
    const marketName = a.marketTypeCode === "FARMGATE" ? "Sahə" : 
                       a.marketTypeCode === "RETAIL" ? "Pərakəndə" :
                       a.marketTypeCode === "WHOLESALE" ? "Topdan" : a.marketTypeCode;
    lines.push(`AZ ${marketName}: ${a.avgPrice.toFixed(2)} AZN/kg (${a.year}) [Agro.gov.az]`);
  }

  // EU data - show one per country (latest)
  const seenEuCountries = new Set<string>();
  for (const e of euPrices) {
    if (seenEuCountries.has(e.country.code)) continue;
    seenEuCountries.add(e.country.code);
    lines.push(`${e.country.nameEn}: ${e.price.toFixed(0)} EUR/100kg (${e.year}) [EUROSTAT]`);
  }

  // FAO data - show one per country (latest)
  const seenFaoCountries = new Set<string>();
  for (const f of faoPrices) {
    if (seenFaoCountries.has(f.country.code)) continue;
    seenFaoCountries.add(f.country.code);
    lines.push(`${f.country.nameEn}: ${f.price.toFixed(0)} USD/ton (${f.year}) [FAOSTAT]`);
  }

  return `${name}:\n${lines.join("\n")}`;
}

// Fast context fetching
async function getDataContext(query: string): Promise<string> {
  const keywords = extractKeywords(query);
  
  if (keywords.length === 0) {
    // Quick general stats
    const [productCount, priceCount] = await Promise.all([
      prisma.globalProduct.count(),
      prisma.price.count(),
    ]);
    return `📊 Platform: ${productCount} products, ${priceCount}+ prices. Ask about a specific product for details.`;
  }

  // Find products
  const products = await prisma.globalProduct.findMany({
    where: {
      OR: [
        { nameAz: { contains: keywords[0] } },
        { nameEn: { contains: keywords[0] } },
        { slug: { contains: keywords[0] } },
      ],
    },
    select: { id: true, nameAz: true, nameEn: true },
    take: 2,
  });

  if (products.length === 0) {
    return `No data found for "${keywords[0]}". Try: alma, pomidor, kartof, üzüm, nar, limon...`;
  }

  const results = await Promise.all(products.map(getProductData));
  return results.join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query?.trim()) {
      return new Response(JSON.stringify({ error: "Query required" }), { status: 400 });
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      return new Response(JSON.stringify({ error: "API key missing" }), { status: 500 });
    }

    // Get context quickly
    const context = await getDataContext(query);

    // Create streaming response using deepseek-chat (FAST!)
    const stream = await client.chat.completions.create({
      model: "deepseek-chat", // FAST model - no reasoning overhead
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `[DATA] ${context}\n\n[QUERY] ${query}` },
      ],
      max_tokens: 2000,
      temperature: 0.3, // Lower temperature = faster, more focused
      stream: true,
    });

    // Return Server-Sent Events stream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("AI Stream error:", error);
    return new Response(
      JSON.stringify({ error: "AI service error" }),
      { status: 500 }
    );
  }
}

