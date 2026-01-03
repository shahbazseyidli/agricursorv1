/**
 * Link all source products to GlobalCategory and GlobalProduct
 * 1. Link FPMA Commodities to GlobalProduct (create if needed)
 * 2. Link all products to GlobalCategory based on HS codes
 * 3. Create missing GlobalProducts from FPMA/FAO/EU data
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// HS code to GlobalCategory mapping
const hsToCategory: Record<string, string> = {
  "01": "live-animals",
  "02": "meat",
  "03": "fish",
  "04": "dairy",
  "07": "vegetables",
  "08": "fruits",
  "10": "cereals",
  "11": "flour",
  "12": "oilseeds",
  "15": "oils",
  "16": "prepared-meat",
  "17": "sugar",
  "19": "bakery",
  "20": "preserved",
};

// FPMA base code to GlobalProduct mapping
const fpmaToProduct: Record<string, { slug: string; nameEn: string; nameAz?: string; category: string }> = {
  // Live animals
  "010410": { slug: "sheep", nameEn: "Sheep", nameAz: "Qoyun", category: "live-animals" },
  "010420": { slug: "goat", nameEn: "Goat", nameAz: "Keçi", category: "live-animals" },
  "010613": { slug: "camel", nameEn: "Camel", nameAz: "Dəvə", category: "live-animals" },
  
  // Meat
  "020120": { slug: "beef-bone", nameEn: "Beef (with bones)", nameAz: "Mal əti (sümüklü)", category: "meat" },
  "020130": { slug: "beef", nameEn: "Beef", nameAz: "Mal əti", category: "meat" },
  "020311": { slug: "pork", nameEn: "Pork", nameAz: "Donuz əti", category: "meat" },
  "020410": { slug: "mutton", nameEn: "Mutton", nameAz: "Qoyun əti", category: "meat" },
  "020423": { slug: "lamb", nameEn: "Lamb", nameAz: "Quzu əti", category: "meat" },
  "020711": { slug: "chicken-whole", nameEn: "Chicken (whole)", nameAz: "Toyuq (bütöv)", category: "meat" },
  "020712": { slug: "chicken-frozen", nameEn: "Chicken (frozen)", nameAz: "Toyuq (dondurulmuş)", category: "meat" },
  "020713": { slug: "chicken", nameEn: "Chicken", nameAz: "Toyuq", category: "meat" },
  "020714": { slug: "chicken-frozen-parts", nameEn: "Chicken (frozen parts)", nameAz: "Toyuq (dondurulmuş hissələr)", category: "meat" },
  "020726": { slug: "turkey", nameEn: "Turkey", nameAz: "Hinduşka", category: "meat" },
  "020860": { slug: "camel-meat", nameEn: "Camel meat", nameAz: "Dəvə əti", category: "meat" },
  
  // Fish
  "030239": { slug: "tuna", nameEn: "Tuna", nameAz: "Tuna", category: "fish" },
  "030271": { slug: "tilapia", nameEn: "Tilapia", nameAz: "Tilapiya", category: "fish" },
  "030272": { slug: "catfish", nameEn: "Catfish", nameAz: "Som balığı", category: "fish" },
  "030273": { slug: "carp", nameEn: "Carp", nameAz: "Çapaq", category: "fish" },
  "030289": { slug: "fish-fresh", nameEn: "Fish (fresh)", nameAz: "Balıq (təzə)", category: "fish" },
  "030354": { slug: "mackerel", nameEn: "Mackerel", nameAz: "Skumbriya", category: "fish" },
  "030366": { slug: "hake", nameEn: "Hake", nameAz: "Xek", category: "fish" },
  "030367": { slug: "pollock", nameEn: "Pollock", nameAz: "Mintay", category: "fish" },
  "030449": { slug: "fish-fillet", nameEn: "Fish fillet", nameAz: "Balıq filesi", category: "fish" },
  "030549": { slug: "fish-smoked", nameEn: "Fish (smoked)", nameAz: "Balıq (hisə verilmiş)", category: "fish" },
  "030559": { slug: "fish-dried", nameEn: "Fish (dried)", nameAz: "Balıq (qurudulmuş)", category: "fish" },
  "030635": { slug: "prawn", nameEn: "Prawn", nameAz: "Krevet", category: "fish" },
  "030695": { slug: "prawn-dried", nameEn: "Prawn (dried)", nameAz: "Krevet (qurudulmuş)", category: "fish" },
  "030722": { slug: "cockles", nameEn: "Cockles", nameAz: "İlbiz", category: "fish" },
  "030751": { slug: "octopus", nameEn: "Octopus", nameAz: "Ahtapot", category: "fish" },
  
  // Dairy
  "040120": { slug: "milk-pasteurized", nameEn: "Milk (pasteurized)", nameAz: "Süd (pasterizə edilmiş)", category: "dairy" },
  "040150": { slug: "milk-fresh", nameEn: "Milk (fresh)", nameAz: "Süd (təzə)", category: "dairy" },
  "040210": { slug: "milk-powder", nameEn: "Milk powder", nameAz: "Süd tozu", category: "dairy" },
  "040390": { slug: "kefir", nameEn: "Kefir", nameAz: "Kefir", category: "dairy" },
  "040711": { slug: "eggs", nameEn: "Eggs", nameAz: "Yumurta", category: "dairy" },
  
  // Vegetables
  "070190": { slug: "potato", nameEn: "Potato", nameAz: "Kartof", category: "vegetables" },
  "070200": { slug: "tomato", nameEn: "Tomato", nameAz: "Pomidor", category: "vegetables" },
  "070310": { slug: "onion", nameEn: "Onion", nameAz: "Soğan", category: "vegetables" },
  "070490": { slug: "cabbage", nameEn: "Cabbage", nameAz: "Kələm", category: "vegetables" },
  "070610": { slug: "carrot", nameEn: "Carrot", nameAz: "Yerkökü", category: "vegetables" },
  "070690": { slug: "radish", nameEn: "Radish", nameAz: "Turp", category: "vegetables" },
  "070700": { slug: "cucumber", nameEn: "Cucumber", nameAz: "Xiyar", category: "vegetables" },
  "070930": { slug: "eggplant", nameEn: "Eggplant", nameAz: "Badımcan", category: "vegetables" },
  "070960": { slug: "chili", nameEn: "Chili", nameAz: "Acı bibər", category: "vegetables" },
  "071310": { slug: "peas-dry", nameEn: "Peas (dry)", nameAz: "Noxud (quru)", category: "vegetables" },
  "071320": { slug: "chickpeas", nameEn: "Chickpeas", nameAz: "Noxud", category: "vegetables" },
  "071331": { slug: "beans-kidney", nameEn: "Kidney beans", nameAz: "Lobya", category: "vegetables" },
  "071332": { slug: "beans-red", nameEn: "Red beans", nameAz: "Qırmızı lobya", category: "vegetables" },
  "071335": { slug: "cowpeas", nameEn: "Cowpeas", nameAz: "Lobya (yerli)", category: "vegetables" },
  "071339": { slug: "beans", nameEn: "Beans", nameAz: "Lobya", category: "vegetables" },
  "071340": { slug: "lentils", nameEn: "Lentils", nameAz: "Mərci", category: "vegetables" },
  "071410": { slug: "cassava", nameEn: "Cassava", nameAz: "Maniok", category: "vegetables" },
  "071420": { slug: "sweet-potato", nameEn: "Sweet potato", nameAz: "Şirin kartof", category: "vegetables" },
  "071430": { slug: "yam", nameEn: "Yam", nameAz: "Yam", category: "vegetables" },
  "071440": { slug: "taro", nameEn: "Taro", nameAz: "Taro", category: "vegetables" },
  
  // Fruits
  "080131": { slug: "cashew", nameEn: "Cashew", nameAz: "Keşyu", category: "fruits" },
  "080310": { slug: "plantain", nameEn: "Plantain", nameAz: "Meyvə bananı", category: "fruits" },
  "080390": { slug: "banana", nameEn: "Banana", nameAz: "Banan", category: "fruits" },
  "080410": { slug: "dates", nameEn: "Dates", nameAz: "Xurma", category: "fruits" },
  "080430": { slug: "pineapple", nameEn: "Pineapple", nameAz: "Ananas", category: "fruits" },
  "080440": { slug: "avocado", nameEn: "Avocado", nameAz: "Avokado", category: "fruits" },
  "080450": { slug: "mango", nameEn: "Mango", nameAz: "Manqo", category: "fruits" },
  "080510": { slug: "orange", nameEn: "Orange", nameAz: "Portağal", category: "fruits" },
  "080610": { slug: "grape", nameEn: "Grape", nameAz: "Üzüm", category: "fruits" },
  "080720": { slug: "papaya", nameEn: "Papaya", nameAz: "Papaya", category: "fruits" },
  "080810": { slug: "apple", nameEn: "Apple", nameAz: "Alma", category: "fruits" },
  
  // Cereals
  "100119": { slug: "wheat", nameEn: "Wheat", nameAz: "Buğda", category: "cereals" },
  "100590": { slug: "maize", nameEn: "Maize", nameAz: "Qarğıdalı", category: "cereals" },
  "100610": { slug: "rice-paddy", nameEn: "Rice (paddy)", nameAz: "Düyü (çəltik)", category: "cereals" },
  "100630": { slug: "rice", nameEn: "Rice", nameAz: "Düyü", category: "cereals" },
  "100640": { slug: "rice-broken", nameEn: "Rice (broken)", nameAz: "Düyü (qırıq)", category: "cereals" },
  "100790": { slug: "sorghum", nameEn: "Sorghum", nameAz: "Sorqo", category: "cereals" },
  "100829": { slug: "millet", nameEn: "Millet", nameAz: "Darı", category: "cereals" },
  "100850": { slug: "quinoa", nameEn: "Quinoa", nameAz: "Kinoa", category: "cereals" },
  "100890": { slug: "teff", nameEn: "Teff", nameAz: "Teff", category: "cereals" },
  
  // Flour
  "110100": { slug: "wheat-flour", nameEn: "Wheat flour", nameAz: "Buğda unu", category: "flour" },
  "110220": { slug: "maize-flour", nameEn: "Maize flour", nameAz: "Qarğıdalı unu", category: "flour" },
  "110311": { slug: "wheat-meal", nameEn: "Wheat meal", nameAz: "Buğda yarması", category: "flour" },
  "110313": { slug: "maize-meal", nameEn: "Maize meal", nameAz: "Qarğıdalı yarması", category: "flour" },
  "110319": { slug: "sorghum-meal", nameEn: "Sorghum meal", nameAz: "Sorqo yarması", category: "flour" },
  "110620": { slug: "cassava-flour", nameEn: "Cassava flour", nameAz: "Maniok unu", category: "flour" },
  
  // Oilseeds
  "120190": { slug: "soybean", nameEn: "Soybean", nameAz: "Soya", category: "oilseeds" },
  "120242": { slug: "groundnut", nameEn: "Groundnut", nameAz: "Yer fıstığı", category: "oilseeds" },
  
  // Oils
  "150710": { slug: "soybean-oil", nameEn: "Soybean oil", nameAz: "Soya yağı", category: "oils" },
  "150810": { slug: "groundnut-oil", nameEn: "Groundnut oil", nameAz: "Fıstıq yağı", category: "oils" },
  "150920": { slug: "olive-oil", nameEn: "Olive oil", nameAz: "Zeytun yağı", category: "oils" },
  "151090": { slug: "vegetable-oil", nameEn: "Vegetable oil", nameAz: "Bitki yağı", category: "oils" },
  "151110": { slug: "palm-oil", nameEn: "Palm oil", nameAz: "Palma yağı", category: "oils" },
  "151211": { slug: "sunflower-oil-unrefined", nameEn: "Sunflower oil (unrefined)", nameAz: "Günəbaxan yağı (təmizlənməmiş)", category: "oils" },
  "151219": { slug: "sunflower-oil", nameEn: "Sunflower oil", nameAz: "Günəbaxan yağı", category: "oils" },
  "151221": { slug: "cottonseed-oil", nameEn: "Cottonseed oil", nameAz: "Pambıq yağı", category: "oils" },
  "151311": { slug: "coconut-oil", nameEn: "Coconut oil", nameAz: "Kokos yağı", category: "oils" },
  "151521": { slug: "maize-oil", nameEn: "Maize oil", nameAz: "Qarğıdalı yağı", category: "oils" },
  
  // Prepared meat
  "160100": { slug: "sausages", nameEn: "Sausages", nameAz: "Kolbasa", category: "prepared-meat" },
  
  // Sugar
  "170199": { slug: "sugar-white", nameEn: "Sugar (white)", nameAz: "Şəkər (ağ)", category: "sugar" },
  
  // Bakery
  "190211": { slug: "pasta", nameEn: "Pasta", nameAz: "Makaron", category: "bakery" },
  "190240": { slug: "couscous", nameEn: "Couscous", nameAz: "Kuskus", category: "bakery" },
  "190430": { slug: "bulgur", nameEn: "Bulgur", nameAz: "Bulğur", category: "bakery" },
  "190590": { slug: "bread", nameEn: "Bread", nameAz: "Çörək", category: "bakery" },
  
  // Preserved
  "200410": { slug: "potato-chips", nameEn: "Potato chips", nameAz: "Kartof çipsi", category: "preserved" },
};

async function createMissingGlobalProducts() {
  console.log("📦 Creating missing GlobalProducts from FPMA data...\n");
  
  let created = 0;
  let updated = 0;
  
  for (const [baseCode, productInfo] of Object.entries(fpmaToProduct)) {
    // Check if GlobalProduct exists
    let globalProduct = await prisma.globalProduct.findUnique({
      where: { slug: productInfo.slug }
    });
    
    // Get category
    const category = await prisma.globalCategory.findUnique({
      where: { slug: productInfo.category }
    });
    
    if (!category) {
      console.log(`  ⚠️ Category not found: ${productInfo.category}`);
      continue;
    }
    
    if (globalProduct) {
      // Update with FPMA code and category if not set
      if (!globalProduct.fpmaCode || !globalProduct.globalCategoryId) {
        await prisma.globalProduct.update({
          where: { id: globalProduct.id },
          data: {
            fpmaCode: globalProduct.fpmaCode || baseCode,
            globalCategoryId: globalProduct.globalCategoryId || category.id,
            hsCode: globalProduct.hsCode || baseCode,
          }
        });
        updated++;
      }
    } else {
      // Create new GlobalProduct
      globalProduct = await prisma.globalProduct.create({
        data: {
          slug: productInfo.slug,
          nameEn: productInfo.nameEn,
          nameAz: productInfo.nameAz,
          fpmaCode: baseCode,
          hsCode: baseCode,
          globalCategoryId: category.id,
          defaultUnit: "kg",
          isActive: true,
        }
      });
      created++;
      console.log(`  ✅ Created: ${productInfo.nameEn} (${productInfo.slug})`);
    }
    
    // Link FPMA Commodities to this GlobalProduct
    await prisma.fpmaCommodity.updateMany({
      where: { baseCode },
      data: { globalProductId: globalProduct.id }
    });
  }
  
  console.log(`\n📊 GlobalProducts: ${created} created, ${updated} updated`);
}

async function linkFaoProductsToGlobalProducts() {
  console.log("\n🔗 Linking FAO Products to GlobalProducts...\n");
  
  const faoProducts = await prisma.faoProduct.findMany({
    where: { globalProductId: null }
  });
  
  let linked = 0;
  
  for (const faoProduct of faoProducts) {
    // Try to find matching GlobalProduct by name similarity
    const nameLower = faoProduct.nameEn.toLowerCase();
    
    // Common name mappings
    const nameMap: Record<string, string> = {
      "apples": "apple",
      "pears": "pear",
      "peaches": "peach",
      "cherries": "cherry",
      "plums": "plum",
      "strawberries": "strawberry",
      "apricots": "apricot",
      "oranges": "orange",
      "lemons": "lemon",
      "grapes": "grape",
      "bananas": "banana",
      "tomatoes": "tomato",
      "potatoes": "potato",
      "onions": "onion",
      "cabbages": "cabbage",
      "carrots and turnips": "carrot",
      "cauliflowers and broccoli": "cauliflower",
      "cucumbers and gherkins": "cucumber",
      "peppers": "pepper",
      "wheat": "wheat",
      "maize": "maize",
      "rice, paddy": "rice-paddy",
      "rice": "rice",
      "barley": "barley",
      "sugar cane": "sugar-cane",
      "sugar beet": "sugar-beet",
      "soybeans": "soybean",
      "groundnuts": "groundnut",
      "sunflower seed": "sunflower-seed",
      "olives": "olive",
      "meat": "beef",
      "eggs": "eggs",
      "milk": "milk-fresh",
    };
    
    let slug: string | null = null;
    
    for (const [key, value] of Object.entries(nameMap)) {
      if (nameLower.includes(key)) {
        slug = value;
        break;
      }
    }
    
    if (slug) {
      const globalProduct = await prisma.globalProduct.findUnique({ where: { slug } });
      if (globalProduct) {
        await prisma.faoProduct.update({
          where: { id: faoProduct.id },
          data: { globalProductId: globalProduct.id }
        });
        linked++;
      }
    }
  }
  
  console.log(`  ✅ Linked ${linked}/${faoProducts.length} FAO Products`);
}

async function linkEuProductsToGlobalProducts() {
  console.log("\n🔗 Linking EU Products to GlobalProducts...\n");
  
  const euProducts = await prisma.euProduct.findMany({
    where: { globalProductId: null }
  });
  
  let linked = 0;
  
  for (const euProduct of euProducts) {
    const nameLower = euProduct.nameEn.toLowerCase();
    
    // Common name mappings for EU products
    const nameMap: Record<string, string> = {
      "apples": "apple",
      "pears": "pear",
      "peaches": "peach",
      "cherries": "cherry",
      "plums": "plum",
      "strawberries": "strawberry",
      "apricots": "apricot",
      "oranges": "orange",
      "lemons": "lemon",
      "grapes": "grape",
      "tomatoes": "tomato",
      "potatoes": "potato",
      "onions": "onion",
      "cabbages": "cabbage",
      "carrots": "carrot",
      "cauliflowers": "cauliflower",
      "cucumbers": "cucumber",
      "peppers": "pepper",
      "wheat": "wheat",
      "maize": "maize",
      "rice": "rice",
      "barley": "barley",
      "sugar": "sugar-white",
      "eggs": "eggs",
      "milk": "milk-fresh",
      "beef": "beef",
      "pork": "pork",
      "lamb": "lamb",
      "chicken": "chicken",
    };
    
    let slug: string | null = null;
    
    for (const [key, value] of Object.entries(nameMap)) {
      if (nameLower.includes(key)) {
        slug = value;
        break;
      }
    }
    
    if (slug) {
      const globalProduct = await prisma.globalProduct.findUnique({ where: { slug } });
      if (globalProduct) {
        await prisma.euProduct.update({
          where: { id: euProduct.id },
          data: { globalProductId: globalProduct.id }
        });
        linked++;
      }
    }
  }
  
  console.log(`  ✅ Linked ${linked}/${euProducts.length} EU Products`);
}

async function linkAzProductsToGlobalProducts() {
  console.log("\n🔗 Checking AZ Products linkage...\n");
  
  const azProducts = await prisma.product.findMany({
    where: { globalProductId: { not: null } }
  });
  
  const unlinked = await prisma.product.findMany({
    where: { globalProductId: null }
  });
  
  console.log(`  ✅ ${azProducts.length} AZ Products already linked`);
  console.log(`  ⚠️ ${unlinked.length} AZ Products not linked`);
  
  // Try to link unlinked products
  let linked = 0;
  for (const product of unlinked) {
    const globalProduct = await prisma.globalProduct.findUnique({
      where: { slug: product.slug }
    });
    
    if (globalProduct) {
      await prisma.product.update({
        where: { id: product.id },
        data: { globalProductId: globalProduct.id }
      });
      linked++;
    }
  }
  
  if (linked > 0) {
    console.log(`  ✅ Linked ${linked} more AZ Products`);
  }
}

async function updateGlobalCategoryLinks() {
  console.log("\n🔗 Updating GlobalCategory links for all GlobalProducts...\n");
  
  const products = await prisma.globalProduct.findMany({
    where: { globalCategoryId: null }
  });
  
  let updated = 0;
  
  for (const product of products) {
    // Determine category from HS code
    const hsCode = product.hsCode || product.fpmaCode;
    if (!hsCode) continue;
    
    const hs2 = hsCode.substring(0, 2);
    const categorySlug = hsToCategory[hs2];
    
    if (categorySlug) {
      const category = await prisma.globalCategory.findUnique({
        where: { slug: categorySlug }
      });
      
      if (category) {
        await prisma.globalProduct.update({
          where: { id: product.id },
          data: { globalCategoryId: category.id }
        });
        updated++;
      }
    }
  }
  
  console.log(`  ✅ Updated ${updated} GlobalProducts with category`);
}

async function main() {
  try {
    await createMissingGlobalProducts();
    await linkFaoProductsToGlobalProducts();
    await linkEuProductsToGlobalProducts();
    await linkAzProductsToGlobalProducts();
    await updateGlobalCategoryLinks();
    
    // Final stats
    console.log("\n📊 Final Statistics:");
    const gpCount = await prisma.globalProduct.count();
    const gpWithCategory = await prisma.globalProduct.count({ where: { globalCategoryId: { not: null } } });
    const fpmaLinked = await prisma.fpmaCommodity.count({ where: { globalProductId: { not: null } } });
    const fpmaTotal = await prisma.fpmaCommodity.count();
    const faoLinked = await prisma.faoProduct.count({ where: { globalProductId: { not: null } } });
    const faoTotal = await prisma.faoProduct.count();
    const euLinked = await prisma.euProduct.count({ where: { globalProductId: { not: null } } });
    const euTotal = await prisma.euProduct.count();
    const azLinked = await prisma.product.count({ where: { globalProductId: { not: null } } });
    const azTotal = await prisma.product.count();
    
    console.log(`  GlobalProducts: ${gpCount} (${gpWithCategory} with category)`);
    console.log(`  FPMA Commodities: ${fpmaLinked}/${fpmaTotal} linked`);
    console.log(`  FAO Products: ${faoLinked}/${faoTotal} linked`);
    console.log(`  EU Products: ${euLinked}/${euTotal} linked`);
    console.log(`  AZ Products: ${azLinked}/${azTotal} linked`);
    
    console.log("\n🎉 Category and Product linking completed!");
  } catch (error) {
    console.error("Error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

