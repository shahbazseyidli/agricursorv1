/**
 * Seed GlobalPriceStage table
 * Maps price stages from all data sources:
 * - AZ: WHOLESALE, RETAIL, PROCESSING, FIELD (FIELD = PRODUCER)
 * - FPMA: RETAIL, WHOLESALE
 * - FAO: PRODUCER (element_name = "Producer Price")
 * - EUROSTAT: PRODUCER (price_stage = "PRODUCER")
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const GLOBAL_PRICE_STAGES = [
  {
    code: "WHOLESALE",
    nameEn: "Wholesale",
    nameAz: "Topdan satış",
    nameRu: "Оптовая продажа",
    description: "Wholesale market prices - bulk sales to retailers",
    sortOrder: 1,
  },
  {
    code: "RETAIL",
    nameEn: "Retail",
    nameAz: "Pərakəndə satış",
    nameRu: "Розничная продажа",
    description: "Retail market prices - sales to end consumers",
    sortOrder: 2,
  },
  {
    code: "PRODUCER",
    nameEn: "Producer",
    nameAz: "İstehsalçı qiyməti",
    nameRu: "Цена производителя",
    description: "Farm-gate/producer prices - prices received by farmers",
    sortOrder: 3,
  },
  {
    code: "PROCESSING",
    nameEn: "Processing",
    nameAz: "Xammal alışı",
    nameRu: "Закупка сырья",
    description: "Processing industry purchase prices - raw material procurement",
    sortOrder: 4,
  },
];

// Mapping from source-specific codes to GlobalPriceStage codes
const STAGE_MAPPINGS = {
  // AZ MarketType code -> GlobalPriceStage code
  az: {
    WHOLESALE: "WHOLESALE",
    RETAIL: "RETAIL",
    PROCESSING: "PROCESSING",
    FIELD: "PRODUCER", // FIELD = PRODUCER (farm-gate)
  },
  // FPMA priceType -> GlobalPriceStage code
  fpma: {
    RETAIL: "RETAIL",
    WHOLESALE: "WHOLESALE",
  },
  // EUROSTAT priceStage -> GlobalPriceStage code
  eurostat: {
    PRODUCER: "PRODUCER",
  },
  // FAO elementName -> GlobalPriceStage code
  fao: {
    "Producer Price (USD/tonne)": "PRODUCER",
  },
};

async function main() {
  console.log("🏷️  Seeding GlobalPriceStage...\n");

  // Create GlobalPriceStage entries
  for (const stage of GLOBAL_PRICE_STAGES) {
    const existing = await prisma.globalPriceStage.findUnique({
      where: { code: stage.code },
    });

    if (existing) {
      console.log(`  ✓ ${stage.code} already exists`);
    } else {
      await prisma.globalPriceStage.create({
        data: stage,
      });
      console.log(`  + Created ${stage.code}`);
    }
  }

  // Get all GlobalPriceStages for linking
  const globalStages = await prisma.globalPriceStage.findMany();
  const stageMap = new Map(globalStages.map((s) => [s.code, s.id]));

  // Link AZ MarketTypes to GlobalPriceStage
  console.log("\n📦 Linking AZ MarketTypes...");
  const azMarketTypes = await prisma.marketType.findMany();
  
  for (const mt of azMarketTypes) {
    const globalCode = STAGE_MAPPINGS.az[mt.code as keyof typeof STAGE_MAPPINGS.az];
    if (globalCode && stageMap.has(globalCode)) {
      await prisma.marketType.update({
        where: { id: mt.id },
        data: { globalPriceStageId: stageMap.get(globalCode) },
      });
      console.log(`  ✓ ${mt.code} → ${globalCode}`);
    }
  }

  // Link FPMA Series to GlobalPriceStage
  console.log("\n📊 Linking FPMA Series...");
  const fpmaSeries = await prisma.fpmaSerie.findMany({
    select: { id: true, priceType: true },
  });

  let fpmaLinked = 0;
  for (const series of fpmaSeries) {
    const globalCode = STAGE_MAPPINGS.fpma[series.priceType as keyof typeof STAGE_MAPPINGS.fpma];
    if (globalCode && stageMap.has(globalCode)) {
      await prisma.fpmaSerie.update({
        where: { id: series.id },
        data: { globalPriceStageId: stageMap.get(globalCode) },
      });
      fpmaLinked++;
    }
  }
  console.log(`  ✓ Linked ${fpmaLinked} FPMA series`);

  // Link EUROSTAT Prices to GlobalPriceStage
  console.log("\n🇪🇺 Linking EUROSTAT Prices...");
  const euPricesWithStage = await prisma.euPrice.findMany({
    where: { priceStage: { not: null } },
    select: { id: true, priceStage: true },
  });

  let euLinked = 0;
  for (const price of euPricesWithStage) {
    if (price.priceStage) {
      const globalCode = STAGE_MAPPINGS.eurostat[price.priceStage as keyof typeof STAGE_MAPPINGS.eurostat];
      if (globalCode && stageMap.has(globalCode)) {
        await prisma.euPrice.update({
          where: { id: price.id },
          data: { globalPriceStageId: stageMap.get(globalCode) },
        });
        euLinked++;
      }
    }
  }
  console.log(`  ✓ Linked ${euLinked} EU prices`);

  // Link FAO Prices to GlobalPriceStage
  console.log("\n🌍 Linking FAO Prices...");
  const faoPrices = await prisma.faoPrice.findMany({
    select: { id: true, elementName: true },
  });

  let faoLinked = 0;
  for (const price of faoPrices) {
    const globalCode = STAGE_MAPPINGS.fao[price.elementName as keyof typeof STAGE_MAPPINGS.fao];
    if (globalCode && stageMap.has(globalCode)) {
      await prisma.faoPrice.update({
        where: { id: price.id },
        data: { globalPriceStageId: stageMap.get(globalCode) },
      });
      faoLinked++;
    }
  }
  console.log(`  ✓ Linked ${faoLinked} FAO prices`);

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("✅ GlobalPriceStage seeding complete!");
  console.log(`   - ${GLOBAL_PRICE_STAGES.length} price stages created`);
  console.log(`   - ${azMarketTypes.length} AZ market types linked`);
  console.log(`   - ${fpmaLinked} FPMA series linked`);
  console.log(`   - ${euLinked} EU prices linked`);
  console.log(`   - ${faoLinked} FAO prices linked`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


