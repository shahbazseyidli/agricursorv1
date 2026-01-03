import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Create Azerbaijan
  const azerbaijan = await prisma.country.upsert({
    where: { iso2: "AZ" },
    update: {},
    create: {
      iso2: "AZ",
      name: "Azərbaycan",
      nameEn: "Azerbaijan",
      nameRu: "Азербайджан",
    },
  });
  console.log("✅ Country created:", azerbaijan.name);

  // 2. Create Market Types (4 fixed types)
  const marketTypes = [
    { code: "WHOLESALE", nameAz: "Topdansatış", nameEn: "Wholesale", nameRu: "Оптовая" },
    { code: "PROCESSING", nameAz: "Müəssisə tərəfindən alış", nameEn: "Processing", nameRu: "Закупка предприятием" },
    { code: "RETAIL", nameAz: "Pərakəndə satış", nameEn: "Retail", nameRu: "Розничная" },
    { code: "FIELD", nameAz: "Sahədən satış", nameEn: "Field", nameRu: "Полевая продажа" },
  ];

  for (const mt of marketTypes) {
    await prisma.marketType.upsert({
      where: { code: mt.code },
      update: {},
      create: {
        code: mt.code,
        nameAz: mt.nameAz,
        nameEn: mt.nameEn,
        nameRu: mt.nameRu,
        countryId: azerbaijan.id,
      },
    });
  }
  console.log("✅ Market types created");

  // 3. Create sample categories
  const categories = [
    { name: "Meyvə", nameEn: "Fruits", slug: "fruits" },
    { name: "Tərəvəz", nameEn: "Vegetables", slug: "vegetables" },
    { name: "Bostan", nameEn: "Melons", slug: "melons" },
    { name: "Taxıl", nameEn: "Grains", slug: "grains" },
    { name: "Paxlalılar", nameEn: "Legumes", slug: "legumes" },
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { countryId_slug: { countryId: azerbaijan.id, slug: cat.slug } },
      update: {},
      create: {
        name: cat.name,
        nameEn: cat.nameEn,
        slug: cat.slug,
        countryId: azerbaijan.id,
      },
    });
    categoryMap[cat.slug] = created.id;
  }
  console.log("✅ Categories created");

  // 4. Create sample products
  const products = [
    { name: "Alma", nameEn: "Apple", slug: "apple", category: "fruits" },
    { name: "Armud", nameEn: "Pear", slug: "pear", category: "fruits" },
    { name: "Üzüm", nameEn: "Grape", slug: "grape", category: "fruits" },
    { name: "Nar", nameEn: "Pomegranate", slug: "pomegranate", category: "fruits" },
    { name: "Pomidor", nameEn: "Tomato", slug: "tomato", category: "vegetables" },
    { name: "Xiyar", nameEn: "Cucumber", slug: "cucumber", category: "vegetables" },
    { name: "Kartof", nameEn: "Potato", slug: "potato", category: "vegetables" },
    { name: "Soğan", nameEn: "Onion", slug: "onion", category: "vegetables" },
    { name: "Qarpız", nameEn: "Watermelon", slug: "watermelon", category: "melons" },
    { name: "Yemiş", nameEn: "Melon", slug: "melon", category: "melons" },
    { name: "Buğda", nameEn: "Wheat", slug: "wheat", category: "grains" },
    { name: "Arpa", nameEn: "Barley", slug: "barley", category: "grains" },
  ];

  const productMap: Record<string, string> = {};
  for (const prod of products) {
    const created = await prisma.product.upsert({
      where: { countryId_slug: { countryId: azerbaijan.id, slug: prod.slug } },
      update: {},
      create: {
        name: prod.name,
        nameEn: prod.nameEn,
        slug: prod.slug,
        unit: "kg",
        countryId: azerbaijan.id,
        categoryId: categoryMap[prod.category],
      },
    });
    productMap[prod.slug] = created.id;
  }
  console.log("✅ Products created");

  // 5. Create sample markets
  const wholesaleType = await prisma.marketType.findFirst({ where: { code: "WHOLESALE" } });
  
  const markets = [
    "Oğuz",
    "Şəki",
    "Qəbələ",
    "Zaqatala",
    "Balakən",
    "Lənkəran",
    "Masallı",
    "Quba",
    "Qusar",
    "İsmayıllı",
  ];

  const marketMap: Record<string, string> = {};
  for (const marketName of markets) {
    const created = await prisma.market.upsert({
      where: {
        countryId_marketTypeId_name: {
          countryId: azerbaijan.id,
          marketTypeId: wholesaleType!.id,
          name: marketName,
        },
      },
      update: {},
      create: {
        name: marketName,
        countryId: azerbaijan.id,
        marketTypeId: wholesaleType!.id,
      },
    });
    marketMap[marketName] = created.id;
  }
  console.log("✅ Markets created");

  // 6. Create sample price data
  const samplePrices = [];
  const startDate = new Date("2024-01-01");
  const endDate = new Date("2024-12-31");
  
  for (const [productSlug, productId] of Object.entries(productMap)) {
    for (const [marketName, marketId] of Object.entries(marketMap)) {
      // Generate weekly prices
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const basePrice = Math.random() * 2 + 0.5; // 0.5 - 2.5 AZN base
        const variation = basePrice * 0.2; // 20% variation
        
        samplePrices.push({
          countryId: azerbaijan.id,
          productId: productId,
          marketId: marketId,
          date: new Date(currentDate),
          priceMin: Math.round((basePrice - variation) * 100) / 100,
          priceAvg: Math.round(basePrice * 100) / 100,
          priceMax: Math.round((basePrice + variation) * 100) / 100,
          unit: "kg",
          currency: "AZN",
          source: "agro.gov.az",
        });
        
        // Move to next week
        currentDate.setDate(currentDate.getDate() + 7);
      }
    }
  }

  // Insert prices in batches (SQLite doesn't support skipDuplicates)
  const batchSize = 100;
  let insertedCount = 0;
  for (let i = 0; i < samplePrices.length; i += batchSize) {
    const batch = samplePrices.slice(i, i + batchSize);
    try {
      await prisma.price.createMany({
        data: batch,
      });
      insertedCount += batch.length;
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`✅ ${insertedCount} price records created`);

  // 7. Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@agriprice.az" },
    update: {},
    create: {
      email: "admin@agriprice.az",
      password: hashedPassword,
      name: "Admin",
      role: "ADMIN",
    },
  });
  console.log("✅ Admin user created:", admin.email);

  // 8. Create sample user
  const userPassword = await bcrypt.hash("user123", 12);
  const user = await prisma.user.upsert({
    where: { email: "user@agriprice.az" },
    update: {},
    create: {
      email: "user@agriprice.az",
      password: userPassword,
      name: "Test User",
      role: "USER",
    },
  });
  console.log("✅ Test user created:", user.email);

  console.log("🎉 Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
