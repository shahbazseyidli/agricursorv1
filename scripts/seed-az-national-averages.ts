/**
 * Seed Script: AZ National Average GlobalMarkets
 * 
 * Bu script:
 * 1. AZ üçün "National Average (Weekly)" və "National Average (Monthly)" GlobalMarket-lər yaradır
 * 2. Mövcud GlobalMarket-lərə isNationalAvg: false set edir
 * 3. FPMA National Average market-lərə isNationalAvg: true set edir
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting AZ National Average GlobalMarkets seed...\n");

  // 1. Find Azerbaijan GlobalCountry
  const azCountry = await prisma.globalCountry.findFirst({
    where: { iso2: "AZ" }
  });

  if (!azCountry) {
    console.error("❌ Azerbaijan GlobalCountry not found!");
    return;
  }

  console.log(`✅ Found Azerbaijan: ${azCountry.nameEn} (${azCountry.id})\n`);

  // 2. Create National Average (Weekly) for AZ
  const weeklyMarket = await prisma.globalMarket.upsert({
    where: {
      globalCountryId_name: {
        globalCountryId: azCountry.id,
        name: "National Average (Weekly)"
      }
    },
    update: {
      isNationalAvg: true,
      aggregationType: "WEEKLY",
      marketType: "NATIONAL_AVERAGE",
      nameEn: "National Average (Weekly)",
      nameAz: "Milli Ortalama (Həftəlik)",
      nameRu: "Национальное среднее (Еженедельно)"
    },
    create: {
      globalCountryId: azCountry.id,
      name: "National Average (Weekly)",
      nameEn: "National Average (Weekly)",
      nameAz: "Milli Ortalama (Həftəlik)",
      nameRu: "Национальное среднее (Еженедельно)",
      marketType: "NATIONAL_AVERAGE",
      isNationalAvg: true,
      aggregationType: "WEEKLY",
      sortOrder: 1
    }
  });
  console.log(`✅ Created/Updated: ${weeklyMarket.name} (${weeklyMarket.id})`);

  // 3. Create National Average (Monthly) for AZ
  const monthlyMarket = await prisma.globalMarket.upsert({
    where: {
      globalCountryId_name: {
        globalCountryId: azCountry.id,
        name: "National Average (Monthly)"
      }
    },
    update: {
      isNationalAvg: true,
      aggregationType: "MONTHLY",
      marketType: "NATIONAL_AVERAGE",
      nameEn: "National Average (Monthly)",
      nameAz: "Milli Ortalama (Aylıq)",
      nameRu: "Национальное среднее (Ежемесячно)"
    },
    create: {
      globalCountryId: azCountry.id,
      name: "National Average (Monthly)",
      nameEn: "National Average (Monthly)",
      nameAz: "Milli Ortalama (Aylıq)",
      nameRu: "Национальное среднее (Ежемесячно)",
      marketType: "NATIONAL_AVERAGE",
      isNationalAvg: true,
      aggregationType: "MONTHLY",
      sortOrder: 2
    }
  });
  console.log(`✅ Created/Updated: ${monthlyMarket.name} (${monthlyMarket.id})`);

  // 4. Update all other GlobalMarkets to have isNationalAvg: false (if null)
  const updatedNonNational = await prisma.globalMarket.updateMany({
    where: {
      isNationalAvg: false,
      name: {
        not: {
          contains: "National Average"
        }
      }
    },
    data: {
      isNationalAvg: false
    }
  });
  console.log(`\n📌 Ensured ${updatedNonNational.count} markets have isNationalAvg: false`);

  // 5. Update FPMA National Average markets to have isNationalAvg: true
  const fpmaMarkets = await prisma.fpmaMarket.findMany({
    where: {
      OR: [
        { name: { contains: "National" } },
        { name: { contains: "national" } },
        { originalMarketType: { contains: "National" } }
      ]
    },
    include: {
      globalMarket: true
    }
  });

  console.log(`\n🔍 Found ${fpmaMarkets.length} FPMA markets with "National" in name`);

  for (const fpmaMarket of fpmaMarkets) {
    if (fpmaMarket.globalMarketId) {
      // Check if GlobalMarket exists before updating
      const existingMarket = await prisma.globalMarket.findUnique({
        where: { id: fpmaMarket.globalMarketId }
      });
      
      if (existingMarket) {
        await prisma.globalMarket.update({
          where: { id: fpmaMarket.globalMarketId },
          data: { 
            isNationalAvg: true,
            marketType: "NATIONAL_AVERAGE"
          }
        });
        console.log(`  ✅ Updated: ${fpmaMarket.name} → isNationalAvg: true`);
      } else {
        console.log(`  ⚠️ Skipped: ${fpmaMarket.name} - GlobalMarket not found (ID: ${fpmaMarket.globalMarketId})`);
      }
    }
  }

  // 6. Summary
  const allGlobalMarkets = await prisma.globalMarket.findMany({
    where: { globalCountryId: azCountry.id },
    orderBy: { sortOrder: "asc" }
  });

  console.log("\n📊 Final AZ GlobalMarkets:");
  console.log("─".repeat(80));
  for (const market of allGlobalMarkets) {
    console.log(
      `  ${market.isNationalAvg ? "🌍" : "📍"} ${market.name.padEnd(35)} | ` +
      `isNationalAvg: ${String(market.isNationalAvg).padEnd(5)} | ` +
      `aggregationType: ${market.aggregationType || "N/A"}`
    );
  }

  // 7. Show FPMA markets summary
  const fpmaGlobalMarkets = await prisma.globalMarket.findMany({
    where: { isNationalAvg: true },
    include: { globalCountry: true }
  });

  console.log("\n📊 All National Average GlobalMarkets:");
  console.log("─".repeat(80));
  for (const market of fpmaGlobalMarkets) {
    console.log(
      `  🌍 ${market.name.padEnd(35)} | ` +
      `${market.globalCountry?.iso2 || "??"} | ` +
      `aggregationType: ${market.aggregationType || "FPMA"}`
    );
  }

  console.log("\n✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

