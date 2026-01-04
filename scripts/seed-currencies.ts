// Seed script to initialize currencies (USD-based)
// Run with: npx ts-node scripts/seed-currencies.ts
// 
// NOTE: This script is now obsolete. Use the API instead:
// POST /api/currencies/update-rates
// This will fetch all 166+ currencies from ExchangeRate-API

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// USD-based rates: 1 USD = X of this currency
const currencies = [
  {
    code: "USD",
    symbol: "$",
    nameAz: "ABŞ Dolları",
    nameEn: "US Dollar",
    nameRu: "Доллар США",
    rateToUSD: 1,
    isBase: true,
    isActive: true,
  },
  {
    code: "EUR",
    symbol: "€",
    nameAz: "Avro",
    nameEn: "Euro",
    nameRu: "Евро",
    rateToUSD: 0.92, // 1 USD = 0.92 EUR
    isBase: false,
    isActive: true,
  },
  {
    code: "AZN",
    symbol: "₼",
    nameAz: "Azərbaycan Manatı",
    nameEn: "Azerbaijani Manat",
    nameRu: "Азербайджанский манат",
    rateToUSD: 1.70, // 1 USD = 1.70 AZN
    isBase: false,
    isActive: true,
  },
  {
    code: "RUB",
    symbol: "₽",
    nameAz: "Rusiya Rublu",
    nameEn: "Russian Ruble",
    nameRu: "Российский рубль",
    rateToUSD: 90.0, // 1 USD = 90 RUB
    isBase: false,
    isActive: true,
  },
  {
    code: "TRY",
    symbol: "₺",
    nameAz: "Türk Lirəsi",
    nameEn: "Turkish Lira",
    nameRu: "Турецкая лира",
    rateToUSD: 32.0, // 1 USD = 32 TRY
    isBase: false,
    isActive: true,
  },
  {
    code: "GBP",
    symbol: "£",
    nameAz: "Britaniya Funtu",
    nameEn: "British Pound",
    nameRu: "Британский фунт",
    rateToUSD: 0.79, // 1 USD = 0.79 GBP
    isBase: false,
    isActive: true,
  },
];

async function main() {
  console.log("Seeding currencies (USD-based)...");

  for (const currency of currencies) {
    const result = await prisma.currency.upsert({
      where: { code: currency.code },
      update: {
        symbol: currency.symbol,
        nameAz: currency.nameAz,
        nameEn: currency.nameEn,
        nameRu: currency.nameRu,
        rateToUSD: currency.rateToUSD,
        isBase: currency.isBase,
        isActive: currency.isActive,
        lastUpdated: new Date(),
      },
      create: {
        ...currency,
        lastUpdated: new Date(),
      },
    });
    console.log(`  ✓ ${result.code}: ${result.symbol} (rate: 1 USD = ${result.rateToUSD} ${result.code})`);
  }

  console.log("\n✅ Currencies seeded successfully!");
  console.log("\n💡 Tip: Run POST /api/currencies/update-rates to fetch all 166+ currencies from API");
}

main()
  .catch((e) => {
    console.error("Error seeding currencies:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
