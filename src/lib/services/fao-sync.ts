/**
 * FAO FAOSTAT Data Sync Service
 * 
 * Syncs producer prices from FAOSTAT bulk data.
 * Similar to eurostat.ts structure for consistency.
 */

import { prisma } from "@/lib/prisma";
import * as fs from "fs";
import * as path from "path";

// FAO Item Code to GlobalProduct slug mapping
const FAO_PRODUCT_MAPPING: Record<string, string> = {
  "221": "almond",
  "515": "apple",
  "526": "apricot",
  "367": "asparagus",
  "572": "avocado",
  "486": "banana",
  "552": "blueberry",
  "420": "green-beans",
  "358": "cabbage",
  "568": "melon",
  "426": "carrot",
  "393": "cauliflower",
  "531": "cherry",
  "220": "chestnut",
  "401": "pepper",
  "397": "cucumber",
  "550": "blackcurrant",
  "399": "eggplant",
  "569": "fig",
  "560": "grape",
  "406": "garlic",
  "225": "hazelnut",
  "592": "kiwi",
  "497": "lemon",
  "449": "mushroom",
  "403": "onion",
  "490": "orange",
  "534": "peach",
  "521": "pear",
  "536": "plum",
  "116": "potato",
  "394": "pumpkin",
  "523": "quince",
  "547": "raspberry",
  "530": "sour-cherry",
  "544": "strawberry",
  "495": "mandarin",
  "388": "tomato",
  "222": "walnut",
  "567": "watermelon",
  "366": "artichoke",
  "577": "date",
  "571": "mango",
  "587": "persimmon",
  "260": "olive",
};

// Country translations and ISO codes
const COUNTRY_INFO: Record<string, { nameAz: string; iso2: string }> = {
  "11": { nameAz: "Avstriya", iso2: "AT" },
  "52": { nameAz: "Azərbaycan", iso2: "AZ" },
  "255": { nameAz: "Belçika", iso2: "BE" },
  "27": { nameAz: "Bolqarıstan", iso2: "BG" },
  "80": { nameAz: "Bosniya və Herseqovina", iso2: "BA" },
  "167": { nameAz: "Çexiya", iso2: "CZ" },
  "67": { nameAz: "Finlandiya", iso2: "FI" },
  "68": { nameAz: "Fransa", iso2: "FR" },
  "73": { nameAz: "Gürcüstan", iso2: "GE" },
  "79": { nameAz: "Almaniya", iso2: "DE" },
  "84": { nameAz: "Yunanıstan", iso2: "GR" },
  "99": { nameAz: "Macarıstan", iso2: "HU" },
  "100": { nameAz: "Hindistan", iso2: "IN" },
  "102": { nameAz: "İran", iso2: "IR" },
  "106": { nameAz: "İtaliya", iso2: "IT" },
  "150": { nameAz: "Niderland", iso2: "NL" },
  "162": { nameAz: "Norveç", iso2: "NO" },
  "173": { nameAz: "Polşa", iso2: "PL" },
  "174": { nameAz: "Portuqaliya", iso2: "PT" },
  "183": { nameAz: "Rumıniya", iso2: "RO" },
  "185": { nameAz: "Rusiya", iso2: "RU" },
  "203": { nameAz: "İspaniya", iso2: "ES" },
  "223": { nameAz: "Türkiyə", iso2: "TR" },
  "230": { nameAz: "Ukrayna", iso2: "UA" },
  "229": { nameAz: "Böyük Britaniya", iso2: "GB" },
};

const PRIORITY_COUNTRIES = Object.keys(COUNTRY_INFO);

interface FaoDataRow {
  areaCode: string;
  areaName: string;
  itemCode: string;
  itemName: string;
  cpcCode: string;
  elementCode: string;
  elementName: string;
  year: number;
  value: number;
  unit: string;
  flag: string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function loadReferenceFile(filePath: string): Map<string, { code: string; name: string; extra?: string }> {
  const map = new Map();
  
  if (!fs.existsSync(filePath)) {
    return map;
  }
  
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const cols = parseCSVLine(line);
    if (cols.length >= 3) {
      map.set(cols[0], {
        code: cols[0],
        name: cols[2],
        extra: cols[1]?.replace(/'/g, "")
      });
    }
  }
  
  return map;
}

function determineCategory(itemName: string): string {
  const lowerName = itemName.toLowerCase();
  
  const fruits = ["apple", "apricot", "banana", "cherry", "fig", "grape", "lemon", "orange", 
                  "peach", "pear", "plum", "quince", "strawberry", "watermelon", "melon",
                  "almond", "chestnut", "hazelnut", "walnut", "persimmon", "pomegranate",
                  "olive", "raspberry", "currant", "blueberry", "avocado", "mandarin", 
                  "tangerine", "kiwi", "date", "mango", "nectarine"];
  
  const vegetables = ["cabbage", "carrot", "cauliflower", "cucumber", "eggplant", "garlic",
                      "lettuce", "onion", "pepper", "potato", "pumpkin", "tomato", "asparagus",
                      "bean", "pea", "mushroom", "artichoke", "broccoli", "squash"];
  
  if (fruits.some(f => lowerName.includes(f))) return "Fruits";
  if (vegetables.some(v => lowerName.includes(v))) return "Vegetables";
  return "Other";
}

/**
 * Sync FAO data for the latest year only
 * Called by cron job (similar to syncLatestYear in eurostat.ts)
 */
export async function syncLatestYear(): Promise<{
  success: boolean;
  countriesUpdated: number;
  productsUpdated: number;
  pricesCreated: number;
  error?: string;
}> {
  console.log("🚀 Starting FAO sync (latest year)...");
  
  const dataDir = path.join(process.cwd(), "data/fao");
  const dataPath = path.join(dataDir, "Prices_E_All_Data_(Normalized).csv");
  
  if (!fs.existsSync(dataPath)) {
    return {
      success: false,
      countriesUpdated: 0,
      productsUpdated: 0,
      pricesCreated: 0,
      error: "FAO data file not found. Please download from FAOSTAT."
    };
  }
  
  try {
    // Load reference files
    const areaCodes = loadReferenceFile(path.join(dataDir, "Prices_E_AreaCodes.csv"));
    const itemCodes = loadReferenceFile(path.join(dataDir, "Prices_E_ItemCodes.csv"));
    
    const fileContent = fs.readFileSync(dataPath, "utf-8");
    const lines = fileContent.split("\n");
    
    // Find latest year in data
    let latestYear = 0;
    const dataRows: FaoDataRow[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const cols = parseCSVLine(line);
      if (cols.length < 15) continue;
      
      const areaCode = cols[0];
      const itemCode = cols[3];
      const elementCode = cols[6];
      const year = parseInt(cols[9]);
      const value = parseFloat(cols[13]);
      
      // Filters
      if (!PRIORITY_COUNTRIES.includes(areaCode)) continue;
      if (!FAO_PRODUCT_MAPPING[itemCode]) continue;
      if (elementCode !== "5532") continue; // Only USD prices
      if (isNaN(year) || year < 2000) continue;
      if (isNaN(value)) continue;
      
      if (year > latestYear) latestYear = year;
      
      const areaInfo = areaCodes.get(areaCode);
      const itemInfo = itemCodes.get(itemCode);
      
      dataRows.push({
        areaCode,
        areaName: areaInfo?.name || cols[2],
        itemCode,
        itemName: itemInfo?.name || cols[5],
        cpcCode: (itemInfo?.extra || cols[4]).replace(/'/g, ""),
        elementCode,
        elementName: cols[7],
        year,
        value,
        unit: cols[12],
        flag: cols[14],
      });
    }
    
    // Filter to only latest 2 years for sync
    const recentRows = dataRows.filter(r => r.year >= latestYear - 1);
    
    console.log(`📊 Latest year: ${latestYear}, processing ${recentRows.length} rows`);
    
    // Get unique countries and products
    const countrySet = new Set(recentRows.map(r => r.areaCode));
    const productSet = new Set(recentRows.map(r => r.itemCode));
    
    // Upsert countries
    let countriesUpdated = 0;
    for (const areaCode of countrySet) {
      const row = recentRows.find(r => r.areaCode === areaCode)!;
      const info = COUNTRY_INFO[areaCode];
      
      await prisma.faoCountry.upsert({
        where: { code: areaCode },
        update: { nameAz: info?.nameAz, iso2: info?.iso2 },
        create: {
          code: areaCode,
          nameEn: row.areaName,
          nameAz: info?.nameAz || null,
          iso2: info?.iso2 || null,
        }
      });
      countriesUpdated++;
    }
    
    // Upsert products
    let productsUpdated = 0;
    for (const itemCode of productSet) {
      const row = recentRows.find(r => r.itemCode === itemCode)!;
      const globalSlug = FAO_PRODUCT_MAPPING[itemCode];
      
      const globalProduct = await prisma.globalProduct.findUnique({
        where: { slug: globalSlug }
      });
      
      await prisma.faoProduct.upsert({
        where: { itemCode },
        update: { 
          nameEn: row.itemName,
          globalProductId: globalProduct?.id || null 
        },
        create: {
          itemCode,
          cpcCode: row.cpcCode,
          nameEn: row.itemName,
          globalProductId: globalProduct?.id || null,
          category: determineCategory(row.itemName),
        }
      });
      productsUpdated++;
      
      // Update GlobalProduct with FAO code
      if (globalProduct && !globalProduct.faoCode) {
        await prisma.globalProduct.update({
          where: { id: globalProduct.id },
          data: { faoCode: itemCode, cpcCode: row.cpcCode }
        });
      }
    }
    
    // Get lookups for prices
    const faoCountries = await prisma.faoCountry.findMany();
    const faoProducts = await prisma.faoProduct.findMany();
    const countryMap = new Map(faoCountries.map(c => [c.code, c.id]));
    const productMap = new Map(faoProducts.map(p => [p.itemCode, p.id]));
    
    // Upsert prices
    let pricesCreated = 0;
    for (const row of recentRows) {
      const countryId = countryMap.get(row.areaCode);
      const productId = productMap.get(row.itemCode);
      
      if (!countryId || !productId) continue;
      
      await prisma.faoPrice.upsert({
        where: {
          countryId_productId_year_elementCode: {
            countryId,
            productId,
            year: row.year,
            elementCode: row.elementCode,
          }
        },
        update: { price: row.value, flag: row.flag },
        create: {
          countryId,
          productId,
          price: row.value,
          currency: "USD",
          unit: "tonne",
          elementCode: row.elementCode,
          elementName: row.elementName,
          year: row.year,
          periodType: "ANNUAL",
          flag: row.flag,
          source: "FAOSTAT",
          sourceUrl: "https://www.fao.org/faostat/en/#data/PP",
        }
      });
      pricesCreated++;
    }
    
    console.log(`✅ FAO sync complete: ${countriesUpdated} countries, ${productsUpdated} products, ${pricesCreated} prices`);
    
    return {
      success: true,
      countriesUpdated,
      productsUpdated,
      pricesCreated
    };
    
  } catch (error) {
    console.error("❌ FAO sync error:", error);
    return {
      success: false,
      countriesUpdated: 0,
      productsUpdated: 0,
      pricesCreated: 0,
      error: String(error)
    };
  }
}

/**
 * Get FAO sync status
 */
export async function getFaoSyncStatus(): Promise<{
  totalCountries: number;
  totalProducts: number;
  totalPrices: number;
  linkedProducts: number;
  latestYear: number | null;
  dataFileExists: boolean;
}> {
  const dataPath = path.join(process.cwd(), "data/fao/Prices_E_All_Data_(Normalized).csv");
  
  const totalCountries = await prisma.faoCountry.count();
  const totalProducts = await prisma.faoProduct.count();
  const totalPrices = await prisma.faoPrice.count();
  const linkedProducts = await prisma.faoProduct.count({ 
    where: { globalProductId: { not: null } } 
  });
  
  const latestPrice = await prisma.faoPrice.findFirst({
    orderBy: { year: "desc" },
    select: { year: true }
  });
  
  return {
    totalCountries,
    totalProducts,
    totalPrices,
    linkedProducts,
    latestYear: latestPrice?.year || null,
    dataFileExists: fs.existsSync(dataPath)
  };
}

