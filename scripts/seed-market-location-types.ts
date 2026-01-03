/**
 * Seed Market Location Types (Normalized from FPMA)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MARKET_LOCATION_TYPES = [
  {
    code: "NATIONAL_AVERAGE",
    nameEn: "National Average",
    nameAz: "Milli ortalama",
    description: "Country-wide average prices",
    sortOrder: 1,
    aliases: JSON.stringify([
      "National Average",
      "National average",
      "National average prices",
      "Average",
      "Average prices",
    ]),
  },
  {
    code: "CAPITAL_CITY",
    nameEn: "Capital City",
    nameAz: "Paytaxt şəhəri",
    description: "National capital city markets",
    sortOrder: 2,
    aliases: JSON.stringify([
      "National capital city",
      "National Capital city",
      "National Capital City",
      "National Capital",
      "National capital territory",
    ]),
  },
  {
    code: "REGIONAL_AVERAGE",
    nameEn: "Regional Average",
    nameAz: "Regional ortalama",
    description: "Regional/state-level average prices",
    sortOrder: 3,
    aliases: JSON.stringify([
      "Regional Average",
      "Regional average",
      "State average",
      "Provincial average",
      "Média provincial",
    ]),
  },
  {
    code: "REGIONAL_CAPITAL",
    nameEn: "Regional Capital",
    nameAz: "Regional paytaxt",
    description: "Regional/state capital city markets",
    sortOrder: 4,
    aliases: JSON.stringify([
      "Regional capital",
      "Regional capital city",
      "Regional capital market",
      "State Capital",
      "State capital",
      "Regional State Capital",
      "Region capital",
    ]),
  },
  {
    code: "PROVINCIAL",
    nameEn: "Provincial",
    nameAz: "Vilayət",
    description: "Provincial/district level markets",
    sortOrder: 5,
    aliases: JSON.stringify([
      "Provincial Capital",
      "Provincial capital",
      "Provincial market",
      "Province",
      "Capital of province",
    ]),
  },
  {
    code: "DEPARTMENT",
    nameEn: "Department/District",
    nameAz: "Rayon",
    description: "Department or district level markets",
    sortOrder: 6,
    aliases: JSON.stringify([
      "Department Capital",
      "Department capital",
      "Capital of district",
      "District",
      "District capital",
    ]),
  },
  {
    code: "CITY",
    nameEn: "City/Town",
    nameAz: "Şəhər/Qəsəbə",
    description: "Urban city or town markets",
    sortOrder: 7,
    aliases: JSON.stringify([
      "City",
      "Town",
      "Urban agglomeration",
      "Port city",
      "Charter city",
      "Regional town",
      "Prefecture-level city",
    ]),
  },
  {
    code: "RETAIL_MARKET",
    nameEn: "Retail Market",
    nameAz: "Pərakəndə bazar",
    description: "Retail market locations",
    sortOrder: 8,
    aliases: JSON.stringify(["Retail", "retail", "RETAIL"]),
  },
  {
    code: "WHOLESALE_MARKET",
    nameEn: "Wholesale Market",
    nameAz: "Topdansatış bazar",
    description: "Wholesale market locations",
    sortOrder: 9,
    aliases: JSON.stringify(["Wholesale", "WHOLESALE"]),
  },
  {
    code: "OTHER",
    nameEn: "Other",
    nameAz: "Digər",
    description: "Other market types",
    sortOrder: 10,
    aliases: JSON.stringify([
      "Governorate capital",
      "Commune capital",
      "Island",
      "Refugee camp",
      "Region",
      "Canton of Chimborazo Province",
    ]),
  },
];

async function main() {
  console.log("🏪 Seeding Market Location Types...\n");

  for (const type of MARKET_LOCATION_TYPES) {
    const result = await prisma.marketLocationType.upsert({
      where: { code: type.code },
      update: {
        nameEn: type.nameEn,
        nameAz: type.nameAz,
        description: type.description,
        sortOrder: type.sortOrder,
        aliases: type.aliases,
      },
      create: type,
    });
    console.log(`  ✓ ${result.code}: ${result.nameEn}`);
  }

  console.log(`\n✅ Created/Updated ${MARKET_LOCATION_TYPES.length} market location types`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




