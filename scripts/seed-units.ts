import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const units = [
  {
    code: "kg",
    nameAz: "Kiloqram",
    nameEn: "Kilogram",
    nameRu: "Килограмм",
    symbol: "kg",
    baseUnit: "kg",
    conversionRate: 1, // 1 kg = 1 kg
    category: "weight",
    isActive: true,
  },
  {
    code: "100kg",
    nameAz: "100 Kiloqram",
    nameEn: "100 Kilograms",
    nameRu: "100 Килограмм",
    symbol: "100kg",
    baseUnit: "kg",
    conversionRate: 0.01, // 1 kg = 0.01 * 100kg (price per 100kg = price per kg / 0.01)
    category: "weight",
    isActive: true,
  },
  {
    code: "ton",
    nameAz: "Ton",
    nameEn: "Tonne",
    nameRu: "Тонна",
    symbol: "t",
    baseUnit: "kg",
    conversionRate: 0.001, // 1 kg = 0.001 ton (price per ton = price per kg / 0.001)
    category: "weight",
    isActive: true,
  },
  {
    code: "lb",
    nameAz: "Funt",
    nameEn: "Pound",
    nameRu: "Фунт",
    symbol: "lb",
    baseUnit: "kg",
    conversionRate: 2.20462, // 1 kg = 2.20462 lb (price per lb = price per kg / 2.20462)
    category: "weight",
    isActive: true,
  },
  {
    code: "g",
    nameAz: "Qram",
    nameEn: "Gram",
    nameRu: "Грамм",
    symbol: "g",
    baseUnit: "kg",
    conversionRate: 1000, // 1 kg = 1000 g (price per g = price per kg / 1000)
    category: "weight",
    isActive: true,
  },
  {
    code: "l",
    nameAz: "Litr",
    nameEn: "Liter",
    nameRu: "Литр",
    symbol: "L",
    baseUnit: "l",
    conversionRate: 1,
    category: "volume",
    isActive: true,
  },
  {
    code: "100l",
    nameAz: "100 Litr",
    nameEn: "100 Liters",
    nameRu: "100 Литров",
    symbol: "100L",
    baseUnit: "l",
    conversionRate: 0.01,
    category: "volume",
    isActive: true,
  },
  {
    code: "piece",
    nameAz: "Ədəd",
    nameEn: "Piece",
    nameRu: "Штука",
    symbol: "ədəd",
    baseUnit: "piece",
    conversionRate: 1,
    category: "piece",
    isActive: true,
  },
];

async function main() {
  console.log("🔧 Seeding units...");

  for (const unit of units) {
    await prisma.unit.upsert({
      where: { code: unit.code },
      update: unit,
      create: unit,
    });
    console.log(`  ✓ ${unit.code}: ${unit.nameAz} (rate: ${unit.conversionRate})`);
  }

  console.log("\n✅ Units seeded successfully!");
  
  // Verify
  const count = await prisma.unit.count();
  console.log(`Total units in database: ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
