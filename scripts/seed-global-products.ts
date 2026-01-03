/**
 * Global Products Seed Script
 * Creates universal product mappings and links local/EU products
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Global product definitions with translations
const GLOBAL_PRODUCTS = [
  // Fruits
  { slug: "apple", nameEn: "Apple", nameAz: "Alma", nameRu: "Яблоко", category: "Fruits", eurostatCode: "06110000" },
  { slug: "pear", nameEn: "Pear", nameAz: "Armud", nameRu: "Груша", category: "Fruits", eurostatCode: "06120000" },
  { slug: "peach", nameEn: "Peach", nameAz: "Şaftalı", nameRu: "Персик", category: "Fruits", eurostatCode: "06130000" },
  { slug: "cherry", nameEn: "Cherry", nameAz: "Gilas", nameRu: "Вишня", category: "Fruits", eurostatCode: "06191100" },
  { slug: "plum", nameEn: "Plum", nameAz: "Gavalı", nameRu: "Слива", category: "Fruits", eurostatCode: "06192000" },
  { slug: "strawberry", nameEn: "Strawberry", nameAz: "Çiyələk", nameRu: "Клубника", category: "Fruits", eurostatCode: "06193000" },
  { slug: "apricot", nameEn: "Apricot", nameAz: "Ərik", nameRu: "Абрикос", category: "Fruits", eurostatCode: "06199100" },
  { slug: "orange", nameEn: "Orange", nameAz: "Portağal", nameRu: "Апельсин", category: "Fruits", eurostatCode: "06210000" },
  { slug: "mandarin", nameEn: "Mandarin", nameAz: "Mandarin", nameRu: "Мандарин", category: "Fruits", eurostatCode: "06220000" },
  { slug: "lemon", nameEn: "Lemon", nameAz: "Limon", nameRu: "Лимон", category: "Fruits", eurostatCode: "06230000" },
  { slug: "grape", nameEn: "Grape", nameAz: "Üzüm", nameRu: "Виноград", category: "Fruits", eurostatCode: "06410000" },
  { slug: "watermelon", nameEn: "Watermelon", nameAz: "Qarpız", nameRu: "Арбуз", category: "Fruits" },
  { slug: "melon", nameEn: "Melon", nameAz: "Yemiş", nameRu: "Дыня", category: "Fruits" },
  { slug: "pomegranate", nameEn: "Pomegranate", nameAz: "Nar", nameRu: "Гранат", category: "Fruits" },
  { slug: "quince", nameEn: "Quince", nameAz: "Heyva", nameRu: "Айва", category: "Fruits" },
  { slug: "fig", nameEn: "Fig", nameAz: "Əncir", nameRu: "Инжир", category: "Fruits" },
  { slug: "persimmon", nameEn: "Persimmon", nameAz: "Xurma", nameRu: "Хурма", category: "Fruits" },
  { slug: "kiwi", nameEn: "Kiwi", nameAz: "Kivi", nameRu: "Киви", category: "Fruits" },
  { slug: "banana", nameEn: "Banana", nameAz: "Banan", nameRu: "Банан", category: "Fruits" },
  { slug: "feijoa", nameEn: "Feijoa", nameAz: "Feyxoa", nameRu: "Фейхоа", category: "Fruits" },
  { slug: "hazelnut", nameEn: "Hazelnut", nameAz: "Fındıq", nameRu: "Фундук", category: "Fruits" },
  { slug: "walnut", nameEn: "Walnut", nameAz: "Qoz", nameRu: "Грецкий орех", category: "Fruits" },
  { slug: "almond", nameEn: "Almond", nameAz: "Badam", nameRu: "Миндаль", category: "Fruits" },
  
  // Vegetables
  { slug: "tomato", nameEn: "Tomato", nameAz: "Pomidor", nameRu: "Помидор", category: "Vegetables", eurostatCode: "04121000" },
  { slug: "cucumber", nameEn: "Cucumber", nameAz: "Xiyar", nameRu: "Огурец", category: "Vegetables", eurostatCode: "04194100" },
  { slug: "potato", nameEn: "Potato", nameAz: "Kartof", nameRu: "Картофель", category: "Vegetables", eurostatCode: "05120000" },
  { slug: "onion", nameEn: "Onion", nameAz: "Soğan", nameRu: "Лук", category: "Vegetables", eurostatCode: "04196000" },
  { slug: "carrot", nameEn: "Carrot", nameAz: "Yerkökü", nameRu: "Морковь", category: "Vegetables", eurostatCode: "04195000" },
  { slug: "cabbage", nameEn: "Cabbage", nameAz: "Kələm", nameRu: "Капуста", category: "Vegetables", eurostatCode: "04191100" },
  { slug: "cauliflower", nameEn: "Cauliflower", nameAz: "Gül kələm", nameRu: "Цветная капуста", category: "Vegetables", eurostatCode: "04110000" },
  { slug: "garlic", nameEn: "Garlic", nameAz: "Sarımsaq", nameRu: "Чеснок", category: "Vegetables", eurostatCode: "04199906" },
  { slug: "pepper", nameEn: "Pepper", nameAz: "Bibər", nameRu: "Перец", category: "Vegetables" },
  { slug: "eggplant", nameEn: "Eggplant", nameAz: "Badımcan", nameRu: "Баклажан", category: "Vegetables" },
  { slug: "radish", nameEn: "Radish", nameAz: "Turp", nameRu: "Редис", category: "Vegetables" },
  { slug: "beet", nameEn: "Beetroot", nameAz: "Çuğundur", nameRu: "Свёкла", category: "Vegetables" },
  { slug: "green-beans", nameEn: "Green Beans", nameAz: "Lobya", nameRu: "Фасоль", category: "Vegetables", eurostatCode: "04197000" },
  { slug: "green-peas", nameEn: "Green Peas", nameAz: "Noxud", nameRu: "Горох", category: "Vegetables", eurostatCode: "04199000" },
  { slug: "zucchini", nameEn: "Zucchini", nameAz: "Kabak", nameRu: "Кабачок", category: "Vegetables" },
  { slug: "pumpkin", nameEn: "Pumpkin", nameAz: "Balqabaq", nameRu: "Тыква", category: "Vegetables" },
  { slug: "leek", nameEn: "Leek", nameAz: "Kərəviz", nameRu: "Лук-порей", category: "Vegetables" },
  { slug: "spinach", nameEn: "Spinach", nameAz: "İspanaq", nameRu: "Шпинат", category: "Vegetables" },
  { slug: "lettuce", nameEn: "Lettuce", nameAz: "Salat", nameRu: "Салат", category: "Vegetables" },
];

// Dictionary for matching local AZ product names
const AZ_NAME_MAPPING: Record<string, string> = {
  "alma": "apple",
  "armud": "pear",
  "şaftalı": "peach",
  "gilas": "cherry",
  "gavalı": "plum",
  "çiyələk": "strawberry",
  "ərik": "apricot",
  "portağal": "orange",
  "mandarin": "mandarin",
  "limon": "lemon",
  "üzüm": "grape",
  "qarpız": "watermelon",
  "yemiş": "melon",
  "nar": "pomegranate",
  "heyva": "quince",
  "əncir": "fig",
  "xurma": "persimmon",
  "kivi": "kiwi",
  "banan": "banana",
  "feyxoa": "feijoa",
  "fındıq": "hazelnut",
  "qoz": "walnut",
  "badam": "almond",
  "pomidor": "tomato",
  "xiyar": "cucumber",
  "kartof": "potato",
  "soğan": "onion",
  "yerkökü": "carrot",
  "kələm": "cabbage",
  "gül kələm": "cauliflower",
  "sarımsaq": "garlic",
  "bibər": "pepper",
  "badımcan": "eggplant",
  "turp": "radish",
  "çuğundur": "beet",
  "lobya": "green-beans",
  "noxud": "green-peas",
  "kabak": "zucchini",
  "balqabaq": "pumpkin",
  "kərəviz": "leek",
  "ispanaq": "spinach",
  "salat": "lettuce",
};

// EU product name patterns for matching
const EU_NAME_PATTERNS: Record<string, string[]> = {
  "apple": ["apple", "apples", "dessert apple"],
  "pear": ["pear", "pears", "dessert pear"],
  "peach": ["peach", "peaches", "nectarine"],
  "cherry": ["cherry", "cherries", "sweet cherries"],
  "plum": ["plum", "plums"],
  "strawberry": ["strawberry", "strawberries"],
  "apricot": ["apricot", "apricots"],
  "orange": ["orange", "oranges"],
  "mandarin": ["mandarin", "mandarins", "tangerine", "clementine"],
  "lemon": ["lemon", "lemons"],
  "grape": ["grape", "grapes", "dessert grape"],
  "tomato": ["tomato", "tomatoes"],
  "cucumber": ["cucumber", "cucumbers"],
  "potato": ["potato", "potatoes", "main crop potato"],
  "onion": ["onion", "onions"],
  "carrot": ["carrot", "carrots"],
  "cabbage": ["cabbage", "white cabbage"],
  "cauliflower": ["cauliflower", "cauliflowers"],
  "garlic": ["garlic"],
  "green-beans": ["green bean", "green beans"],
  "green-peas": ["green pea", "green peas"],
};

async function main() {
  console.log("=".repeat(50));
  console.log("Global Products Seed Script");
  console.log("=".repeat(50));
  
  // Step 1: Create Global Products
  console.log("\n1. Creating global products...");
  for (const product of GLOBAL_PRODUCTS) {
    await prisma.globalProduct.upsert({
      where: { slug: product.slug },
      update: { 
        nameEn: product.nameEn, 
        nameAz: product.nameAz, 
        nameRu: product.nameRu, 
        category: product.category,
        eurostatCode: product.eurostatCode
      },
      create: { ...product, isActive: true },
    });
  }
  console.log(`✓ ${GLOBAL_PRODUCTS.length} global products created`);
  
  // Step 2: Link AZ Products to Global Products
  console.log("\n2. Linking AZ products to global products...");
  const azProducts = await prisma.product.findMany();
  let linkedAz = 0;
  
  for (const product of azProducts) {
    const productName = product.name.toLowerCase().trim();
    const globalSlug = AZ_NAME_MAPPING[productName];
    
    if (globalSlug) {
      const globalProduct = await prisma.globalProduct.findUnique({
        where: { slug: globalSlug }
      });
      
      if (globalProduct) {
        await prisma.product.update({
          where: { id: product.id },
          data: { globalProductId: globalProduct.id }
        });
        linkedAz++;
      }
    }
  }
  console.log(`✓ ${linkedAz}/${azProducts.length} AZ products linked`);
  
  // Step 3: Link EU Products to Global Products and update translations
  console.log("\n3. Linking EU products to global products...");
  const euProducts = await prisma.euProduct.findMany();
  let linkedEu = 0;
  
  for (const euProduct of euProducts) {
    const euName = (euProduct.nameEn || euProduct.ecAgrifoodCode || "").toLowerCase();
    
    // Find matching global product
    for (const [slug, patterns] of Object.entries(EU_NAME_PATTERNS)) {
      const matched = patterns.some(pattern => euName.includes(pattern));
      
      if (matched) {
        const globalProduct = await prisma.globalProduct.findUnique({
          where: { slug }
        });
        
        if (globalProduct) {
          await prisma.euProduct.update({
            where: { id: euProduct.id },
            data: { 
              globalProductId: globalProduct.id,
              nameAz: globalProduct.nameAz, // Set AZ translation from global
              nameRu: globalProduct.nameRu  // Set RU translation from global
            }
          });
          linkedEu++;
          break;
        }
      }
    }
  }
  console.log(`✓ ${linkedEu}/${euProducts.length} EU products linked`);
  
  // Final stats
  const stats = {
    globalProducts: await prisma.globalProduct.count(),
    linkedAzProducts: await prisma.product.count({ where: { globalProductId: { not: null } } }),
    linkedEuProducts: await prisma.euProduct.count({ where: { globalProductId: { not: null } } }),
  };
  
  console.log("\n" + "=".repeat(50));
  console.log("Seed Complete!");
  console.log("=".repeat(50));
  console.log(`Global Products: ${stats.globalProducts}`);
  console.log(`Linked AZ Products: ${stats.linkedAzProducts}`);
  console.log(`Linked EU Products: ${stats.linkedEuProducts}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());


