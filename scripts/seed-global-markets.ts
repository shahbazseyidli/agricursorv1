/**
 * Seed GlobalMarket table
 * Creates unified markets from AZ and FPMA data sources
 * Links them to GlobalCountry
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🏪 Seeding GlobalMarkets...\n");

  // Get all GlobalCountries for linking
  const globalCountries = await prisma.globalCountry.findMany();
  const countryByIso2 = new Map(globalCountries.map((c) => [c.iso2, c]));
  const countryByIso3 = new Map(globalCountries.map((c) => [c.iso3, c]));

  let created = 0;
  let linked = 0;

  // ============================================
  // Process AZ Markets
  // ============================================
  console.log("📦 Processing AZ Markets...");

  const azMarkets = await prisma.market.findMany({
    include: {
      country: true,
      marketType: true,
    },
  });

  for (const market of azMarkets) {
    // Find GlobalCountry
    const globalCountry = countryByIso2.get(market.country.iso2);
    
    if (!globalCountry) {
      console.log(`  ⚠️ No GlobalCountry for ${market.country.iso2}`);
      continue;
    }

    // Check if GlobalMarket already exists
    const existing = await prisma.globalMarket.findFirst({
      where: {
        globalCountryId: globalCountry.id,
        name: market.name,
      },
    });

    let globalMarketId: string;

    if (existing) {
      globalMarketId = existing.id;
    } else {
      // Create new GlobalMarket
      const newGlobalMarket = await prisma.globalMarket.create({
        data: {
          name: market.name,
          nameEn: market.nameEn || market.name,
          nameAz: market.name,
          nameRu: market.nameRu,
          globalCountryId: globalCountry.id,
          marketType: "PHYSICAL",
          isNationalAvg: market.name.toLowerCase().includes("orta") || 
                        market.name.toLowerCase().includes("average"),
        },
      });
      globalMarketId = newGlobalMarket.id;
      created++;
      console.log(`  + Created: ${market.name} (${market.country.iso2})`);
    }

    // Link AZ Market to GlobalMarket
    if (!market.globalMarketId) {
      await prisma.market.update({
        where: { id: market.id },
        data: { globalMarketId },
      });
      linked++;
    }
  }

  console.log(`\n  ✓ AZ Markets: ${created} created, ${linked} linked`);

  // ============================================
  // Process FPMA Markets
  // ============================================
  console.log("\n📊 Processing FPMA Markets...");

  const fpmaMarkets = await prisma.fpmaMarket.findMany({
    include: {
      country: true,
    },
  });

  let fpmaCreated = 0;
  let fpmaLinked = 0;

  for (const market of fpmaMarkets) {
    // Find GlobalCountry via FPMA country's globalCountryId or ISO codes
    let globalCountry = null;
    
    if (market.country.globalCountryId) {
      globalCountry = globalCountries.find(gc => gc.id === market.country.globalCountryId);
    }
    
    if (!globalCountry && market.country.iso2) {
      globalCountry = countryByIso2.get(market.country.iso2);
    }
    
    if (!globalCountry && market.country.iso3) {
      globalCountry = countryByIso3.get(market.country.iso3);
    }

    if (!globalCountry) {
      console.log(`  ⚠️ No GlobalCountry for FPMA country: ${market.country.nameEn}`);
      continue;
    }

    // Check if GlobalMarket already exists
    const existing = await prisma.globalMarket.findFirst({
      where: {
        globalCountryId: globalCountry.id,
        name: market.name,
      },
    });

    let globalMarketId: string;

    if (existing) {
      globalMarketId = existing.id;
    } else {
      // Determine market type
      const isNationalAvg = market.name.toLowerCase().includes("national") ||
                           market.name.toLowerCase().includes("average") ||
                           market.originalMarketType?.toLowerCase().includes("national");
      
      const marketType = isNationalAvg ? "NATIONAL_AVERAGE" : 
                        market.adminUnit ? "REGIONAL" : "PHYSICAL";

      // Create new GlobalMarket
      const newGlobalMarket = await prisma.globalMarket.create({
        data: {
          name: market.name,
          nameEn: market.name,
          globalCountryId: globalCountry.id,
          region: market.adminUnit,
          marketType,
          isNationalAvg,
        },
      });
      globalMarketId = newGlobalMarket.id;
      fpmaCreated++;
      console.log(`  + Created: ${market.name} (${globalCountry.iso2})`);
    }

    // Link FPMA Market to GlobalMarket
    if (!market.globalMarketId) {
      await prisma.fpmaMarket.update({
        where: { id: market.id },
        data: { globalMarketId },
      });
      fpmaLinked++;
    }
  }

  console.log(`\n  ✓ FPMA Markets: ${fpmaCreated} created, ${fpmaLinked} linked`);

  // ============================================
  // Summary
  // ============================================
  const totalGlobalMarkets = await prisma.globalMarket.count();
  
  console.log("\n" + "=".repeat(50));
  console.log("✅ GlobalMarket seeding complete!");
  console.log(`   - Total GlobalMarkets: ${totalGlobalMarkets}`);
  console.log(`   - AZ Markets linked: ${linked}`);
  console.log(`   - FPMA Markets linked: ${fpmaLinked}`);

  // Show market count by country (top 10)
  console.log("\n📊 Markets by Country (Top 10):");
  const marketsByCountry = await prisma.globalMarket.groupBy({
    by: ["globalCountryId"],
    _count: true,
    orderBy: { _count: { globalCountryId: "desc" } },
    take: 10,
  });

  for (const item of marketsByCountry) {
    const country = globalCountries.find(c => c.id === item.globalCountryId);
    console.log(`   ${country?.iso2 || "??"}: ${item._count} markets`);
  }
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


