// Seed script to initialize currencies
// Run with: npx ts-node scripts/seed-currencies.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const currencies = [
  {
    code: "AZN",
    symbol: "₼",
    nameAz: "Azərbaycan Manatı",
    nameEn: "Azerbaijani Manat",
    nameRu: "Азербайджанский манат",
    rateToAZN: 1,
    isBase: true,
    isActive: true,
  },
  {
    code: "USD",
    symbol: "$",
    nameAz: "ABŞ Dolları",
    nameEn: "US Dollar",
    nameRu: "Доллар США",
    rateToAZN: 0.588, // 1 AZN = 0.588 USD (approximate)
    isBase: false,
    isActive: true,
  },
  {
    code: "EUR",
    symbol: "€",
    nameAz: "Avro",
    nameEn: "Euro",
    nameRu: "Евро",
    rateToAZN: 0.54, // 1 AZN = 0.54 EUR (approximate)
    isBase: false,
    isActive: true,
  },
  {
    code: "RUB",
    symbol: "₽",
    nameAz: "Rusiya Rublu",
    nameEn: "Russian Ruble",
    nameRu: "Российский рубль",
    rateToAZN: 53.5, // 1 AZN = 53.5 RUB (approximate)
    isBase: false,
    isActive: true,
  },
  {
    code: "TRY",
    symbol: "₺",
    nameAz: "Türk Lirəsi",
    nameEn: "Turkish Lira",
    nameRu: "Турецкая лира",
    rateToAZN: 20.1, // 1 AZN = 20.1 TRY (approximate)
    isBase: false,
    isActive: true,
  },
  {
    code: "GBP",
    symbol: "£",
    nameAz: "Britaniya Funtu",
    nameEn: "British Pound",
    nameRu: "Британский фунт",
    rateToAZN: 0.47, // 1 AZN = 0.47 GBP (approximate)
    isBase: false,
    isActive: true,
  },
];

async function main() {
  console.log("Seeding currencies...");

  for (const currency of currencies) {
    const result = await prisma.currency.upsert({
      where: { code: currency.code },
      update: {
        symbol: currency.symbol,
        nameAz: currency.nameAz,
        nameEn: currency.nameEn,
        nameRu: currency.nameRu,
        rateToAZN: currency.rateToAZN,
        isBase: currency.isBase,
        isActive: currency.isActive,
        lastUpdated: new Date(),
      },
      create: {
        ...currency,
        lastUpdated: new Date(),
      },
    });
    console.log(`  ✓ ${result.code}: ${result.symbol} (rate: ${result.rateToAZN})`);
  }

  console.log("\n✅ Currencies seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding currencies:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });







