/**
 * FAO FAOSTAT Producer Prices Import Script
 * 
 * Imports global producer prices from FAOSTAT bulk download.
 * Data source: https://bulks-faostat.fao.org/production/Prices_E_All_Data_(Normalized).zip
 * 
 * Run with: npx tsx scripts/import-fao-data.ts
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// FAO to GlobalProduct mapping (FAO Item Code -> our slug)
const FAO_PRODUCT_MAPPING: Record<string, string> = {
  "515": "apple",
  "526": "apricot",
  "486": "banana",
  "358": "cabbage",
  "426": "carrot", // Carrots and turnips
  "393": "cauliflower", // Cauliflowers and broccoli
  "531": "cherry", // Cherries
  "397": "cucumber", // Cucumbers and gherkins
  "399": "eggplant", // Eggplants (aubergines)
  "569": "fig",
  "406": "garlic", // Green garlic
  "560": "grape", // Grapes
  "420": "green-beans", // Broad beans and horse beans, green -> use green-beans
  "225": "hazelnut", // Hazelnuts, in shell
  "497": "lemon", // Lemons and limes
  "366": "lettuce", // mapped to lettuce (no direct FAO code found)
  "490": "orange", // Oranges
  "403": "onion", // Onions and shallots, dry
  "534": "peach", // Peaches and nectarines
  "521": "pear", // Pears
  "401": "pepper", // Chillies and peppers, green
  "536": "plum", // Plums and sloes
  "116": "potato", // Potatoes
  "394": "pumpkin", // Pumpkins, squash and gourds
  "523": "quince", // Quinces
  "544": "strawberry", // Strawberries
  "388": "tomato", // Tomatoes
  "222": "walnut", // Walnuts, in shell
  "567": "watermelon", // Watermelons
  "568": "melon", // Cantaloupes and other melons
  "221": "almond", // Almonds, in shell
  "220": "chestnut", // Chestnuts, in shell
  "577": "persimmon", // Persimmons
  "571": "pomegranate", // Pomegranates (if exists)
  "592": "olive", // Olives
  "547": "raspberry", // Raspberries
  "550": "blackcurrant", // Currants
  "449": "mushroom", // Mushrooms and truffles
  "572": "avocado", // Avocados
  "367": "asparagus", // Asparagus
  "530": "sour-cherry", // Sour cherries
  "568": "melon", // Cantaloupes and other melons
  "489": "mandarin", // Tangerines, mandarins, clementines (mapped)
  "495": "mandarin", // Tangerines, mandarins, clementines
  "552": "blueberry", // Blueberries
};

// Countries we care about for comparison
const PRIORITY_COUNTRIES = [
  "52",  // Azerbaijan
  "79",  // Germany
  "203", // France
  "106", // Italy
  "229", // Spain
  "162", // Poland
  "68",  // Turkey
  "185", // Russia
  "100", // Iran
  "80",  // Georgia
  "233", // Ukraine
  "93",  // Greece
  "36",  // Bulgaria
  "174", // Romania
  "99",  // Hungary
  "167", // Portugal
  "11",  // Austria
  "67",  // Netherlands
  "255", // Belgium
  "256", // Czechia
];

// Azerbaijan name in Azerbaijani
const COUNTRY_NAME_AZ: Record<string, string> = {
  "52": "Azərbaycan",
  "79": "Almaniya",
  "203": "Fransa",
  "106": "İtaliya",
  "229": "İspaniya",
  "162": "Polşa",
  "68": "Türkiyə",
  "185": "Rusiya",
  "100": "İran",
  "80": "Gürcüstan",
  "233": "Ukrayna",
  "93": "Yunanıstan",
  "36": "Bolqarıstan",
  "174": "Rumıniya",
  "99": "Macarıstan",
  "167": "Portuqaliya",
  "11": "Avstriya",
  "67": "Niderland",
  "255": "Belçika",
  "256": "Çexiya",
};

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

async function importFaoData() {
  console.log("🚀 Starting FAO data import...\n");
  
  const dataPath = path.join(process.cwd(), "data/fao/Prices_E_All_Data_(Normalized).csv");
  
  if (!fs.existsSync(dataPath)) {
    console.error("❌ Data file not found:", dataPath);
    console.log("Please run: curl -L -o data/fao/producer_prices.zip 'https://bulks-faostat.fao.org/production/Prices_E_All_Data_(Normalized).zip' && unzip data/fao/producer_prices.zip -d data/fao/");
    return;
  }
  
  const fileContent = fs.readFileSync(dataPath, "utf-8");
  const lines = fileContent.split("\n");
  
  console.log(`📂 Total lines in CSV: ${lines.length}`);
  
  // Parse header
  const header = parseCSVLine(lines[0]);
  console.log("📋 CSV Headers:", header);
  
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
    
    dataRows.push({
      areaCode,
      areaName: cols[2],
      itemCode,
      itemName: cols[5],
      cpcCode: cols[4].replace(/'/g, ""),
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
  
  // Step 1: Create FAO Countries
  console.log("\n📍 Creating FAO countries...");
  for (const row of dataRows) {
    const existing = await prisma.faoCountry.findUnique({
      where: { code: row.areaCode }
    });
    
    if (!existing) {
      await prisma.faoCountry.create({
        data: {
          code: row.areaCode,
          nameEn: row.areaName,
          nameAz: COUNTRY_NAME_AZ[row.areaCode] || null,
        }
      });
      console.log(`  ✅ Created: ${row.areaName} (${row.areaCode})`);
    }
  }
  
  // Step 2: Create FAO Products and link to GlobalProducts
  console.log("\n📦 Creating FAO products...");
  for (const itemCode of productSet) {
    const row = dataRows.find(r => r.itemCode === itemCode)!;
    const globalSlug = FAO_PRODUCT_MAPPING[itemCode];
    
    const existing = await prisma.faoProduct.findUnique({
      where: { itemCode }
    });
    
    if (!existing) {
      // Find GlobalProduct
      const globalProduct = await prisma.globalProduct.findUnique({
        where: { slug: globalSlug }
      });
      
      await prisma.faoProduct.create({
        data: {
          itemCode,
          cpcCode: row.cpcCode,
          nameEn: row.itemName,
          globalProductId: globalProduct?.id || null,
          category: determineCategory(row.itemName),
        }
      });
      console.log(`  ✅ Created: ${row.itemName} (${itemCode}) → ${globalSlug}`);
      
      // Update GlobalProduct with FAO code if not set
      if (globalProduct && !globalProduct.faoCode) {
        await prisma.globalProduct.update({
          where: { id: globalProduct.id },
          data: { 
            faoCode: itemCode,
            cpcCode: row.cpcCode,
          }
        });
      }
    }
  }
  
  // Step 3: Import FAO Prices
  console.log("\n💰 Importing FAO prices...");
  let created = 0;
  let skipped = 0;
  
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
    
    if (!countryId || !productId) {
      skipped++;
      continue;
    }
    
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
  
  // Insert in batches
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
        skipped++;
      }
    }
    
    process.stdout.write(`\r  Progress: ${Math.min(i + batchSize, pricesToCreate.length)}/${pricesToCreate.length}`);
  }
  
  console.log(`\n  ✅ Created/Updated: ${created}`);
  console.log(`  ⏭️  Skipped: ${skipped}`);
  
  // Summary
  console.log("\n📊 Import Summary:");
  const totalCountries = await prisma.faoCountry.count();
  const totalProducts = await prisma.faoProduct.count();
  const totalPrices = await prisma.faoPrice.count();
  const linkedProducts = await prisma.faoProduct.count({ where: { globalProductId: { not: null } } });
  
  console.log(`  FAO Countries: ${totalCountries}`);
  console.log(`  FAO Products: ${totalProducts} (${linkedProducts} linked to GlobalProduct)`);
  console.log(`  FAO Prices: ${totalPrices}`);
  
  // Show AZ data
  const azCountry = await prisma.faoCountry.findUnique({ where: { code: "52" } });
  if (azCountry) {
    const azPrices = await prisma.faoPrice.count({ where: { countryId: azCountry.id } });
    console.log(`  Azerbaijan Prices: ${azPrices}`);
  }
  
  console.log("\n✨ FAO import completed!");
}

function determineCategory(itemName: string): string {
  const lowerName = itemName.toLowerCase();
  
  const fruits = ["apple", "apricot", "banana", "cherry", "fig", "grape", "lemon", "orange", 
                  "peach", "pear", "plum", "quince", "strawberry", "watermelon", "melon",
                  "almond", "chestnut", "hazelnut", "walnut", "persimmon", "pomegranate",
                  "olive", "raspberry", "currant", "blueberry", "avocado", "mandarin", "tangerine"];
  
  const vegetables = ["cabbage", "carrot", "cauliflower", "cucumber", "eggplant", "garlic",
                      "lettuce", "onion", "pepper", "potato", "pumpkin", "tomato", "asparagus",
                      "bean", "pea", "mushroom"];
  
  if (fruits.some(f => lowerName.includes(f))) return "Fruits";
  if (vegetables.some(v => lowerName.includes(v))) return "Vegetables";
  return "Other";
}

importFaoData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

