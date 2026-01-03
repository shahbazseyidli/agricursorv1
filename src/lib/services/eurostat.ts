/**
 * Eurostat SDMX API Service
 * 
 * Source: European Statistical Office (Eurostat)
 * URL: https://ec.europa.eu/eurostat/
 * API Base: https://ec.europa.eu/eurostat/api/dissemination/sdmx/2.1/data/
 * 
 * Data: Annual agricultural producer prices
 * Coverage: 29 EU Member States, 100+ products
 * Dataset: APRI_AP_CRPOUTA (Agricultural prices - crop output)
 */

import { prisma } from "@/lib/prisma";

const EUROSTAT_BASE_URL = "https://ec.europa.eu/eurostat/api/dissemination/sdmx/2.1/data";

// Source information for tracking
export const EUROSTAT_SOURCE = {
  code: "EUROSTAT",
  name: "Eurostat - European Statistical Office",
  nameAz: "Eurostat - Avropa Statistika Ofisi",
  url: "https://ec.europa.eu/eurostat/"
};

// Product codes mapping (Eurostat code -> English name)
export const EUROSTAT_PRODUCT_CODES: Record<string, { name: string; category: string }> = {
  // Fruits
  "06110000": { name: "Dessert apples", category: "Fruits" },
  "06120000": { name: "Dessert pears", category: "Fruits" },
  "06130000": { name: "Peaches", category: "Fruits" },
  "06191100": { name: "Sweet cherries", category: "Fruits" },
  "06191200": { name: "Sour cherries", category: "Fruits" },
  "06192000": { name: "Plums", category: "Fruits" },
  "06193000": { name: "Strawberries", category: "Fruits" },
  "06193100": { name: "Strawberries (open)", category: "Fruits" },
  "06193200": { name: "Strawberries (glass)", category: "Fruits" },
  "06194110": { name: "Walnuts", category: "Fruits" },
  "06194120": { name: "Hazelnuts", category: "Fruits" },
  "06194130": { name: "Almonds", category: "Fruits" },
  "06199100": { name: "Apricots", category: "Fruits" },
  "06199200": { name: "Raspberries", category: "Fruits" },
  "06210000": { name: "Oranges", category: "Fruits" },
  "06220000": { name: "Mandarins", category: "Fruits" },
  "06230000": { name: "Lemons", category: "Fruits" },
  "06310000": { name: "Fresh figs", category: "Fruits" },
  "06410000": { name: "Dessert grapes", category: "Fruits" },
  "06490000": { name: "Wine grapes", category: "Fruits" },
  
  // Vegetables
  "04110000": { name: "Cauliflowers", category: "Vegetables" },
  "04121000": { name: "Tomatoes (open)", category: "Vegetables" },
  "04122000": { name: "Tomatoes (glass)", category: "Vegetables" },
  "04191100": { name: "White cabbage", category: "Vegetables" },
  "04191200": { name: "Red cabbage", category: "Vegetables" },
  "04192100": { name: "Lettuce (open)", category: "Vegetables" },
  "04192200": { name: "Lettuce (glass)", category: "Vegetables" },
  "04193000": { name: "Spinach", category: "Vegetables" },
  "04194100": { name: "Cucumbers (open)", category: "Vegetables" },
  "04194200": { name: "Cucumbers (glass)", category: "Vegetables" },
  "04195000": { name: "Carrots", category: "Vegetables" },
  "04196000": { name: "Onions", category: "Vegetables" },
  "04197000": { name: "Green beans", category: "Vegetables" },
  "04199000": { name: "Green peas", category: "Vegetables" },
  "04199901": { name: "Cultivated mushrooms", category: "Vegetables" },
  "04199903": { name: "Leeks", category: "Vegetables" },
  "04199904": { name: "Capsicum (glass)", category: "Vegetables" },
  "04199906": { name: "Garlic", category: "Vegetables" },
  "04199911": { name: "Courgettes", category: "Vegetables" },
  "04199913": { name: "Melons", category: "Vegetables" },
  "04199914": { name: "Water melons", category: "Vegetables" },
  
  // Potatoes
  "05110000": { name: "Early potatoes", category: "Vegetables" },
  "05120000": { name: "Main crop potatoes", category: "Vegetables" },
  
  // Cereals
  "01110000": { name: "Soft wheat", category: "Cereals" },
  "01120000": { name: "Durum wheat", category: "Cereals" },
  "01200000": { name: "Rye", category: "Cereals" },
  "01300000": { name: "Barley", category: "Cereals" },
  "01500000": { name: "Maize", category: "Cereals" },
  "01600000": { name: "Rice", category: "Cereals" }
};

// EU Country codes
export const EU_COUNTRY_CODES: Record<string, string> = {
  "AT": "Austria",
  "BE": "Belgium",
  "BG": "Bulgaria",
  "CY": "Cyprus",
  "CZ": "Czechia",
  "DE": "Germany",
  "DK": "Denmark",
  "EE": "Estonia",
  "EL": "Greece",
  "ES": "Spain",
  "FI": "Finland",
  "FR": "France",
  "HR": "Croatia",
  "HU": "Hungary",
  "IE": "Ireland",
  "IT": "Italy",
  "LT": "Lithuania",
  "LU": "Luxembourg",
  "LV": "Latvia",
  "MT": "Malta",
  "NL": "Netherlands",
  "PL": "Poland",
  "PT": "Portugal",
  "RO": "Romania",
  "SE": "Sweden",
  "SI": "Slovenia",
  "SK": "Slovakia"
};

interface EurostatResponse {
  dimension: {
    time: { category: { label: Record<string, string> } };
    geo: { category: { label: Record<string, string> } };
    prod_veg: { category: { label: Record<string, string> } };
    currency: { category: { label: Record<string, string> } };
  };
  value: Record<string, number>;
  id: string[];
  size: number[];
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
 * Fetch annual prices for a specific product and country
 */
export async function fetchAnnualPrices(
  productCode: string,
  countryCode: string,
  startYear: number,
  endYear?: number
): Promise<{ year: number; price: number }[]> {
  try {
    const url = `${EUROSTAT_BASE_URL}/APRI_AP_CRPOUTA/A.EUR.${productCode}.${countryCode}?format=JSON&sinceTimePeriod=${startYear}`;
    
    const response = await fetch(url, {
      headers: { "Accept": "application/json" }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return []; // No data for this combination
      }
      throw new Error(`Eurostat API error: ${response.status}`);
    }
    
    const data: EurostatResponse = await response.json();
    
    // Parse response
    const years = Object.keys(data.dimension.time.category.label);
    const values = data.value;
    
    const results: { year: number; price: number }[] = [];
    
    years.forEach((year, index) => {
      const price = values[String(index)];
      if (price !== undefined && price !== null) {
        const yearNum = parseInt(year);
        if (!endYear || yearNum <= endYear) {
          results.push({ year: yearNum, price });
        }
      }
    });
    
    return results;
    
  } catch (error) {
    console.error(`Eurostat fetch error for ${productCode}/${countryCode}:`, error);
    return [];
  }
}

/**
 * Fetch all available years for a product/country
 */
export async function fetchAvailableYears(
  productCode: string,
  countryCode: string
): Promise<number[]> {
  const prices = await fetchAnnualPrices(productCode, countryCode, 2000);
  return prices.map(p => p.year);
}

/**
 * Ensure EU country exists in database
 */
async function ensureEuCountry(code: string): Promise<string | null> {
  const name = EU_COUNTRY_CODES[code];
  if (!name) return null;
  
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
 * Ensure EU product exists in database (Eurostat version)
 */
async function ensureEuProduct(eurostatCode: string): Promise<string | null> {
  const productInfo = EUROSTAT_PRODUCT_CODES[eurostatCode];
  if (!productInfo) return null;
  
  // Check if already exists
  let existing = await prisma.euProduct.findFirst({
    where: { eurostatCode }
  });
  
  if (existing) return existing.id;
  
  // Check if EC Agrifood product exists with same name (to link)
  const ecProduct = await prisma.euProduct.findFirst({
    where: {
      ecAgrifoodCode: { contains: productInfo.name.split(" ")[0] }
    }
  });
  
  if (ecProduct) {
    // Update existing EC product with Eurostat code
    await prisma.euProduct.update({
      where: { id: ecProduct.id },
      data: { eurostatCode }
    });
    return ecProduct.id;
  }
  
  // Create new
  const created = await prisma.euProduct.create({
    data: {
      eurostatCode,
      nameEn: productInfo.name,
      unit: "€/100kg",
      category: productInfo.category
    }
  });
  
  return created.id;
}

/**
 * Country name translation to Azerbaijani
 */
function translateCountryToAz(name: string): string {
  const translations: Record<string, string> = {
    "Austria": "Avstriya",
    "Belgium": "Belçika",
    "Bulgaria": "Bolqarıstan",
    "Croatia": "Xorvatiya",
    "Czechia": "Çexiya",
    "Cyprus": "Kipr",
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
 * Sync all Eurostat annual prices
 */
export async function syncAllPrices(
  startYear: number,
  endYear: number,
  options?: {
    productCodes?: string[];
    countryCodes?: string[];
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
      source: EUROSTAT_SOURCE.code,
      syncType: "FULL",
      status: "RUNNING",
      startedAt: new Date()
    }
  });
  
  try {
    const productCodes = options?.productCodes || Object.keys(EUROSTAT_PRODUCT_CODES);
    const countryCodes = options?.countryCodes || Object.keys(EU_COUNTRY_CODES);
    
    console.log(`Eurostat Sync: ${productCodes.length} products × ${countryCodes.length} countries`);
    
    for (const productCode of productCodes) {
      for (const countryCode of countryCodes) {
        try {
          // Ensure country and product exist
          const countryId = await ensureEuCountry(countryCode);
          const productId = await ensureEuProduct(productCode);
          
          if (!countryId || !productId) continue;
          
          // Fetch prices
          const prices = await fetchAnnualPrices(productCode, countryCode, startYear, endYear);
          
          recordsTotal += prices.length;
          
          for (const { year, price } of prices) {
            try {
              // Check existing
              const existing = await prisma.euPrice.findFirst({
                where: {
                  countryId,
                  productId,
                  year,
                  periodType: "Year",
                  source: EUROSTAT_SOURCE.code
                }
              });
              
              const priceData = {
                countryId,
                productId,
                price,
                currency: "EUR",
                unit: "€/100kg",
                source: EUROSTAT_SOURCE.code,
                sourceName: EUROSTAT_SOURCE.name,
                sourceUrl: EUROSTAT_SOURCE.url,
                priceStage: "PRODUCER", // Annual producer prices
                periodType: "Year",
                period: null,
                year,
                startDate: new Date(year, 0, 1),
                endDate: new Date(year, 11, 31),
                variety: EUROSTAT_PRODUCT_CODES[productCode]?.name || productCode,
                market: `National average (${countryCode})`,
                isCalculated: false
              };
              
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
              errors.push(`Record error ${productCode}/${countryCode}/${year}: ${recordError}`);
            }
          }
          
          // Small delay between API calls
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (pairError) {
          errors.push(`Pair error ${productCode}/${countryCode}: ${pairError}`);
        }
      }
      
      console.log(`Eurostat Sync: Completed product ${productCode}`);
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
      source: EUROSTAT_SOURCE.code,
      recordsTotal,
      recordsNew,
      recordsUpdated,
      recordsError,
      errors,
      duration: Date.now() - startTime
    };
    
  } catch (error) {
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
      source: EUROSTAT_SOURCE.code,
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
 * Sync latest year data (for cron job)
 */
export async function syncLatestYear(): Promise<SyncResult> {
  const currentYear = new Date().getFullYear();
  return syncAllPrices(currentYear - 1, currentYear);
}

/**
 * Interpolate annual data to monthly (for chart comparison)
 */
export function interpolateToMonthly(
  annualData: { year: number; price: number }[]
): { date: Date; price: number }[] {
  const result: { date: Date; price: number }[] = [];
  
  // Sort by year
  const sorted = [...annualData].sort((a, b) => a.year - b.year);
  
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    
    // Add 12 monthly points for this year
    for (let month = 0; month < 12; month++) {
      let price = current.price;
      
      // Linear interpolation if next year exists
      if (next) {
        const progress = month / 12;
        price = current.price + (next.price - current.price) * progress;
      }
      
      result.push({
        date: new Date(current.year, month, 15), // Mid-month
        price: Math.round(price * 100) / 100
      });
    }
  }
  
  return result;
}

/**
 * Interpolate annual data to weekly (for chart comparison)
 */
export function interpolateToWeekly(
  annualData: { year: number; price: number }[]
): { date: Date; week: number; price: number }[] {
  const result: { date: Date; week: number; price: number }[] = [];
  
  const sorted = [...annualData].sort((a, b) => a.year - b.year);
  
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    
    // Add 52 weekly points for this year
    for (let week = 1; week <= 52; week++) {
      let price = current.price;
      
      if (next) {
        const progress = week / 52;
        price = current.price + (next.price - current.price) * progress;
      }
      
      // Calculate approximate date for this week
      const date = new Date(current.year, 0, 1);
      date.setDate(date.getDate() + (week - 1) * 7);
      
      result.push({
        date,
        week,
        price: Math.round(price * 100) / 100
      });
    }
  }
  
  return result;
}






