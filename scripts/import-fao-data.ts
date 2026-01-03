/**
 * FAO FAOSTAT Producer Prices Import Script
 * 
 * Imports global producer prices from FAOSTAT bulk download.
 * Data source: https://bulks-faostat.fao.org/production/Prices_E_All_Data_(Normalized).zip
 * 
 * FIXED: 
 * - Reads country names directly from Prices_E_AreaCodes.csv
 * - Reads product names directly from Prices_E_ItemCodes.csv
 * - Correct FAO product to GlobalProduct mapping
 * 
 * Run with: npx tsx scripts/import-fao-data.ts
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// FAO Item Code to GlobalProduct slug mapping (CORRECTED)
const FAO_PRODUCT_MAPPING: Record<string, string> = {
  "221": "almond",          // Almonds, in shell
  "515": "apple",           // Apples
  "526": "apricot",         // Apricots
  "367": "asparagus",       // Asparagus
  "572": "avocado",         // Avocados
  "486": "banana",          // Bananas
  "552": "blueberry",       // Blueberries
  "420": "green-beans",     // Broad beans and horse beans, green
  "358": "cabbage",         // Cabbages
  "568": "melon",           // Cantaloupes and other melons
  "426": "carrot",          // Carrots and turnips
  "393": "cauliflower",     // Cauliflowers and broccoli
  "531": "cherry",          // Cherries
  "220": "chestnut",        // Chestnuts, in shell
  "401": "pepper",          // Chillies and peppers, green
  "397": "cucumber",        // Cucumbers and gherkins
  "550": "blackcurrant",    // Currants
  "399": "eggplant",        // Eggplants (aubergines)
  "569": "fig",             // Figs
  "560": "grape",           // Grapes
  "406": "garlic",          // Green garlic
  "225": "hazelnut",        // Hazelnuts, in shell
  "592": "kiwi",            // Kiwi fruit (NOT olive!)
  "497": "lemon",           // Lemons and limes
  "449": "mushroom",        // Mushrooms and truffles
  "403": "onion",           // Onions and shallots, dry
  "490": "orange",          // Oranges
  "534": "peach",           // Peaches and nectarines
  "521": "pear",            // Pears
  "536": "plum",            // Plums and sloes
  "116": "potato",          // Potatoes
  "394": "pumpkin",         // Pumpkins, squash and gourds
  "523": "quince",          // Quinces
  "547": "raspberry",       // Raspberries
  "530": "sour-cherry",     // Sour cherries
  "544": "strawberry",      // Strawberries
  "495": "mandarin",        // Tangerines, mandarins, clementines
  "388": "tomato",          // Tomatoes
  "222": "walnut",          // Walnuts, in shell
  "567": "watermelon",      // Watermelons
  // Products that don't map directly:
  "366": "artichoke",       // Artichokes (NOT lettuce!)
  "577": "date",            // Dates (NOT persimmon!)
  "571": "mango",           // Mangoes, guavas and mangosteens (NOT pomegranate!)
  "587": "persimmon",       // Persimmons
  "260": "olive",           // Olives
};

// Country name translations (Azerbaijani)
const COUNTRY_NAME_AZ: Record<string, string> = {
  "11": "Avstriya",
  "52": "Azərbaycan",
  "255": "Belçika",
  "27": "Bolqarıstan",
  "80": "Bosniya və Herseqovina",
  "233": "Burkina Faso",
  "167": "Çexiya",
  "67": "Finlandiya",
  "68": "Fransa",
  "73": "Gürcüstan",
  "79": "Almaniya",
  "84": "Yunanıstan",
  "97": "İslandiya",
  "99": "Macarıstan",
  "100": "Hindistan",
  "102": "İran",
  "106": "İtaliya",
  "256": "Lüksemburq",
  "150": "Niderland",
  "162": "Norveç",
  "173": "Polşa",
  "174": "Portuqaliya",
  "183": "Rumıniya",
  "185": "Rusiya",
  "203": "İspaniya",
  "223": "Türkiyə",
  "230": "Ukrayna",
  "229": "Böyük Britaniya",
};

// ISO2 codes for countries
const COUNTRY_ISO2: Record<string, string> = {
  "11": "AT",   // Austria
  "52": "AZ",   // Azerbaijan
  "255": "BE",  // Belgium
  "27": "BG",   // Bulgaria
  "80": "BA",   // Bosnia and Herzegovina
  "233": "BF",  // Burkina Faso
  "167": "CZ",  // Czechia
  "67": "FI",   // Finland
  "68": "FR",   // France
  "73": "GE",   // Georgia
  "79": "DE",   // Germany
  "84": "GR",   // Greece
  "97": "IS",   // Iceland
  "99": "HU",   // Hungary
  "100": "IN",  // India
  "102": "IR",  // Iran
  "106": "IT",  // Italy
  "256": "LU",  // Luxembourg
  "150": "NL",  // Netherlands
  "162": "NO",  // Norway
  "173": "PL",  // Poland
  "174": "PT",  // Portugal
  "183": "RO",  // Romania
  "185": "RU",  // Russian Federation
  "203": "ES",  // Spain
  "223": "TR",  // Turkey
  "230": "UA",  // Ukraine
  "229": "GB",  // United Kingdom
};

// Priority countries for import
const PRIORITY_COUNTRIES = Object.keys(COUNTRY_ISO2);

interface AreaCode {
  code: string;
  m49Code: string;
  name: string;
}

interface ItemCode {
  code: string;
  cpcCode: string;
  name: string;
}

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

function loadAreaCodes(dataDir: string): Map<string, AreaCode> {
  const areaCodesPath = path.join(dataDir, "Prices_E_AreaCodes.csv");
  const areaMap = new Map<string, AreaCode>();
  
  if (!fs.existsSync(areaCodesPath)) {
    console.warn("⚠️ AreaCodes file not found, will use inline data");
    return areaMap;
  }
  
  const content = fs.readFileSync(areaCodesPath, "utf-8");
  const lines = content.split("\n");
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const cols = parseCSVLine(line);
    if (cols.length >= 3) {
      areaMap.set(cols[0], {
        code: cols[0],
        m49Code: cols[1].replace(/'/g, ""),
        name: cols[2]
      });
    }
  }
  
  console.log(`📍 Loaded ${areaMap.size} area codes`);
  return areaMap;
}

function loadItemCodes(dataDir: string): Map<string, ItemCode> {
  const itemCodesPath = path.join(dataDir, "Prices_E_ItemCodes.csv");
  const itemMap = new Map<string, ItemCode>();
  
  if (!fs.existsSync(itemCodesPath)) {
    console.warn("⚠️ ItemCodes file not found, will use inline data");
    return itemMap;
  }
  
  const content = fs.readFileSync(itemCodesPath, "utf-8");
  const lines = content.split("\n");
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const cols = parseCSVLine(line);
    if (cols.length >= 3) {
      itemMap.set(cols[0], {
        code: cols[0],
        cpcCode: cols[1].replace(/'/g, ""),
        name: cols[2]
      });
    }
  }
  
  console.log(`📦 Loaded ${itemMap.size} item codes`);
  return itemMap;
}

async function importFaoData() {
  console.log("🚀 Starting FAO data import (FIXED version)...\n");
  
  const dataDir = path.join(process.cwd(), "data/fao");
  const dataPath = path.join(dataDir, "Prices_E_All_Data_(Normalized).csv");
  
  if (!fs.existsSync(dataPath)) {
    console.error("❌ Data file not found:", dataPath);
    console.log("Please download and extract FAO data:");
    console.log("1. curl -L -o data/fao/producer_prices.zip 'https://bulks-faostat.fao.org/production/Prices_E_All_Data_(Normalized).zip'");
    console.log("2. unzip data/fao/producer_prices.zip -d data/fao/");
    return;
  }
  
  // Load reference data from CSVs
  const areaCodes = loadAreaCodes(dataDir);
  const itemCodes = loadItemCodes(dataDir);
  
  const fileContent = fs.readFileSync(dataPath, "utf-8");
  const lines = fileContent.split("\n");
  
  console.log(`📂 Total lines in CSV: ${lines.length}`);
  
  // Clear existing FAO data for clean import
  console.log("\n🧹 Clearing existing FAO data...");
  await prisma.faoPrice.deleteMany({});
  await prisma.faoProduct.deleteMany({});
  await prisma.faoCountry.deleteMany({});
  console.log("✅ Cleared");
  
  // Parse header
  const header = parseCSVLine(lines[0]);
  console.log("📋 CSV Headers:", header.slice(0, 10));
  
  // Collect data rows
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
    
    // Filter: Only priority countries, mapped products, USD prices, valid years
    if (!PRIORITY_COUNTRIES.includes(areaCode)) continue;
    if (!FAO_PRODUCT_MAPPING[itemCode]) continue;
    if (elementCode !== "5532") continue; // Only USD prices
    if (isNaN(year) || year < 2000) continue;
    if (isNaN(value)) continue;
    
    // Get correct names from reference files
    const areaInfo = areaCodes.get(areaCode);
    const itemInfo = itemCodes.get(itemCode);
    
    dataRows.push({
      areaCode,
      areaName: areaInfo?.name || cols[2],
      itemCode,
      itemName: itemInfo?.name || cols[5],
      cpcCode: (itemInfo?.cpcCode || cols[4]).replace(/'/g, ""),
      elementCode,
      elementName: cols[7],
      year,
      value,
      unit: cols[12],
      flag: cols[14],
    });
  }
  
  console.log(`\n📊 Filtered rows: ${dataRows.length}`);
  
  // Group by country and product
  const countrySet = new Set(dataRows.map(r => r.areaCode));
  const productSet = new Set(dataRows.map(r => r.itemCode));
  
  console.log(`🌍 Countries: ${countrySet.size}`);
  console.log(`📦 Products: ${productSet.size}`);
  
  // Step 1: Create FAO Countries (with correct names from CSV)
  console.log("\n📍 Creating FAO countries...");
  for (const areaCode of countrySet) {
    const areaInfo = areaCodes.get(areaCode);
    const row = dataRows.find(r => r.areaCode === areaCode)!;
    
    const countryName = areaInfo?.name || row.areaName;
    const m49Code = areaInfo?.m49Code || null;
    
    await prisma.faoCountry.create({
      data: {
        code: areaCode,
        m49Code: m49Code,
        iso2: COUNTRY_ISO2[areaCode] || null,
        nameEn: countryName,
        nameAz: COUNTRY_NAME_AZ[areaCode] || null,
      }
    });
    console.log(`  ✅ Created: ${countryName} (${areaCode}) → ${COUNTRY_ISO2[areaCode] || "?"}`);
  }
  
  // Step 2: Create FAO Products and link to GlobalProducts
  console.log("\n📦 Creating FAO products...");
  for (const itemCode of productSet) {
    const itemInfo = itemCodes.get(itemCode);
    const row = dataRows.find(r => r.itemCode === itemCode)!;
    const globalSlug = FAO_PRODUCT_MAPPING[itemCode];
    
    const productName = itemInfo?.name || row.itemName;
    const cpcCode = (itemInfo?.cpcCode || row.cpcCode).replace(/'/g, "");
    
    // Find GlobalProduct
    const globalProduct = await prisma.globalProduct.findUnique({
      where: { slug: globalSlug }
    });
    
    await prisma.faoProduct.create({
      data: {
        itemCode,
        cpcCode,
        nameEn: productName,
        globalProductId: globalProduct?.id || null,
        category: determineCategory(productName),
      }
    });
    
    const linkStatus = globalProduct ? `→ ${globalSlug}` : "(no GlobalProduct)";
    console.log(`  ✅ Created: ${productName} (${itemCode}) ${linkStatus}`);
    
    // Update GlobalProduct with FAO code if not set
    if (globalProduct && !globalProduct.faoCode) {
      await prisma.globalProduct.update({
        where: { id: globalProduct.id },
        data: { 
          faoCode: itemCode,
          cpcCode: cpcCode,
        }
      });
    }
  }
  
  // Step 3: Import FAO Prices
  console.log("\n💰 Importing FAO prices...");
  let created = 0;
  
  // Get all FAO countries and products for lookup
  const faoCountries = await prisma.faoCountry.findMany();
  const faoProducts = await prisma.faoProduct.findMany();
  
  const countryMap = new Map(faoCountries.map(c => [c.code, c.id]));
  const productMap = new Map(faoProducts.map(p => [p.itemCode, p.id]));
  
  // Batch insert
  const batchSize = 500;
  const pricesToCreate: any[] = [];
  
  for (const row of dataRows) {
    const countryId = countryMap.get(row.areaCode);
    const productId = productMap.get(row.itemCode);
    
    if (!countryId || !productId) continue;
    
    pricesToCreate.push({
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
    });
  }
  
  // Insert in batches using upsert to avoid duplicates
  for (let i = 0; i < pricesToCreate.length; i += batchSize) {
    const batch = pricesToCreate.slice(i, i + batchSize);
    
    for (const price of batch) {
      try {
        await prisma.faoPrice.upsert({
          where: {
            countryId_productId_year_elementCode: {
              countryId: price.countryId,
              productId: price.productId,
              year: price.year,
              elementCode: price.elementCode,
            }
          },
          update: { price: price.price, flag: price.flag },
          create: price,
        });
        created++;
      } catch (e) {
        // Skip duplicates
      }
    }
    
    process.stdout.write(`\r  Progress: ${Math.min(i + batchSize, pricesToCreate.length)}/${pricesToCreate.length}`);
  }
  
  console.log(`\n  ✅ Created/Updated: ${created}`);
  
  // Summary
  console.log("\n📊 Import Summary:");
  const totalCountries = await prisma.faoCountry.count();
  const totalProducts = await prisma.faoProduct.count();
  const totalPrices = await prisma.faoPrice.count();
  const linkedProducts = await prisma.faoProduct.count({ where: { globalProductId: { not: null } } });
  
  console.log(`  FAO Countries: ${totalCountries}`);
  console.log(`  FAO Products: ${totalProducts} (${linkedProducts} linked to GlobalProduct)`);
  console.log(`  FAO Prices: ${totalPrices}`);
  
  // Show sample countries
  console.log("\n🌍 Sample Countries:");
  const sampleCountries = await prisma.faoCountry.findMany({ take: 5 });
  for (const c of sampleCountries) {
    console.log(`  ${c.code}: ${c.nameEn} (${c.nameAz || "?"}) [${c.iso2 || "?"}]`);
  }
  
  // Show AZ data
  const azCountry = await prisma.faoCountry.findFirst({ where: { code: "52" } });
  if (azCountry) {
    const azPrices = await prisma.faoPrice.count({ where: { countryId: azCountry.id } });
    console.log(`\n🇦🇿 Azerbaijan Prices: ${azPrices}`);
  }
  
  console.log("\n✨ FAO import completed!");
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

importFaoData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
