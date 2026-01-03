/**
 * EU Data Seed Script
 * 
 * Loads initial EU data from EC Agrifood and Eurostat
 * Run with: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/seed-eu-data.ts
 * Or: npx tsx scripts/seed-eu-data.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EC_AGRIFOOD_BASE_URL = "https://ec.europa.eu/agrifood/api";
const EUROSTAT_BASE_URL = "https://ec.europa.eu/eurostat/api/dissemination/sdmx/2.1/data";

// EU Countries
const EU_COUNTRIES = [
  { code: "AT", nameEn: "Austria", nameAz: "Avstriya", region: "Western Europe" },
  { code: "BE", nameEn: "Belgium", nameAz: "Belçika", region: "Western Europe" },
  { code: "BG", nameEn: "Bulgaria", nameAz: "Bolqarıstan", region: "Eastern Europe" },
  { code: "CY", nameEn: "Cyprus", nameAz: "Kipr", region: "Southern Europe" },
  { code: "CZ", nameEn: "Czechia", nameAz: "Çexiya", region: "Eastern Europe" },
  { code: "DE", nameEn: "Germany", nameAz: "Almaniya", region: "Western Europe" },
  { code: "DK", nameEn: "Denmark", nameAz: "Danimarka", region: "Northern Europe" },
  { code: "EE", nameEn: "Estonia", nameAz: "Estoniya", region: "Northern Europe" },
  { code: "EL", nameEn: "Greece", nameAz: "Yunanıstan", region: "Southern Europe" },
  { code: "ES", nameEn: "Spain", nameAz: "İspaniya", region: "Southern Europe" },
  { code: "FI", nameEn: "Finland", nameAz: "Finlandiya", region: "Northern Europe" },
  { code: "FR", nameEn: "France", nameAz: "Fransa", region: "Western Europe" },
  { code: "HR", nameEn: "Croatia", nameAz: "Xorvatiya", region: "Eastern Europe" },
  { code: "HU", nameEn: "Hungary", nameAz: "Macarıstan", region: "Eastern Europe" },
  { code: "IE", nameEn: "Ireland", nameAz: "İrlandiya", region: "Western Europe" },
  { code: "IT", nameEn: "Italy", nameAz: "İtaliya", region: "Southern Europe" },
  { code: "LT", nameEn: "Lithuania", nameAz: "Litva", region: "Northern Europe" },
  { code: "LU", nameEn: "Luxembourg", nameAz: "Lüksemburq", region: "Western Europe" },
  { code: "LV", nameEn: "Latvia", nameAz: "Latviya", region: "Northern Europe" },
  { code: "MT", nameEn: "Malta", nameAz: "Malta", region: "Southern Europe" },
  { code: "NL", nameEn: "Netherlands", nameAz: "Hollandiya", region: "Western Europe" },
  { code: "PL", nameEn: "Poland", nameAz: "Polşa", region: "Eastern Europe" },
  { code: "PT", nameEn: "Portugal", nameAz: "Portuqaliya", region: "Southern Europe" },
  { code: "RO", nameEn: "Romania", nameAz: "Rumıniya", region: "Eastern Europe" },
  { code: "SE", nameEn: "Sweden", nameAz: "İsveç", region: "Northern Europe" },
  { code: "SI", nameEn: "Slovenia", nameAz: "Sloveniya", region: "Eastern Europe" },
  { code: "SK", nameEn: "Slovakia", nameAz: "Slovakiya", region: "Eastern Europe" },
];

// Eurostat product codes
const EUROSTAT_PRODUCTS = [
  { code: "06110000", nameEn: "Dessert apples", category: "Fruits" },
  { code: "06120000", nameEn: "Dessert pears", category: "Fruits" },
  { code: "06130000", nameEn: "Peaches", category: "Fruits" },
  { code: "06191100", nameEn: "Sweet cherries", category: "Fruits" },
  { code: "06192000", nameEn: "Plums", category: "Fruits" },
  { code: "06193000", nameEn: "Strawberries", category: "Fruits" },
  { code: "06199100", nameEn: "Apricots", category: "Fruits" },
  { code: "06210000", nameEn: "Oranges", category: "Fruits" },
  { code: "06220000", nameEn: "Mandarins", category: "Fruits" },
  { code: "06230000", nameEn: "Lemons", category: "Fruits" },
  { code: "06410000", nameEn: "Dessert grapes", category: "Fruits" },
  { code: "04110000", nameEn: "Cauliflowers", category: "Vegetables" },
  { code: "04121000", nameEn: "Tomatoes (open)", category: "Vegetables" },
  { code: "04191100", nameEn: "White cabbage", category: "Vegetables" },
  { code: "04194100", nameEn: "Cucumbers (open)", category: "Vegetables" },
  { code: "04195000", nameEn: "Carrots", category: "Vegetables" },
  { code: "04196000", nameEn: "Onions", category: "Vegetables" },
  { code: "04197000", nameEn: "Green beans", category: "Vegetables" },
  { code: "04199000", nameEn: "Green peas", category: "Vegetables" },
  { code: "04199906", nameEn: "Garlic", category: "Vegetables" },
  { code: "05120000", nameEn: "Main crop potatoes", category: "Vegetables" },
];

async function seedEuCountries() {
  console.log("Seeding EU countries...");
  
  for (const country of EU_COUNTRIES) {
    await prisma.euCountry.upsert({
      where: { code: country.code },
      update: { nameEn: country.nameEn, nameAz: country.nameAz, region: country.region },
      create: { ...country, isActive: true },
    });
  }
  
  console.log(`✓ ${EU_COUNTRIES.length} EU countries seeded`);
}

async function seedEurostatProducts() {
  console.log("Seeding Eurostat products...");
  
  for (const product of EUROSTAT_PRODUCTS) {
    const existing = await prisma.euProduct.findFirst({
      where: { eurostatCode: product.code }
    });
    
    if (!existing) {
      await prisma.euProduct.create({
        data: {
          eurostatCode: product.code,
          nameEn: product.nameEn,
          category: product.category,
          unit: "€/100kg",
        },
      });
    }
  }
  
  console.log(`✓ ${EUROSTAT_PRODUCTS.length} Eurostat products seeded`);
}

async function fetchEcAgrifoodProducts(): Promise<string[]> {
  console.log("Fetching EC Agrifood products...");
  
  const response = await fetch(
    `${EC_AGRIFOOD_BASE_URL}/fruitAndVegetable/pricesSupplyChain/products`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status}`);
  }
  
  const products: string[] = await response.json();
  console.log(`✓ ${products.length} EC Agrifood products found`);
  return products;
}

async function seedEcAgrifoodProducts(products: string[]) {
  console.log("Seeding EC Agrifood products...");
  
  const fruits = [
    "Apples", "Apricots", "Avocados", "Bananas", "Cherries", "Clementines",
    "Grapes", "Kiwis", "Lemons", "Mandarins", "Melons", "Nectarines",
    "Oranges", "Peaches", "Pears", "Plums", "Satsumas", "Strawberries"
  ];
  
  for (const productName of products) {
    const existing = await prisma.euProduct.findFirst({
      where: { ecAgrifoodCode: productName }
    });
    
    if (!existing) {
      const category = fruits.some(f => productName.toLowerCase().includes(f.toLowerCase()))
        ? "Fruits"
        : "Vegetables";
      
      await prisma.euProduct.create({
        data: {
          ecAgrifoodCode: productName,
          nameEn: productName,
          category,
          unit: "€/100kg",
        },
      });
    }
  }
  
  console.log(`✓ EC Agrifood products seeded`);
}

async function fetchEurostatPrices(
  productCode: string,
  countryCode: string,
  startYear: number
): Promise<{ year: number; price: number }[]> {
  try {
    const url = `${EUROSTAT_BASE_URL}/APRI_AP_CRPOUTA/A.EUR.${productCode}.${countryCode}?format=JSON&sinceTimePeriod=${startYear}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    const years = Object.keys(data.dimension?.time?.category?.label || {});
    const values = data.value || {};
    
    const results: { year: number; price: number }[] = [];
    years.forEach((year, index) => {
      const price = values[String(index)];
      if (price !== undefined) {
        results.push({ year: parseInt(year), price });
      }
    });
    
    return results;
  } catch {
    return [];
  }
}

async function seedEurostatPrices(startYear: number, endYear: number) {
  console.log(`Seeding Eurostat prices (${startYear}-${endYear})...`);
  
  let totalPrices = 0;
  
  for (const product of EUROSTAT_PRODUCTS) {
    const euProduct = await prisma.euProduct.findFirst({
      where: { eurostatCode: product.code }
    });
    
    if (!euProduct) continue;
    
    for (const country of EU_COUNTRIES) {
      const euCountry = await prisma.euCountry.findUnique({
        where: { code: country.code }
      });
      
      if (!euCountry) continue;
      
      const prices = await fetchEurostatPrices(product.code, country.code, startYear);
      
      for (const { year, price } of prices) {
        if (year > endYear) continue;
        
        await prisma.euPrice.upsert({
          where: {
            countryId_productId_year_period_periodType_priceStage_variety: {
              countryId: euCountry.id,
              productId: euProduct.id,
              year,
              period: 0,
              periodType: "Year",
              priceStage: "PRODUCER",
              variety: product.nameEn
            }
          },
          update: { price },
          create: {
            countryId: euCountry.id,
            productId: euProduct.id,
            price,
            currency: "EUR",
            unit: "€/100kg",
            source: "EUROSTAT",
            sourceName: "Eurostat - European Statistical Office",
            sourceUrl: "https://ec.europa.eu/eurostat/",
            priceStage: "PRODUCER",
            periodType: "Year",
            period: 0,
            year,
            startDate: new Date(year, 0, 1),
            endDate: new Date(year, 11, 31),
            variety: product.nameEn,
            market: `National average (${country.code})`,
            isCalculated: false
          }
        });
        
        totalPrices++;
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`  - ${product.nameEn}: done`);
  }
  
  console.log(`✓ ${totalPrices} Eurostat prices seeded`);
}

// EC Agrifood weekly prices (retail, wholesale)
async function fetchEcAgrifoodPrices(productCode: string, countryCode: string, priceStage: string) {
  try {
    // EC Agrifood price stages: RETAIL_CONSUMPTION, WHOLESALE_ENTRY, FARMGATE
    const url = `${EC_AGRIFOOD_BASE_URL}/fruitAndVegetable/pricesSupplyChain/prices?product=${encodeURIComponent(productCode)}&memberState=${countryCode}&stage=${priceStage}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    
    // EC Agrifood returns array of price records
    // { week: "2024-W01", price: 1.23, variety: "...", unit: "€/100kg" }
    return data.map((item: any) => ({
      week: item.week,
      price: item.price,
      variety: item.variety || productCode,
      unit: item.unit || "€/100kg"
    }));
  } catch {
    return [];
  }
}

// Parse ISO week string to date
function parseWeekDate(weekStr: string): { year: number; week: number; startDate: Date } {
  // Format: "2024-W01"
  const [yearStr, weekPart] = weekStr.split("-W");
  const year = parseInt(yearStr);
  const week = parseInt(weekPart);
  
  // Calculate start date of the week
  const jan1 = new Date(year, 0, 1);
  const daysOffset = (week - 1) * 7 - jan1.getDay() + 1;
  const startDate = new Date(year, 0, 1 + daysOffset);
  
  return { year, week, startDate };
}

async function seedEcAgrifoodPrices() {
  console.log("Seeding EC Agrifood prices (weekly)...");
  
  const priceStages = [
    { code: "RETAIL_CONSUMPTION", mapped: "RETAIL" },
    { code: "WHOLESALE_ENTRY", mapped: "WHOLESALE" },
    { code: "FARMGATE", mapped: "PRODUCER" }
  ];
  
  let totalPrices = 0;
  
  // Get EC Agrifood products
  const ecProducts = await prisma.euProduct.findMany({
    where: { ecAgrifoodCode: { not: null } }
  });
  
  for (const euProduct of ecProducts) {
    if (!euProduct.ecAgrifoodCode) continue;
    
    for (const country of EU_COUNTRIES) {
      const euCountry = await prisma.euCountry.findUnique({
        where: { code: country.code }
      });
      
      if (!euCountry) continue;
      
      for (const stage of priceStages) {
        const prices = await fetchEcAgrifoodPrices(
          euProduct.ecAgrifoodCode,
          country.code,
          stage.code
        );
        
        for (const priceData of prices) {
          if (!priceData.week || !priceData.price) continue;
          
          const { year, week, startDate } = parseWeekDate(priceData.week);
          
          // Only import 2020-2025 data
          if (year < 2020 || year > 2025) continue;
          
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 6);
          
          await prisma.euPrice.upsert({
            where: {
              countryId_productId_year_period_periodType_priceStage_variety: {
                countryId: euCountry.id,
                productId: euProduct.id,
                year,
                period: week,
                periodType: "Week",
                priceStage: stage.mapped,
                variety: priceData.variety
              }
            },
            update: { price: priceData.price },
            create: {
              countryId: euCountry.id,
              productId: euProduct.id,
              price: priceData.price,
              currency: "EUR",
              unit: priceData.unit,
              source: "EC_AGRIFOOD",
              sourceName: "European Commission - Agri-food Data Portal",
              sourceUrl: "https://agridata.ec.europa.eu/",
              priceStage: stage.mapped,
              periodType: "Week",
              period: week,
              year,
              startDate,
              endDate,
              variety: priceData.variety,
              market: `${stage.mapped} - ${country.code}`,
              isCalculated: false
            }
          });
          
          totalPrices++;
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`  - ${euProduct.ecAgrifoodCode}: done`);
  }
  
  console.log(`✓ ${totalPrices} EC Agrifood prices seeded`);
}

async function runFuzzyMatching() {
  console.log("Running fuzzy matching...");
  
  // Get local products (AZ products)
  const localProducts = await prisma.product.findMany({
    select: { id: true, name: true, nameEn: true }
  });
  
  // Get EU products that need matching
  const euProducts = await prisma.euProduct.findMany({
    where: { localProductId: null, isManualMatch: false }
  });
  
  // Simple dictionary-based matching
  const dictionary: Record<string, string[]> = {
    "alma": ["apple", "apples", "dessert apple"],
    "armud": ["pear", "pears", "dessert pear"],
    "pomidor": ["tomato", "tomatoes"],
    "xiyar": ["cucumber", "cucumbers"],
    "soğan": ["onion", "onions"],
    "kartof": ["potato", "potatoes"],
    "üzüm": ["grape", "grapes"],
    "şaftalı": ["peach", "peaches"],
    "gilas": ["cherry", "cherries"],
    "çiyələk": ["strawberry", "strawberries"],
    "portağal": ["orange", "oranges"],
    "limon": ["lemon", "lemons"],
    "yerkökü": ["carrot", "carrots"],
    "kələm": ["cabbage"],
    "sarımsaq": ["garlic"],
    "bibər": ["pepper", "capsicum"],
    "lobya": ["bean", "beans"],
    "noxud": ["pea", "peas"],
  };
  
  let matched = 0;
  
  for (const euProduct of euProducts) {
    const euName = (euProduct.nameEn || euProduct.ecAgrifoodCode || "").toLowerCase();
    
    for (const localProduct of localProducts) {
      const localName = localProduct.name.toLowerCase();
      const localNameEn = (localProduct.nameEn || "").toLowerCase();
      
      // Check dictionary
      const enWords = dictionary[localName] || [];
      let isMatch = false;
      let score = 0;
      
      for (const enWord of enWords) {
        if (euName.includes(enWord)) {
          isMatch = true;
          score = 95;
          break;
        }
      }
      
      // Check English name directly
      if (!isMatch && localNameEn && euName.includes(localNameEn)) {
        isMatch = true;
        score = 90;
      }
      
      if (isMatch) {
        await prisma.euProduct.update({
          where: { id: euProduct.id },
          data: {
            localProductId: localProduct.id,
            matchScore: score
          }
        });
        matched++;
        break;
      }
    }
  }
  
  console.log(`✓ ${matched} products matched`);
}

async function main() {
  console.log("=".repeat(50));
  console.log("EU Data Seed Script");
  console.log("=".repeat(50));
  
  const startYear = 2020;
  const endYear = 2025;
  
  try {
    // Step 1: Seed EU countries
    await seedEuCountries();
    
    // Step 2: Seed Eurostat products
    await seedEurostatProducts();
    
    // Step 3: Fetch and seed EC Agrifood products
    const ecProducts = await fetchEcAgrifoodProducts();
    await seedEcAgrifoodProducts(ecProducts);
    
    // Step 4: Seed Eurostat prices (annual, PRODUCER)
    await seedEurostatPrices(startYear, endYear);
    
    // Step 5: Seed EC Agrifood prices (weekly, RETAIL/WHOLESALE/PRODUCER)
    await seedEcAgrifoodPrices();
    
    // Step 6: Run fuzzy matching
    await runFuzzyMatching();
    
    // Final stats
    const eurostatPrices = await prisma.euPrice.count({ where: { source: "EUROSTAT" } });
    const ecAgrifoodPrices = await prisma.euPrice.count({ where: { source: "EC_AGRIFOOD" } });
    const retailPrices = await prisma.euPrice.count({ where: { priceStage: "RETAIL" } });
    const wholesalePrices = await prisma.euPrice.count({ where: { priceStage: "WHOLESALE" } });
    const producerPrices = await prisma.euPrice.count({ where: { priceStage: "PRODUCER" } });
    
    const stats = {
      euCountries: await prisma.euCountry.count(),
      euProducts: await prisma.euProduct.count(),
      euPrices: await prisma.euPrice.count(),
      matchedProducts: await prisma.euProduct.count({
        where: { localProductId: { not: null } }
      })
    };
    
    console.log("\n" + "=".repeat(50));
    console.log("Seed Complete!");
    console.log("=".repeat(50));
    console.log(`EU Countries: ${stats.euCountries}`);
    console.log(`EU Products: ${stats.euProducts}`);
    console.log(`EU Prices: ${stats.euPrices}`);
    console.log(`  - EUROSTAT (annual): ${eurostatPrices}`);
    console.log(`  - EC_AGRIFOOD (weekly): ${ecAgrifoodPrices}`);
    console.log(`  - PRODUCER prices: ${producerPrices}`);
    console.log(`  - RETAIL prices: ${retailPrices}`);
    console.log(`  - WHOLESALE prices: ${wholesalePrices}`);
    console.log(`Matched Products: ${stats.matchedProducts}`);
    
  } catch (error) {
    console.error("Seed error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
