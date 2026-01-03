/**
 * Update Units with FPMA aliases for mapping
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// FPMA Unit mappings
const UNIT_UPDATES = [
  {
    code: "kg",
    fpmaAliases: JSON.stringify(["Kg", "1 kg", "kg", "1.1 Kg"]),
  },
  {
    code: "100kg",
    fpmaAliases: JSON.stringify(["100 kg", "100 Kg"]),
  },
  {
    code: "ton",
    fpmaAliases: JSON.stringify(["tonne", "ton"]),
  },
  {
    code: "lb",
    fpmaAliases: JSON.stringify(["lb", "Libra", "6 lbs"]),
  },
  {
    code: "g",
    fpmaAliases: JSON.stringify(["100 gms", "240 gms", "400 gms", "500 gms", "700 gms", "720 gms", "750 gms", "800 gms", "810 gms", "85 gms", "900 gms"]),
  },
  {
    code: "l",
    fpmaAliases: JSON.stringify(["Liter", "0.9 Liter", "1.5 Liter", "1.8 Liter", "2 Liters", "5 Liter", "500 ml", "750 ml", "100 liters"]),
  },
];

// New units to create (FPMA specific)
const NEW_UNITS = [
  {
    code: "0.5kg",
    nameAz: "0.5 kq",
    nameEn: "0.5 kg",
    symbol: "0.5kg",
    baseUnit: "kg",
    conversionRate: 0.5,
    category: "weight",
    fpmaAliases: JSON.stringify(["0.5 kg"]),
  },
  {
    code: "2kg",
    nameAz: "2 kq",
    nameEn: "2 kg",
    symbol: "2kg",
    baseUnit: "kg",
    conversionRate: 2,
    category: "weight",
    fpmaAliases: JSON.stringify(["2 kg", "2 Kg"]),
  },
  {
    code: "2.5kg",
    nameAz: "2.5 kq",
    nameEn: "2.5 kg",
    symbol: "2.5kg",
    baseUnit: "kg",
    conversionRate: 2.5,
    category: "weight",
    fpmaAliases: JSON.stringify(["2.5 kg"]),
  },
  {
    code: "3kg",
    nameAz: "3 kq",
    nameEn: "3 kg",
    symbol: "3kg",
    baseUnit: "kg",
    conversionRate: 3,
    category: "weight",
    fpmaAliases: JSON.stringify(["3 kg", "3.5 kg"]),
  },
  {
    code: "5kg",
    nameAz: "5 kq",
    nameEn: "5 kg",
    symbol: "5kg",
    baseUnit: "kg",
    conversionRate: 5,
    category: "weight",
    fpmaAliases: JSON.stringify(["5 kg"]),
  },
  {
    code: "10kg",
    nameAz: "10 kq",
    nameEn: "10 kg",
    symbol: "10kg",
    baseUnit: "kg",
    conversionRate: 10,
    category: "weight",
    fpmaAliases: JSON.stringify(["10 kg", "10 Kg"]),
  },
  {
    code: "12.5kg",
    nameAz: "12.5 kq",
    nameEn: "12.5 kg",
    symbol: "12.5kg",
    baseUnit: "kg",
    conversionRate: 12.5,
    category: "weight",
    fpmaAliases: JSON.stringify(["12.5 Kg"]),
  },
  {
    code: "20kg",
    nameAz: "20 kq",
    nameEn: "20 kg",
    symbol: "20kg",
    baseUnit: "kg",
    conversionRate: 20,
    category: "weight",
    fpmaAliases: JSON.stringify(["20 kg"]),
  },
  {
    code: "25kg",
    nameAz: "25 kq",
    nameEn: "25 kg",
    symbol: "25kg",
    baseUnit: "kg",
    conversionRate: 25,
    category: "weight",
    fpmaAliases: JSON.stringify(["25 kg"]),
  },
  {
    code: "30kg",
    nameAz: "30 kq",
    nameEn: "30 kg",
    symbol: "30kg",
    baseUnit: "kg",
    conversionRate: 30,
    category: "weight",
    fpmaAliases: JSON.stringify(["30 kg"]),
  },
  {
    code: "50kg",
    nameAz: "50 kq",
    nameEn: "50 kg",
    symbol: "50kg",
    baseUnit: "kg",
    conversionRate: 50,
    category: "weight",
    fpmaAliases: JSON.stringify(["50 kg"]),
  },
  {
    code: "60kg",
    nameAz: "60 kq",
    nameEn: "60 kg",
    symbol: "60kg",
    baseUnit: "kg",
    conversionRate: 60,
    category: "weight",
    fpmaAliases: JSON.stringify(["60 kg"]),
  },
  {
    code: "gallon",
    nameAz: "Gallon",
    nameEn: "Gallon",
    symbol: "gal",
    baseUnit: "liter",
    conversionRate: 3.785,
    category: "volume",
    fpmaAliases: JSON.stringify(["Gallon"]),
  },
  {
    code: "dozen",
    nameAz: "Düjün",
    nameEn: "Dozen",
    symbol: "dz",
    baseUnit: "piece",
    conversionRate: 12,
    category: "piece",
    fpmaAliases: JSON.stringify(["Dozen", "1/2 Dozen", "2.5 Dozen"]),
  },
  {
    code: "tray",
    nameAz: "Nimçə",
    nameEn: "Tray",
    symbol: "tray",
    baseUnit: "piece",
    conversionRate: 30, // typical egg tray
    category: "piece",
    fpmaAliases: JSON.stringify(["1 Tray"]),
  },
  // Regional units
  {
    code: "spanish_quintal",
    nameAz: "İspan kvintali",
    nameEn: "Spanish Quintal",
    symbol: "qq",
    baseUnit: "kg",
    conversionRate: 46,
    category: "weight",
    fpmaAliases: JSON.stringify(["Spanish quintal (46 kg)"]),
  },
  {
    code: "bolivian_arroba",
    nameAz: "Boliviya arrobası",
    nameEn: "Bolivian Arroba",
    symbol: "arr",
    baseUnit: "kg",
    conversionRate: 11.5,
    category: "weight",
    fpmaAliases: JSON.stringify(["Bolivian arroba (11.5 kg)"]),
  },
  {
    code: "cuartilla",
    nameAz: "Kuartilya",
    nameEn: "Cuartilla",
    symbol: "ctla",
    baseUnit: "kg",
    conversionRate: 2.88,
    category: "weight",
    fpmaAliases: JSON.stringify(["Cuartilla (2.88 kg)"]),
  },
  {
    code: "pyi",
    nameAz: "Pyi",
    nameEn: "Pyi (Myanmar)",
    symbol: "pyi",
    baseUnit: "kg",
    conversionRate: 2.13,
    category: "weight",
    fpmaAliases: JSON.stringify(["pyi (2.13 kg)"]),
  },
  {
    code: "viss",
    nameAz: "Viss",
    nameEn: "Viss (Myanmar)",
    symbol: "viss",
    baseUnit: "kg",
    conversionRate: 1.63,
    category: "weight",
    fpmaAliases: JSON.stringify(["viss (1.63 kg)"]),
  },
  {
    code: "50_libras",
    nameAz: "50 Libra",
    nameEn: "50 Libras",
    symbol: "50lb",
    baseUnit: "kg",
    conversionRate: 22.68, // 50 * 0.4536
    category: "weight",
    fpmaAliases: JSON.stringify(["50 Libras"]),
  },
  {
    code: "100_lbs",
    nameAz: "100 Funt",
    nameEn: "100 Pounds",
    symbol: "100lb",
    baseUnit: "kg",
    conversionRate: 45.36,
    category: "weight",
    fpmaAliases: JSON.stringify(["100 lbs"]),
  },
  {
    code: "3_libras",
    nameAz: "3 Libra",
    nameEn: "3 Libras",
    symbol: "3lb",
    baseUnit: "kg",
    conversionRate: 1.36, // 3 * 0.4536
    category: "weight",
    fpmaAliases: JSON.stringify(["3 Libras"]),
  },
  {
    code: "coro",
    nameAz: "Koro",
    nameEn: "Coro",
    symbol: "coro",
    baseUnit: "kg",
    conversionRate: 100, // Estimate - varies by country
    category: "weight",
    fpmaAliases: JSON.stringify(["Coro"]),
  },
];

async function main() {
  console.log("📏 Updating Units with FPMA aliases...\n");

  // Update existing units
  for (const update of UNIT_UPDATES) {
    try {
      const result = await prisma.unit.update({
        where: { code: update.code },
        data: { fpmaAliases: update.fpmaAliases },
      });
      console.log(`  ✓ Updated ${result.code} with FPMA aliases`);
    } catch (e) {
      console.log(`  ⚠ Unit ${update.code} not found, skipping`);
    }
  }

  console.log("\n📏 Creating new FPMA-specific units...\n");

  // Create new units
  for (const unit of NEW_UNITS) {
    const result = await prisma.unit.upsert({
      where: { code: unit.code },
      update: {
        fpmaAliases: unit.fpmaAliases,
        conversionRate: unit.conversionRate,
      },
      create: unit,
    });
    console.log(`  ✓ ${result.code}: ${result.nameEn} (${result.conversionRate} ${result.baseUnit})`);
  }

  console.log(`\n✅ Unit update completed!`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




