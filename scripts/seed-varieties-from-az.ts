/**
 * Create GlobalProductVarieties from AZ ProductTypes
 * 
 * This script:
 * 1. Gets all AZ ProductTypes that have a linked product with GlobalProduct
 * 2. Creates GlobalProductVariety for each unique type
 * 3. Links the ProductType to the created variety
 * 
 * Run with: npx tsx scripts/seed-varieties-from-az.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper to generate slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[əƏ]/g, "e")
    .replace(/[üÜ]/g, "u")
    .replace(/[öÖ]/g, "o")
    .replace(/[ıİ]/g, "i")
    .replace(/[şŞ]/g, "s")
    .replace(/[çÇ]/g, "c")
    .replace(/[ğĞ]/g, "g")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

async function main() {
  console.log("🚀 Creating GlobalProductVarieties from AZ ProductTypes...\n");

  // Get all ProductTypes with their Product and the Product's GlobalProduct
  const productTypes = await prisma.productType.findMany({
    where: {
      product: {
        globalProductId: { not: null }
      }
    },
    include: {
      product: {
        include: {
          globalProduct: true
        }
      }
    },
    orderBy: [
      { product: { name: "asc" } },
      { name: "asc" }
    ]
  });

  console.log(`📦 Found ${productTypes.length} ProductTypes with GlobalProduct links\n`);

  let created = 0;
  let linked = 0;
  let skipped = 0;

  for (const pt of productTypes) {
    const globalProduct = pt.product.globalProduct;
    if (!globalProduct) {
      skipped++;
      continue;
    }

    const slug = generateSlug(pt.name);
    
    // Skip if already linked to a variety
    if (pt.globalProductVarietyId) {
      console.log(`  ⏭️ ${pt.name} (${globalProduct.nameEn}) - already linked`);
      skipped++;
      continue;
    }

    // Skip generic types like "Digər"
    if (pt.name.toLowerCase() === "digər" || pt.name.toLowerCase() === "other") {
      console.log(`  ⏭️ ${pt.name} (${globalProduct.nameEn}) - generic type, skipped`);
      skipped++;
      continue;
    }

    try {
      // Try to find existing variety with same slug for this product
      let variety = await prisma.globalProductVariety.findUnique({
        where: {
          globalProductId_slug: {
            globalProductId: globalProduct.id,
            slug
          }
        }
      });

      if (!variety) {
        // Create new variety
        variety = await prisma.globalProductVariety.create({
          data: {
            globalProductId: globalProduct.id,
            slug,
            nameAz: pt.name,
            nameEn: pt.nameEn || pt.name, // Use nameEn if available, otherwise AZ name
          }
        });
        created++;
        console.log(`  ✅ Created: ${globalProduct.nameEn} → ${variety.nameAz} (${variety.slug})`);
      }

      // Link ProductType to variety
      await prisma.productType.update({
        where: { id: pt.id },
        data: { globalProductVarietyId: variety.id }
      });
      linked++;

    } catch (error: any) {
      if (error.code === 'P2002') {
        // Unique constraint - variety exists, just link
        const existing = await prisma.globalProductVariety.findUnique({
          where: {
            globalProductId_slug: {
              globalProductId: globalProduct.id,
              slug
            }
          }
        });
        if (existing) {
          await prisma.productType.update({
            where: { id: pt.id },
            data: { globalProductVarietyId: existing.id }
          });
          linked++;
          console.log(`  🔗 Linked existing: ${pt.name} → ${existing.slug}`);
        }
      } else {
        console.error(`  ❌ Error for ${pt.name}:`, error.message);
      }
    }
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 Summary:");
  console.log(`  Varieties created: ${created}`);
  console.log(`  ProductTypes linked: ${linked}`);
  console.log(`  Skipped: ${skipped}`);
  
  // Stats
  const totalVarieties = await prisma.globalProductVariety.count();
  const linkedProductTypes = await prisma.productType.count({
    where: { globalProductVarietyId: { not: null } }
  });
  
  console.log("\n📈 Final Stats:");
  console.log(`  Total GlobalProductVarieties: ${totalVarieties}`);
  console.log(`  Linked ProductTypes: ${linkedProductTypes}`);
  
  console.log("\n✨ Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

