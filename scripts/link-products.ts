/**
 * Script to create missing GlobalProducts and link EU/AZ products
 * Run with: npx ts-node scripts/link-products.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// New GlobalProducts to create
const newGlobalProducts = [
  // From unlinked EU products
  { slug: "asparagus", nameAz: "Qulançar", nameEn: "Asparagus", category: "Vegetables" },
  { slug: "avocado", nameAz: "Avokado", nameEn: "Avocado", category: "Fruits" },
  { slug: "beans", nameAz: "Paxla", nameEn: "Beans", category: "Vegetables" },
  { slug: "mushroom", nameAz: "Göbələk", nameEn: "Mushroom", category: "Vegetables" },
  
  // From unlinked AZ products
  { slug: "cherry-plum", nameAz: "Alça", nameEn: "Cherry Plum", category: "Fruits" },
  { slug: "sour-cherry", nameAz: "Gilənar", nameEn: "Sour Cherry", category: "Fruits" },
  { slug: "greens", nameAz: "Göy-Göyərti", nameEn: "Greens", category: "Vegetables" },
  { slug: "sloe", nameAz: "Göyəm", nameEn: "Sloe", category: "Fruits" },
  { slug: "raspberry", nameAz: "Moruq", nameEn: "Raspberry", category: "Fruits" },
  { slug: "blueberry", nameAz: "Qaragilə", nameEn: "Blueberry", category: "Fruits" },
  { slug: "blackcurrant", nameAz: "Qarağat", nameEn: "Blackcurrant", category: "Fruits" },
  { slug: "sweet-corn", nameAz: "Qarğıdalı", nameEn: "Sweet Corn", category: "Vegetables" },
  { slug: "hawthorn", nameAz: "Yemişan", nameEn: "Hawthorn", category: "Fruits" },
  { slug: "olive", nameAz: "Zeytun", nameEn: "Olive", category: "Fruits" },
  { slug: "cornelian-cherry", nameAz: "Zoğal", nameEn: "Cornelian Cherry", category: "Fruits" },
  { slug: "chestnut", nameAz: "Şabalıd", nameEn: "Chestnut", category: "Fruits" },
  { slug: "medlar", nameAz: "Əzgil", nameEn: "Medlar", category: "Fruits" },
];

// EU products to link to existing GlobalProducts
const euToGlobalLinks = [
  { euNameEn: "Bananas", globalSlug: "banana" },
  { euNameEn: "Yellow bananas", globalSlug: "banana" },
  { euNameEn: "Courgettes", globalSlug: "zucchini" },
  { euNameEn: "Egg Plants", globalSlug: "eggplant" },
  { euNameEn: "Kiwis Hayward", globalSlug: "kiwi" },
  { euNameEn: "Leeks", globalSlug: "leek" },
  { euNameEn: "Lettuces", globalSlug: "lettuce" },
  { euNameEn: "Melons", globalSlug: "melon" },
  { euNameEn: "Peppers", globalSlug: "pepper" },
  { euNameEn: "Satsumas", globalSlug: "mandarin" },
  { euNameEn: "Water Melons", globalSlug: "watermelon" },
];

// EU products to link to newly created GlobalProducts
const euToNewGlobalLinks = [
  { euNameEn: "Asparagus", globalSlug: "asparagus" },
  { euNameEn: "Avocados", globalSlug: "avocado" },
  { euNameEn: "Beans", globalSlug: "beans" },
  { euNameEn: "Cultivated Mushrooms", globalSlug: "mushroom" },
];

// AZ products to link to existing GlobalProducts
const azToGlobalLinks = [
  { azName: "Karalyok", globalSlug: "persimmon" },
];

// AZ products to link to newly created GlobalProducts
const azToNewGlobalLinks = [
  { azName: "Alça", globalSlug: "cherry-plum" },
  { azName: "Gilənar", globalSlug: "sour-cherry" },
  { azName: "Göbələk", globalSlug: "mushroom" },
  { azName: "Göy-Göyərti", globalSlug: "greens" },
  { azName: "Göyəm", globalSlug: "sloe" },
  { azName: "Moruq", globalSlug: "raspberry" },
  { azName: "Qaragilə", globalSlug: "blueberry" },
  { azName: "Qarağat", globalSlug: "blackcurrant" },
  { azName: "Qarğıdalı sütülü", globalSlug: "sweet-corn" },
  { azName: "Yemişan", globalSlug: "hawthorn" },
  { azName: "Zeytun", globalSlug: "olive" },
  { azName: "Zoğal", globalSlug: "cornelian-cherry" },
  { azName: "Şabalıd", globalSlug: "chestnut" },
  { azName: "Əzgil", globalSlug: "medlar" },
];

async function main() {
  console.log("🚀 Starting product linking...\n");

  // Step 1: Create new GlobalProducts
  console.log("📦 Creating new GlobalProducts...");
  for (const gp of newGlobalProducts) {
    try {
      const existing = await prisma.globalProduct.findUnique({
        where: { slug: gp.slug },
      });
      
      if (existing) {
        console.log(`  ⏭️  ${gp.nameEn} (${gp.slug}) already exists`);
        continue;
      }
      
      await prisma.globalProduct.create({
        data: {
          slug: gp.slug,
          nameAz: gp.nameAz,
          nameEn: gp.nameEn,
          category: gp.category,
        },
      });
      console.log(`  ✅ Created: ${gp.nameEn} (${gp.slug})`);
    } catch (error) {
      console.error(`  ❌ Error creating ${gp.nameEn}:`, error);
    }
  }

  // Step 2: Link EU products to existing GlobalProducts
  console.log("\n🔗 Linking EU products to existing GlobalProducts...");
  for (const link of euToGlobalLinks) {
    try {
      const globalProduct = await prisma.globalProduct.findUnique({
        where: { slug: link.globalSlug },
      });
      
      if (!globalProduct) {
        console.log(`  ⚠️  GlobalProduct not found: ${link.globalSlug}`);
        continue;
      }
      
      const result = await prisma.euProduct.updateMany({
        where: { 
          nameEn: link.euNameEn,
          globalProductId: null,
        },
        data: { globalProductId: globalProduct.id },
      });
      
      if (result.count > 0) {
        console.log(`  ✅ Linked ${result.count}x "${link.euNameEn}" → ${link.globalSlug}`);
      } else {
        console.log(`  ⏭️  "${link.euNameEn}" already linked or not found`);
      }
    } catch (error) {
      console.error(`  ❌ Error linking ${link.euNameEn}:`, error);
    }
  }

  // Step 3: Link EU products to newly created GlobalProducts
  console.log("\n🔗 Linking EU products to new GlobalProducts...");
  for (const link of euToNewGlobalLinks) {
    try {
      const globalProduct = await prisma.globalProduct.findUnique({
        where: { slug: link.globalSlug },
      });
      
      if (!globalProduct) {
        console.log(`  ⚠️  GlobalProduct not found: ${link.globalSlug}`);
        continue;
      }
      
      const result = await prisma.euProduct.updateMany({
        where: { 
          nameEn: link.euNameEn,
          globalProductId: null,
        },
        data: { globalProductId: globalProduct.id },
      });
      
      if (result.count > 0) {
        console.log(`  ✅ Linked ${result.count}x "${link.euNameEn}" → ${link.globalSlug}`);
      } else {
        console.log(`  ⏭️  "${link.euNameEn}" already linked or not found`);
      }
    } catch (error) {
      console.error(`  ❌ Error linking ${link.euNameEn}:`, error);
    }
  }

  // Step 4: Link AZ products to existing GlobalProducts
  console.log("\n🔗 Linking AZ products to existing GlobalProducts...");
  for (const link of azToGlobalLinks) {
    try {
      const globalProduct = await prisma.globalProduct.findUnique({
        where: { slug: link.globalSlug },
      });
      
      if (!globalProduct) {
        console.log(`  ⚠️  GlobalProduct not found: ${link.globalSlug}`);
        continue;
      }
      
      const result = await prisma.product.updateMany({
        where: { 
          name: link.azName,
          globalProductId: null,
        },
        data: { globalProductId: globalProduct.id },
      });
      
      if (result.count > 0) {
        console.log(`  ✅ Linked ${result.count}x "${link.azName}" → ${link.globalSlug}`);
      } else {
        console.log(`  ⏭️  "${link.azName}" already linked or not found`);
      }
    } catch (error) {
      console.error(`  ❌ Error linking ${link.azName}:`, error);
    }
  }

  // Step 5: Link AZ products to newly created GlobalProducts
  console.log("\n🔗 Linking AZ products to new GlobalProducts...");
  for (const link of azToNewGlobalLinks) {
    try {
      const globalProduct = await prisma.globalProduct.findUnique({
        where: { slug: link.globalSlug },
      });
      
      if (!globalProduct) {
        console.log(`  ⚠️  GlobalProduct not found: ${link.globalSlug}`);
        continue;
      }
      
      const result = await prisma.product.updateMany({
        where: { 
          name: link.azName,
          globalProductId: null,
        },
        data: { globalProductId: globalProduct.id },
      });
      
      if (result.count > 0) {
        console.log(`  ✅ Linked ${result.count}x "${link.azName}" → ${link.globalSlug}`);
      } else {
        console.log(`  ⏭️  "${link.azName}" already linked or not found`);
      }
    } catch (error) {
      console.error(`  ❌ Error linking ${link.azName}:`, error);
    }
  }

  // Summary
  console.log("\n📊 Summary:");
  
  const totalGlobal = await prisma.globalProduct.count();
  const linkedEu = await prisma.euProduct.count({ where: { globalProductId: { not: null } } });
  const unlinkedEu = await prisma.euProduct.count({ where: { globalProductId: null } });
  const linkedAz = await prisma.product.count({ where: { globalProductId: { not: null } } });
  const unlinkedAz = await prisma.product.count({ where: { globalProductId: null } });
  
  console.log(`  Total GlobalProducts: ${totalGlobal}`);
  console.log(`  EU Products: ${linkedEu} linked, ${unlinkedEu} unlinked`);
  console.log(`  AZ Products: ${linkedAz} linked, ${unlinkedAz} unlinked`);
  
  if (unlinkedEu > 0 || unlinkedAz > 0) {
    console.log("\n⚠️  Some products still unlinked. Check manually:");
    
    if (unlinkedEu > 0) {
      const unlinkedEuProducts = await prisma.euProduct.findMany({
        where: { globalProductId: null },
        select: { nameEn: true },
      });
      console.log("  Unlinked EU:", unlinkedEuProducts.map(p => p.nameEn).join(", "));
    }
    
    if (unlinkedAz > 0) {
      const unlinkedAzProducts = await prisma.product.findMany({
        where: { globalProductId: null },
        select: { name: true },
      });
      console.log("  Unlinked AZ:", unlinkedAzProducts.map(p => p.name).join(", "));
    }
  }
  
  console.log("\n✨ Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());


