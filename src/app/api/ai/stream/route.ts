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

// Currency rates cache
let currencyRates: Record<string, number> = {};
let currencyLastFetch = 0;

// Unit conversion rates cache
let unitRates: Record<string, { baseUnit: string; conversionRate: number }> = {};
let unitLastFetch = 0;

// Fetch currency rates from database
async function getCurrencyRates(): Promise<Record<string, number>> {
  const now = Date.now();
  // Cache for 5 minutes
  if (now - currencyLastFetch < 5 * 60 * 1000 && Object.keys(currencyRates).length > 0) {
    return currencyRates;
  }

  const currencies = await prisma.currency.findMany({
    where: { isActive: true },
    select: { code: true, rateToUSD: true },
  });

  currencyRates = {};
  for (const c of currencies) {
    currencyRates[c.code] = c.rateToUSD;
  }
  currencyLastFetch = now;
  return currencyRates;
}

// Fetch unit conversion rates from database
async function getUnitRates(): Promise<Record<string, { baseUnit: string; conversionRate: number }>> {
  const now = Date.now();
  // Cache for 5 minutes
  if (now - unitLastFetch < 5 * 60 * 1000 && Object.keys(unitRates).length > 0) {
    return unitRates;
  }

  const units = await prisma.unit.findMany({
    where: { isActive: true },
    select: { code: true, baseUnit: true, conversionRate: true },
  });

  unitRates = {};
  for (const u of units) {
    unitRates[u.code.toLowerCase()] = { baseUnit: u.baseUnit, conversionRate: u.conversionRate };
  }
  unitLastFetch = now;
  return unitRates;
}

// Convert price to USD/kg
function convertToUsdPerKg(
  price: number,
  currency: string,
  unit: string,
  currencyRates: Record<string, number>,
  unitRates: Record<string, { baseUnit: string; conversionRate: number }>
): number {
  // Convert currency to USD
  let priceUsd = price;
  const currencyUpper = currency.toUpperCase();
  if (currencyUpper !== "USD" && currencyRates[currencyUpper]) {
    priceUsd = price / currencyRates[currencyUpper];
  }

  // Convert unit to kg
  let pricePerKg = priceUsd;
  const unitLower = unit.toLowerCase().replace(/\s+/g, "");
  
  // Common unit conversions
  if (unitLower.includes("100kg") || unitLower === "100 kg") {
    pricePerKg = priceUsd / 100;
  } else if (unitLower.includes("ton") || unitLower === "tonne" || unitLower === "mt") {
    pricePerKg = priceUsd / 1000;
  } else if (unitLower === "g" || unitLower === "gram") {
    pricePerKg = priceUsd * 1000;
  } else if (unitLower === "lb" || unitLower === "lbs" || unitLower === "pound") {
    pricePerKg = priceUsd * 2.205;
  } else if (unitRates[unitLower]) {
    const unitInfo = unitRates[unitLower];
    if (unitInfo.baseUnit === "kg") {
      pricePerKg = priceUsd * unitInfo.conversionRate;
    }
  }

  return pricePerKg;
}

// Compact multilingual system prompt - STRICT DATA ONLY
const SYSTEM_PROMPT = `Agricultural price analyst. STRICT RULES:
1. ONLY use the [DATA] provided. If no data for a product, say "Bu məhsul üzrə datamız yoxdur".
2. Never invent prices or data.
3. ALL prices are normalized to **USD/kg** for easy comparison.
4. ALWAYS include year with each price (e.g., "**1.47 USD/kg** (2025)").
5. ALWAYS mention data source: Agro.gov.az (AZ), EUROSTAT (EU), FAOSTAT (FAO), FAO FPMA (136 countries).
6. Specify price type: İstehsalçı qiyməti (Producer), Sahə qiyməti (Farmgate), Pərakəndə (Retail), Topdan (Wholesale).
7. Use **bold** for key numbers.
8. Reply in user's language. Be brief and factual.
9. Compare prices across countries when relevant.
10. FAO FPMA data covers 136 countries with retail/wholesale prices - use it for developing countries.`;

// Extended product keywords mapping
const productKeywords: Record<string, string[]> = {
  // Fruits
  alma: ["alma", "apple", "elma"],
  armud: ["armud", "pear", "armut"],
  üzüm: ["üzüm", "grape", "uzum", "grapes"],
  nar: ["nar", "pomegranate"],
  portağal: ["portağal", "orange", "portagal", "oranges"],
  limon: ["limon", "lemon", "lemons"],
  banan: ["banan", "banana", "bananas"],
  çiyələk: ["çiyələk", "strawberry", "strawberries"],
  şaftalı: ["şaftalı", "peach", "peaches"],
  ərik: ["ərik", "apricot", "apricots"],
  gilas: ["gilas", "cherry", "cherries"],
  
  // Vegetables
  pomidor: ["pomidor", "tomato", "tomat", "tomatoes"],
  kartof: ["kartof", "potato", "potatoes", "yer alması"],
  soğan: ["soğan", "onion", "sogan", "onions"],
  xiyar: ["xiyar", "cucumber", "cucumbers"],
  bibər: ["bibər", "pepper", "biber", "peppers"],
  kələm: ["kələm", "cabbage"],
  badımcan: ["badımcan", "eggplant", "aubergine"],
  sarımsaq: ["sarımsaq", "garlic"],
  yerkökü: ["yerkökü", "carrot", "carrots"],
  
  // Nuts
  fındıq: ["fındıq", "findiq", "hazelnut", "hazelnuts"],
  badam: ["badam", "almond", "almonds"],
  qoz: ["qoz", "walnut", "walnuts"],
  
  // Grains & Cereals
  buğda: ["buğda", "bugda", "wheat"],
  arpa: ["arpa", "barley"],
  düyü: ["düyü", "rice", "duyu"],
  qarğıdalı: ["qarğıdalı", "corn", "maize"],
  
  // Meat
  "mal əti": ["mal əti", "mal eti", "beef", "sığır"],
  "qoyun əti": ["qoyun əti", "qoyun eti", "lamb", "mutton"],
  toyuq: ["toyuq", "chicken", "poultry"],
  
  // Dairy
  süd: ["süd", "milk", "sud"],
  pendir: ["pendir", "cheese"],
  yağ: ["yağ", "butter", "oil"],
  
  // Other
  yumurta: ["yumurta", "egg", "eggs"],
  bal: ["bal", "honey"],
  zeytun: ["zeytun", "olive", "olives"],
  çay: ["çay", "tea"],
};

// Extract relevant keywords from query
function extractKeywords(query: string): string[] {
  const normalizedQuery = query.toLowerCase();
  const keywords: string[] = [];

  for (const [product, aliases] of Object.entries(productKeywords)) {
    if (aliases.some((alias) => normalizedQuery.includes(alias))) {
      keywords.push(product);
    }
  }

  return keywords;
}

// Fetch product data in parallel with currency/unit conversion
async function getProductData(
  product: { id: string; nameAz: string | null; nameEn: string },
  currencyRates: Record<string, number>,
  unitRates: Record<string, { baseUnit: string; conversionRate: number }>
): Promise<string> {
  // Get latest year data from each source - one record per country
  const [azAggregates, euPrices, faoPrices, fpmaPrices] = await Promise.all([
    // AZ: Get all market types for latest data
    prisma.globalAzAggregate.findMany({
      where: { globalProductId: product.id },
      orderBy: [{ year: "desc" }, { period: "desc" }],
      take: 10,
    }),
    // EU: Get latest price per country (distinct countries)
    prisma.euPrice.findMany({
      where: { product: { globalProductId: product.id } },
      orderBy: [{ year: "desc" }, { period: "desc" }],
      take: 50,
      include: { country: true },
    }),
    // FAO: Get latest price per country
    prisma.faoPrice.findMany({
      where: { product: { globalProductId: product.id } },
      orderBy: { year: "desc" },
      take: 50,
      include: { country: true },
    }),
    // FPMA: Get latest retail/wholesale prices from 136 countries
    prisma.fpmaPrice.findMany({
      where: { 
        serie: { 
          commodity: { globalProductId: product.id } 
        } 
      },
      orderBy: { date: "desc" },
      take: 100,
      include: { 
        serie: { 
          include: { 
            country: true,
            commodity: true,
          } 
        } 
      },
    }),
  ]);

  const lines: string[] = [];
  const name = product.nameAz || product.nameEn;

  // AZ data - show latest for each market type, convert to USD/kg
  const seenMarketTypes = new Set<string>();
  for (const a of azAggregates) {
    if (seenMarketTypes.has(a.marketTypeCode)) continue;
    seenMarketTypes.add(a.marketTypeCode);
    const marketName = a.marketTypeCode === "FARMGATE" ? "Sahə" : 
                       a.marketTypeCode === "RETAIL" ? "Pərakəndə" :
                       a.marketTypeCode === "WHOLESALE" ? "Topdan" : a.marketTypeCode;
    const priceUsdKg = convertToUsdPerKg(a.avgPrice, a.currency, a.unit, currencyRates, unitRates);
    lines.push(`AZ ${marketName}: ${priceUsdKg.toFixed(2)} USD/kg (${a.year}) [Agro.gov.az]`);
  }

  // EU data - show one per country (latest), convert EUR/100kg to USD/kg
  const seenEuCountries = new Set<string>();
  for (const e of euPrices) {
    if (seenEuCountries.has(e.country.code)) continue;
    seenEuCountries.add(e.country.code);
    const priceUsdKg = convertToUsdPerKg(e.price, e.currency, e.unit, currencyRates, unitRates);
    lines.push(`${e.country.nameEn}: ${priceUsdKg.toFixed(2)} USD/kg (${e.year}) [EUROSTAT]`);
  }

  // FAO data - show one per country (latest), convert USD/ton to USD/kg
  const seenFaoCountries = new Set<string>();
  for (const f of faoPrices) {
    if (seenFaoCountries.has(f.country.code)) continue;
    seenFaoCountries.add(f.country.code);
    const priceUsdKg = convertToUsdPerKg(f.price, f.currency, f.unit, currencyRates, unitRates);
    lines.push(`${f.country.nameEn}: ${priceUsdKg.toFixed(2)} USD/kg (${f.year}) [FAOSTAT]`);
  }

  // FPMA data - show one per country (latest, retail/wholesale), convert to USD/kg
  const seenFpmaCountries = new Set<string>();
  for (const fp of fpmaPrices) {
    const countryKey = `${fp.serie.country.iso3}-${fp.serie.priceType}`;
    if (seenFpmaCountries.has(countryKey)) continue;
    seenFpmaCountries.add(countryKey);
    const priceType = fp.serie.priceType === "RETAIL" ? "Pərakəndə" : "Topdan";
    const year = fp.date.getFullYear();
    // Use priceUsd if available, otherwise convert
    let priceUsdKg: number;
    if (fp.priceUsd) {
      // priceUsd is already in USD, but might not be per kg
      priceUsdKg = convertToUsdPerKg(fp.priceUsd, "USD", fp.serie.measureUnitNormalized || "kg", currencyRates, unitRates);
    } else {
      const price = fp.priceNormalized || fp.price;
      priceUsdKg = convertToUsdPerKg(price, fp.serie.currency, fp.serie.measureUnitNormalized || "kg", currencyRates, unitRates);
    }
    lines.push(`${fp.serie.country.nameEn} (${priceType}): ${priceUsdKg.toFixed(2)} USD/kg (${year}) [FAO FPMA]`);
  }

  if (lines.length === 0) {
    return `${name}: Qiymət məlumatı yoxdur`;
  }

  return `${name}:\n${lines.join("\n")}`;
}

// Fast context fetching with conversion
async function getDataContext(query: string): Promise<string> {
  const keywords = extractKeywords(query);
  
  // Fetch currency and unit rates
  const [currRates, uRates] = await Promise.all([
    getCurrencyRates(),
    getUnitRates(),
  ]);
  
  if (keywords.length === 0) {
    // Try direct search in database
    const normalizedQuery = query.toLowerCase().replace(/[^\w\s]/g, "");
    const products = await prisma.globalProduct.findMany({
      where: {
        OR: [
          { nameAz: { contains: normalizedQuery } },
          { nameEn: { contains: normalizedQuery } },
          { slug: { contains: normalizedQuery } },
        ],
      },
      select: { id: true, nameAz: true, nameEn: true },
      take: 2,
    });

    if (products.length > 0) {
      const results = await Promise.all(products.map(p => getProductData(p, currRates, uRates)));
      return results.join("\n\n");
    }

    // Quick general stats
    const [productCount, priceCount] = await Promise.all([
      prisma.globalProduct.count(),
      prisma.price.count(),
    ]);
    return `📊 Platform: ${productCount} products, ${priceCount}+ prices. Ask about a specific product for details. Available: alma, pomidor, kartof, üzüm, nar, limon, fındıq, badam, buğda, düyü, mal əti, toyuq...`;
  }

  // Find products by keyword
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
    // Try English name from keywords
    const englishName = Object.entries(productKeywords).find(([, aliases]) => 
      aliases.includes(keywords[0])
    )?.[1]?.find(a => /^[a-z]+$/i.test(a));
    
    if (englishName) {
      const fallbackProducts = await prisma.globalProduct.findMany({
        where: {
          OR: [
            { nameEn: { contains: englishName } },
            { slug: { contains: englishName } },
          ],
        },
        select: { id: true, nameAz: true, nameEn: true },
        take: 2,
      });
      
      if (fallbackProducts.length > 0) {
        const results = await Promise.all(fallbackProducts.map(p => getProductData(p, currRates, uRates)));
        return results.join("\n\n");
      }
    }
    
    return `"${keywords[0]}" üzrə data tapılmadı. Mövcud məhsullar: alma, pomidor, kartof, üzüm, nar, limon, fındıq, badam, buğda, düyü...`;
  }

  const results = await Promise.all(products.map(p => getProductData(p, currRates, uRates)));
  return results.join("\n\n");
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

    // Get context with normalized prices (USD/kg)
    const context = await getDataContext(query);

    // Create streaming response using deepseek-chat (FAST!)
    const stream = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `[DATA] ${context}\n\n[QUERY] ${query}` },
      ],
      max_tokens: 2000,
      temperature: 0.3,
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
