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

// Fetch product data in parallel - MINIMAL for speed
async function getProductData(product: { id: string; nameAz: string | null; nameEn: string }): Promise<string> {
  // Only fetch the most essential data - 2 items each for speed
  const [azAggregates, euPrices, faoPrices] = await Promise.all([
    prisma.globalAzAggregate.findMany({
      where: { globalProductId: product.id },
      orderBy: [{ year: "desc" }, { period: "desc" }],
      take: 2,
    }),
    prisma.euPrice.findMany({
      where: { product: { globalProductId: product.id } },
      orderBy: [{ year: "desc" }, { period: "desc" }],
      take: 2,
      include: { country: true },
    }),
    prisma.faoPrice.findMany({
      where: { product: { globalProductId: product.id } },
      orderBy: { year: "desc" },
      take: 2,
      include: { country: true },
    }),
  ]);

  const lines: string[] = [];
  const name = product.nameAz || product.nameEn;

  if (azAggregates.length > 0) {
    const a = azAggregates[0];
    lines.push(`${name} AZ: ${a.avgPrice.toFixed(2)} AZN/kg (${a.year})`);
  }

  if (euPrices.length > 0) {
    const e = euPrices[0];
    lines.push(`${name} EU ${e.country.nameEn}: ${e.price.toFixed(0)} EUR/100kg (${e.year})`);
  }

  if (faoPrices.length > 0) {
    const f = faoPrices[0];
    lines.push(`${name} FAO ${f.country.nameEn}: ${f.price.toFixed(0)} USD/ton (${f.year})`);
  }

  return lines.join("\n");
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

