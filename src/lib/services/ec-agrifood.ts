/**
 * EC Agri-food Data Portal API Service
 * 
 * Source: European Commission Agri-food Data Portal
 * URL: https://agridata.ec.europa.eu/
 * API Base: https://ec.europa.eu/agrifood/api/
 * 
 * Data: Weekly fruit & vegetable supply chain prices
 * Coverage: 15 EU Member States, 46+ products
 * Price Stages: Farmgate, Ex-packaging, Retail buying, Retail selling
 */

import { prisma } from "@/lib/prisma";

const EC_AGRIFOOD_BASE_URL = "https://ec.europa.eu/agrifood/api";

// Source information for tracking
export const EC_AGRIFOOD_SOURCE = {
  code: "EC_AGRIFOOD",
  name: "European Commission Agri-food Data Portal",
  nameAz: "Avropa Komissiyası Aqri-ərzaq Data Portalı",
  url: "https://agridata.ec.europa.eu/"
};

// Types
interface EcPriceRecord {
  memberStateCode: string;
  memberStateName: string;
  beginDate: string;
  endDate: string;
  price: string; // "€347.00"
  unit: string;
  periodType: string;
  period: number;
  year: number;
  variety: string;
  productStage: string;
  market: string;
  isCalculated: string;
  isRegulated: string;
}

interface SyncResult {
  success: boolean;
  source: string;
  recordsTotal: number;
  recordsNew: number;
  recordsUpdated: number;
  recordsError: number;
  errors: string[];
  duration: number;
}

/**
 * Fetch list of available products
 */
export async function fetchProducts(): Promise<string[]> {
  try {
    const response = await fetch(
      `${EC_AGRIFOOD_BASE_URL}/fruitAndVegetable/pricesSupplyChain/products`,
      { next: { revalidate: 86400 } } // Cache for 24 hours
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("EC Agrifood - fetchProducts error:", error);
    throw error;
  }
}

/**
 * Fetch list of product stages (supply chain positions)
 */
export async function fetchProductStages(): Promise<string[]> {
  try {
    const response = await fetch(
      `${EC_AGRIFOOD_BASE_URL}/fruitAndVegetable/pricesSupplyChain/productStages`,
      { next: { revalidate: 86400 } }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch product stages: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("EC Agrifood - fetchProductStages error:", error);
    throw error;
  }
}

/**
 * Fetch list of varieties
 */
export async function fetchVarieties(): Promise<string[]> {
  try {
    const response = await fetch(
      `${EC_AGRIFOOD_BASE_URL}/fruitAndVegetable/pricesSupplyChain/varieties`,
      { next: { revalidate: 86400 } }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch varieties: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("EC Agrifood - fetchVarieties error:", error);
    throw error;
  }
}

/**
 * Fetch prices for specific products and years
 */
export async function fetchPrices(params: {
  years: number[];
  products?: string[];
  memberStateCodes?: string[];
  productStages?: string[];
  beginDate?: string;
  endDate?: string;
}): Promise<EcPriceRecord[]> {
  try {
    const searchParams = new URLSearchParams();
    
    if (params.years.length > 0) {
      searchParams.set("years", params.years.join(","));
    }
    if (params.products && params.products.length > 0) {
      searchParams.set("products", params.products.join(","));
    }
    if (params.memberStateCodes && params.memberStateCodes.length > 0) {
      searchParams.set("memberStateCodes", params.memberStateCodes.join(","));
    }
    if (params.productStages && params.productStages.length > 0) {
      searchParams.set("productStages", params.productStages.join(","));
    }
    if (params.beginDate) {
      searchParams.set("beginDate", params.beginDate);
    }
    if (params.endDate) {
      searchParams.set("endDate", params.endDate);
    }
    
    const url = `${EC_AGRIFOOD_BASE_URL}/fruitAndVegetable/pricesSupplyChain?${searchParams.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch prices: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("EC Agrifood - fetchPrices error:", error);
    throw error;
  }
}

/**
 * Parse price string to number (e.g., "€347.00" -> 347.00)
 */
function parsePrice(priceStr: string): number {
  const cleaned = priceStr.replace(/[€$£,\s]/g, "");
  return parseFloat(cleaned) || 0;
}

/**
 * Parse date string (e.g., "30/12/2024" -> Date)
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split("/").map(Number);
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
}

/**
 * Extract product name from variety string
 * e.g., "Tomatoes - Cherry/Special" -> "Tomatoes"
 */
function extractProductFromVariety(variety: string): string {
  const parts = variety.split(" - ");
  return parts[0].trim();
}

/**
 * Ensure EU country exists in database
 */
async function ensureEuCountry(code: string, name: string): Promise<string> {
  const existing = await prisma.euCountry.findUnique({
    where: { code }
  });
  
  if (existing) return existing.id;
  
  const created = await prisma.euCountry.create({
    data: {
      code,
      nameEn: name,
      nameAz: translateCountryToAz(name),
      isActive: true
    }
  });
  
  return created.id;
}

/**
 * Ensure EU product exists in database
 */
async function ensureEuProduct(productName: string, unit: string): Promise<string> {
  // Try to find by EC Agrifood code
  let existing = await prisma.euProduct.findFirst({
    where: { ecAgrifoodCode: productName }
  });
  
  if (existing) return existing.id;
  
  // Create new product
  const created = await prisma.euProduct.create({
    data: {
      ecAgrifoodCode: productName,
      nameEn: productName,
      unit: unit,
      category: categorizeProduct(productName)
    }
  });
  
  return created.id;
}

/**
 * Categorize product into Fruits/Vegetables
 */
function categorizeProduct(productName: string): string {
  const fruits = [
    "Apples", "Apricots", "Avocados", "Bananas", "Cherries", "Clementines",
    "Grapes", "Kiwis", "Lemons", "Mandarins", "Melons", "Nectarines",
    "Oranges", "Peaches", "Pears", "Plums", "Satsumas", "Strawberries",
    "Water Melons"
  ];
  
  const name = productName.toLowerCase();
  for (const fruit of fruits) {
    if (name.includes(fruit.toLowerCase())) {
      return "Fruits";
    }
  }
  
  return "Vegetables";
}

/**
 * Simple country name translation to Azerbaijani
 */
function translateCountryToAz(name: string): string {
  const translations: Record<string, string> = {
    "Austria": "Avstriya",
    "Belgium": "Belçika",
    "Bulgaria": "Bolqarıstan",
    "Croatia": "Xorvatiya",
    "Czechia": "Çexiya",
    "Denmark": "Danimarka",
    "Estonia": "Estoniya",
    "Finland": "Finlandiya",
    "France": "Fransa",
    "Germany": "Almaniya",
    "Greece": "Yunanıstan",
    "Hungary": "Macarıstan",
    "Ireland": "İrlandiya",
    "Italy": "İtaliya",
    "Latvia": "Latviya",
    "Lithuania": "Litva",
    "Luxembourg": "Lüksemburq",
    "Malta": "Malta",
    "Netherlands": "Hollandiya",
    "Poland": "Polşa",
    "Portugal": "Portuqaliya",
    "Romania": "Rumıniya",
    "Slovakia": "Slovakiya",
    "Slovenia": "Sloveniya",
    "Spain": "İspaniya",
    "Sweden": "İsveç"
  };
  
  return translations[name] || name;
}

/**
 * Map EC Agrifood price stage to standardized format
 */
function mapPriceStage(stage: string): string {
  const mappings: Record<string, string> = {
    "Farmgate price": "FARMGATE",
    "Ex-packaging station price": "EX_PACKAGING",
    "Retail buying price": "RETAIL_BUYING",
    "Retail selling price": "RETAIL_SELLING"
  };
  
  return mappings[stage] || stage;
}

/**
 * Sync all prices from EC Agrifood for given years
 */
export async function syncAllPrices(
  startYear: number,
  endYear: number,
  options?: {
    products?: string[];
    memberStateCodes?: string[];
  }
): Promise<SyncResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let recordsTotal = 0;
  let recordsNew = 0;
  let recordsUpdated = 0;
  let recordsError = 0;
  
  // Create sync record
  const syncRecord = await prisma.euDataSync.create({
    data: {
      source: EC_AGRIFOOD_SOURCE.code,
      syncType: "FULL",
      status: "RUNNING",
      startedAt: new Date()
    }
  });
  
  try {
    // Get products list if not provided
    const products = options?.products || await fetchProducts();
    
    // Generate years array
    const years = [];
    for (let y = startYear; y <= endYear; y++) {
      years.push(y);
    }
    
    console.log(`EC Agrifood Sync: Fetching ${products.length} products for years ${startYear}-${endYear}`);
    
    // Fetch in batches of 5 products at a time to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < products.length; i += batchSize) {
      const productBatch = products.slice(i, i + batchSize);
      
      try {
        const prices = await fetchPrices({
          years,
          products: productBatch,
          memberStateCodes: options?.memberStateCodes
        });
        
        recordsTotal += prices.length;
        
        // Process each price record
        for (const record of prices) {
          try {
            const productName = extractProductFromVariety(record.variety);
            
            // Ensure country and product exist
            const countryId = await ensureEuCountry(
              record.memberStateCode,
              record.memberStateName
            );
            const productId = await ensureEuProduct(productName, record.unit);
            
            // Parse dates
            const startDate = parseDate(record.beginDate);
            const endDate = parseDate(record.endDate);
            
            // Upsert price record
            const priceData = {
              countryId,
              productId,
              price: parsePrice(record.price),
              currency: "EUR",
              unit: record.unit,
              source: EC_AGRIFOOD_SOURCE.code,
              sourceName: EC_AGRIFOOD_SOURCE.name,
              sourceUrl: EC_AGRIFOOD_SOURCE.url,
              priceStage: mapPriceStage(record.productStage),
              periodType: record.periodType,
              period: record.period,
              year: record.year,
              startDate,
              endDate,
              variety: record.variety,
              market: record.market,
              isCalculated: record.isCalculated === "Y"
            };
            
            // Create unique key for upsert
            const existing = await prisma.euPrice.findFirst({
              where: {
                countryId,
                productId,
                year: record.year,
                period: record.period,
                periodType: record.periodType,
                priceStage: mapPriceStage(record.productStage),
                variety: record.variety
              }
            });
            
            if (existing) {
              await prisma.euPrice.update({
                where: { id: existing.id },
                data: priceData
              });
              recordsUpdated++;
            } else {
              await prisma.euPrice.create({
                data: priceData
              });
              recordsNew++;
            }
            
          } catch (recordError) {
            recordsError++;
            errors.push(`Record error: ${recordError}`);
          }
        }
        
        console.log(`EC Agrifood Sync: Processed batch ${i / batchSize + 1}/${Math.ceil(products.length / batchSize)}`);
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (batchError) {
        errors.push(`Batch error for products ${productBatch.join(", ")}: ${batchError}`);
      }
    }
    
    // Update sync record - success
    await prisma.euDataSync.update({
      where: { id: syncRecord.id },
      data: {
        status: "COMPLETED",
        recordsTotal,
        recordsNew,
        recordsUpdated,
        recordsError,
        completedAt: new Date()
      }
    });
    
    return {
      success: true,
      source: EC_AGRIFOOD_SOURCE.code,
      recordsTotal,
      recordsNew,
      recordsUpdated,
      recordsError,
      errors,
      duration: Date.now() - startTime
    };
    
  } catch (error) {
    // Update sync record - failed
    await prisma.euDataSync.update({
      where: { id: syncRecord.id },
      data: {
        status: "FAILED",
        recordsTotal,
        recordsNew,
        recordsUpdated,
        recordsError,
        errorMessage: String(error),
        completedAt: new Date()
      }
    });
    
    return {
      success: false,
      source: EC_AGRIFOOD_SOURCE.code,
      recordsTotal,
      recordsNew,
      recordsUpdated,
      recordsError,
      errors: [...errors, String(error)],
      duration: Date.now() - startTime
    };
  }
}

/**
 * Sync latest week data (incremental sync)
 */
export async function syncLatestWeek(): Promise<SyncResult> {
  const currentYear = new Date().getFullYear();
  return syncAllPrices(currentYear, currentYear);
}






