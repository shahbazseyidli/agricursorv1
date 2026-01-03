/**
 * Seed Global Product Varieties
 * Creates varieties from AZ ProductTypes and FPMA Commodities
 * Links them together where possible
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Common variety name normalizations
const varietyNormalizations: Record<string, { slug: string; nameEn: string; nameAz: string }> = {
  // Colors
  "red": { slug: "red", nameEn: "Red", nameAz: "Qırmızı" },
  "qırmızı": { slug: "red", nameEn: "Red", nameAz: "Qırmızı" },
  "white": { slug: "white", nameEn: "White", nameAz: "Ağ" },
  "ağ": { slug: "white", nameEn: "White", nameAz: "Ağ" },
  "yellow": { slug: "yellow", nameEn: "Yellow", nameAz: "Sarı" },
  "sarı": { slug: "yellow", nameEn: "Yellow", nameAz: "Sarı" },
  "green": { slug: "green", nameEn: "Green", nameAz: "Yaşıl" },
  "yaşıl": { slug: "green", nameEn: "Green", nameAz: "Yaşıl" },
  "black": { slug: "black", nameEn: "Black", nameAz: "Qara" },
  "qara": { slug: "black", nameEn: "Black", nameAz: "Qara" },
  
  // Origin
  "imported": { slug: "imported", nameEn: "Imported", nameAz: "İdxal" },
  "idxal": { slug: "imported", nameEn: "Imported", nameAz: "İdxal" },
  "local": { slug: "local", nameEn: "Local", nameAz: "Yerli" },
  "yerli": { slug: "local", nameEn: "Local", nameAz: "Yerli" },
  "organic": { slug: "organic", nameEn: "Organic", nameAz: "Orqanik" },
  "orqanik": { slug: "organic", nameEn: "Organic", nameAz: "Orqanik" },
  
  // Type/Quality
  "long grain": { slug: "long-grain", nameEn: "Long Grain", nameAz: "Uzun dənli" },
  "medium": { slug: "medium", nameEn: "Medium", nameAz: "Orta" },
  "coarse": { slug: "coarse", nameEn: "Coarse", nameAz: "İri" },
  "broken": { slug: "broken", nameEn: "Broken", nameAz: "Qırıq" },
  "fresh": { slug: "fresh", nameEn: "Fresh", nameAz: "Təzə" },
  "frozen": { slug: "frozen", nameEn: "Frozen", nameAz: "Dondurulmuş" },
  "dried": { slug: "dried", nameEn: "Dried", nameAz: "Qurudulmuş" },
  "smoked": { slug: "smoked", nameEn: "Smoked", nameAz: "Hisə verilmiş" },
  "pasteurised": { slug: "pasteurized", nameEn: "Pasteurized", nameAz: "Pasterizə edilmiş" },
  "pasteurized": { slug: "pasteurized", nameEn: "Pasteurized", nameAz: "Pasterizə edilmiş" },
  
  // Quality grades
  "high grade": { slug: "high-grade", nameEn: "High Grade", nameAz: "Yüksək keyfiyyət" },
  "premium": { slug: "premium", nameEn: "Premium", nameAz: "Premium" },
  "standard": { slug: "standard", nameEn: "Standard", nameAz: "Standart" },
  
  // Specific types
  "whole": { slug: "whole", nameEn: "Whole", nameAz: "Bütöv" },
  "with bones": { slug: "with-bones", nameEn: "With Bones", nameAz: "Sümüklü" },
  "boneless": { slug: "boneless", nameEn: "Boneless", nameAz: "Sümüksüz" },
  "powder": { slug: "powder", nameEn: "Powder", nameAz: "Toz" },
  "flour": { slug: "flour", nameEn: "Flour", nameAz: "Un" },
  
  // Default
  "base": { slug: "base", nameEn: "Standard", nameAz: "Standart" },
};

function normalizeVarietyName(name: string): { slug: string; nameEn: string; nameAz: string } | null {
  const lowerName = name.toLowerCase().trim();
  
  // Check direct match
  if (varietyNormalizations[lowerName]) {
    return varietyNormalizations[lowerName];
  }
  
  // Check if contains any known keyword
  for (const [key, value] of Object.entries(varietyNormalizations)) {
    if (lowerName.includes(key)) {
      return value;
    }
  }
  
  return null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function createVarietiesFromAzProductTypes() {
  console.log("📦 Creating GlobalProductVarieties from AZ ProductTypes...\n");
  
  const productTypes = await prisma.productType.findMany({
    include: {
      product: {
        include: {
          globalProduct: true
        }
      }
    }
  });
  
  let created = 0;
  let linked = 0;
  let skipped = 0;
  
  for (const pt of productTypes) {
    if (!pt.product.globalProduct) {
      skipped++;
      continue;
    }
    
    const globalProductId = pt.product.globalProduct.id;
    
    // Try to normalize the variety name
    const normalized = normalizeVarietyName(pt.name);
    
    let slug: string;
    let nameEn: string;
    let nameAz: string;
    
    if (normalized) {
      slug = normalized.slug;
      nameEn = normalized.nameEn;
      nameAz = normalized.nameAz;
    } else {
      // Use the original name
      slug = slugify(pt.name);
      nameEn = pt.nameEn || pt.name;
      nameAz = pt.name;
    }
    
    // Check if variety already exists for this product
    let variety = await prisma.globalProductVariety.findUnique({
      where: {
        globalProductId_slug: {
          globalProductId,
          slug
        }
      }
    });
    
    if (!variety) {
      // Create new variety
      variety = await prisma.globalProductVariety.create({
        data: {
          globalProductId,
          slug,
          nameEn,
          nameAz,
          isAutoMatched: true,
          matchScore: normalized ? 1.0 : 0.7,
          isActive: true,
        }
      });
      created++;
    }
    
    // Link ProductType to this variety
    await prisma.productType.update({
      where: { id: pt.id },
      data: { globalProductVarietyId: variety.id }
    });
    linked++;
  }
  
  console.log(`  ✅ Created ${created} GlobalProductVarieties`);
  console.log(`  ✅ Linked ${linked} AZ ProductTypes`);
  console.log(`  ⚠️ Skipped ${skipped} (no GlobalProduct link)`);
}

async function createVarietiesFromFpmaCommodities() {
  console.log("\n📦 Creating GlobalProductVarieties from FPMA Commodities...\n");
  
  const commodities = await prisma.fpmaCommodity.findMany({
    where: { globalProductId: { not: null } }
  });
  
  let created = 0;
  let linked = 0;
  
  for (const commodity of commodities) {
    if (!commodity.globalProductId) continue;
    
    // Extract variety from commodity name or variety_name field
    let varietyName = commodity.varietyName;
    
    if (!varietyName) {
      // Try to extract from name in parentheses
      const match = commodity.nameEn.match(/\(([^)]+)\)/);
      if (match) {
        varietyName = match[1];
      }
    }
    
    if (!varietyName || varietyName.length < 2) {
      // Use "base" as default variety
      varietyName = "base";
    }
    
    const normalized = normalizeVarietyName(varietyName);
    
    let slug: string;
    let nameEn: string;
    let nameAz: string;
    
    if (normalized) {
      slug = normalized.slug;
      nameEn = normalized.nameEn;
      nameAz = normalized.nameAz;
    } else {
      slug = slugify(varietyName);
      nameEn = varietyName.charAt(0).toUpperCase() + varietyName.slice(1);
      nameAz = varietyName;
    }
    
    // Check if variety exists
    let variety = await prisma.globalProductVariety.findUnique({
      where: {
        globalProductId_slug: {
          globalProductId: commodity.globalProductId,
          slug
        }
      }
    });
    
    if (!variety) {
      variety = await prisma.globalProductVariety.create({
        data: {
          globalProductId: commodity.globalProductId,
          slug,
          nameEn,
          nameAz,
          fpmaVarietyCode: commodity.code,
          isAutoMatched: true,
          matchScore: normalized ? 1.0 : 0.6,
          isActive: true,
        }
      });
      created++;
    } else if (!variety.fpmaVarietyCode) {
      // Update with FPMA code
      await prisma.globalProductVariety.update({
        where: { id: variety.id },
        data: { fpmaVarietyCode: commodity.code }
      });
    }
    
    // Link commodity to variety
    await prisma.fpmaCommodity.update({
      where: { id: commodity.id },
      data: { globalProductVarietyId: variety.id }
    });
    linked++;
  }
  
  console.log(`  ✅ Created ${created} GlobalProductVarieties from FPMA`);
  console.log(`  ✅ Linked ${linked} FPMA Commodities`);
}

async function main() {
  try {
    await createVarietiesFromAzProductTypes();
    await createVarietiesFromFpmaCommodities();
    
    // Final stats
    console.log("\n📊 Final Statistics:");
    const varietyCount = await prisma.globalProductVariety.count();
    const azLinked = await prisma.productType.count({ where: { globalProductVarietyId: { not: null } } });
    const azTotal = await prisma.productType.count();
    const fpmaLinked = await prisma.fpmaCommodity.count({ where: { globalProductVarietyId: { not: null } } });
    const fpmaTotal = await prisma.fpmaCommodity.count();
    
    console.log(`  GlobalProductVarieties: ${varietyCount}`);
    console.log(`  AZ ProductTypes linked: ${azLinked}/${azTotal}`);
    console.log(`  FPMA Commodities linked: ${fpmaLinked}/${fpmaTotal}`);
    
    console.log("\n🎉 GlobalProductVariety seeding completed!");
  } catch (error) {
    console.error("Error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();


