/**
 * Seed Global Categories (HS2 based)
 * Based on FPMA commodity classifications
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const GLOBAL_CATEGORIES = [
  {
    code: "01",
    slug: "live-animals",
    nameEn: "Live Animals",
    nameAz: "Canlı heyvanlar",
    nameRu: "Живые животные",
    description: "Live sheep, goats, cattle, camels",
    icon: "🐄",
    sortOrder: 1,
  },
  {
    code: "02",
    slug: "meat",
    nameEn: "Meat & Meat Products",
    nameAz: "Ət və ət məhsulları",
    nameRu: "Мясо и мясные продукты",
    description: "Beef, chicken, mutton, pork, lamb",
    icon: "🥩",
    sortOrder: 2,
  },
  {
    code: "03",
    slug: "fish",
    nameEn: "Fish & Seafood",
    nameAz: "Balıq və dəniz məhsulları",
    nameRu: "Рыба и морепродукты",
    description: "Fish, prawns, seafood",
    icon: "🐟",
    sortOrder: 3,
  },
  {
    code: "04",
    slug: "dairy",
    nameEn: "Dairy & Eggs",
    nameAz: "Süd və yumurta",
    nameRu: "Молочные продукты и яйца",
    description: "Milk, eggs, kefir, cheese",
    icon: "🥛",
    sortOrder: 4,
  },
  {
    code: "07",
    slug: "vegetables",
    nameEn: "Vegetables",
    nameAz: "Tərəvəzlər",
    nameRu: "Овощи",
    description: "Potatoes, onions, tomatoes, cabbage, carrots",
    icon: "🥕",
    sortOrder: 7,
  },
  {
    code: "08",
    slug: "fruits",
    nameEn: "Fruits & Nuts",
    nameAz: "Meyvələr və qoz-fındıq",
    nameRu: "Фрукты и орехи",
    description: "Apples, bananas, oranges, grapes, mangoes",
    icon: "🍎",
    sortOrder: 8,
  },
  {
    code: "10",
    slug: "cereals",
    nameEn: "Cereals",
    nameAz: "Taxıl",
    nameRu: "Зерновые",
    description: "Wheat, rice, maize, sorghum, millet",
    icon: "🌾",
    sortOrder: 10,
  },
  {
    code: "11",
    slug: "flour",
    nameEn: "Flour & Starch",
    nameAz: "Un və nişasta",
    nameRu: "Мука и крахмал",
    description: "Wheat flour, maize meal, semolina",
    icon: "🍞",
    sortOrder: 11,
  },
  {
    code: "12",
    slug: "oilseeds",
    nameEn: "Oil Seeds",
    nameAz: "Yağlı toxumlar",
    nameRu: "Масличные семена",
    description: "Soya beans, groundnuts, sunflower seeds",
    icon: "🥜",
    sortOrder: 12,
  },
  {
    code: "15",
    slug: "oils",
    nameEn: "Oils & Fats",
    nameAz: "Yağlar",
    nameRu: "Масла и жиры",
    description: "Vegetable oil, sunflower oil, palm oil, olive oil",
    icon: "🫒",
    sortOrder: 15,
  },
  {
    code: "16",
    slug: "prepared-meat",
    nameEn: "Prepared Meat & Fish",
    nameAz: "Hazır ət və balıq",
    nameRu: "Готовое мясо и рыба",
    description: "Sausages, canned meat, processed fish",
    icon: "🌭",
    sortOrder: 16,
  },
  {
    code: "17",
    slug: "sugar",
    nameEn: "Sugar",
    nameAz: "Şəkər",
    nameRu: "Сахар",
    description: "Sugar, honey, syrups",
    icon: "🍬",
    sortOrder: 17,
  },
  {
    code: "19",
    slug: "bakery",
    nameEn: "Bakery & Pasta",
    nameAz: "Çörək və makaron",
    nameRu: "Хлеб и макароны",
    description: "Bread, pasta, noodles, tortillas, couscous",
    icon: "🥖",
    sortOrder: 19,
  },
  {
    code: "20",
    slug: "preserved",
    nameEn: "Preserved Foods",
    nameAz: "Konservlər",
    nameRu: "Консервы",
    description: "Canned vegetables, fruits, jams",
    icon: "🥫",
    sortOrder: 20,
  },
];

async function main() {
  console.log("🌱 Seeding Global Categories...\n");

  for (const cat of GLOBAL_CATEGORIES) {
    const result = await prisma.globalCategory.upsert({
      where: { code: cat.code },
      update: {
        nameEn: cat.nameEn,
        nameAz: cat.nameAz,
        nameRu: cat.nameRu,
        description: cat.description,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
      },
      create: cat,
    });
    console.log(`  ✓ ${result.icon} ${result.nameEn} (${result.code})`);
  }

  console.log(`\n✅ Created/Updated ${GLOBAL_CATEGORIES.length} global categories`);

  // Link existing local categories to global categories
  console.log("\n🔗 Linking local categories to global categories...");

  const categoryMappings = [
    { localSlug: "meyve", globalCode: "08" }, // Meyvə → Fruits
    { localSlug: "terevez", globalCode: "07" }, // Tərəvəz → Vegetables
    { localSlug: "fruits", globalCode: "08" },
    { localSlug: "vegetables", globalCode: "07" },
  ];

  for (const mapping of categoryMappings) {
    const globalCat = await prisma.globalCategory.findUnique({
      where: { code: mapping.globalCode },
    });

    if (globalCat) {
      const updated = await prisma.category.updateMany({
        where: { slug: mapping.localSlug },
        data: { globalCategoryId: globalCat.id },
      });

      if (updated.count > 0) {
        console.log(`  ✓ Linked "${mapping.localSlug}" → ${globalCat.nameEn}`);
      }
    }
  }

  // Link GlobalProducts to GlobalCategories
  console.log("\n🔗 Linking GlobalProducts to GlobalCategories...");

  const productCategoryMappings: { categoryString: string; globalCode: string }[] = [
    { categoryString: "Fruits", globalCode: "08" },
    { categoryString: "Vegetables", globalCode: "07" },
    { categoryString: "Meyvələr", globalCode: "08" },
    { categoryString: "Tərəvəzlər", globalCode: "07" },
  ];

  for (const mapping of productCategoryMappings) {
    const globalCat = await prisma.globalCategory.findUnique({
      where: { code: mapping.globalCode },
    });

    if (globalCat) {
      const updated = await prisma.globalProduct.updateMany({
        where: { category: mapping.categoryString },
        data: { globalCategoryId: globalCat.id },
      });

      if (updated.count > 0) {
        console.log(`  ✓ Linked ${updated.count} products with category "${mapping.categoryString}" → ${globalCat.nameEn}`);
      }
    }
  }

  console.log("\n✅ Category seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




