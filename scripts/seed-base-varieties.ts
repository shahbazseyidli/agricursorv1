import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Base variety yaratmaq üçün slug generator
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// 2+ variety olan məhsullar üçün base olacaq variety-lərin slug-ları
const BASE_VARIETY_MAPPINGS: Record<string, string> = {
  // Məhsul adı (name_en) -> base olacaq variety slug
  "Apple": "alma",
  "Cucumber": "xiyar",
  "Pear": "armud",
  "Peach": "aftal",
  "Pomegranate": "nar",
  "Cherry": "gilas",
  "Persimmon": "xurma",
  "Onion": "so-an",
  "Watermelon": "qarp-z",
  "Melon": "yemi",
  "Strawberry": "iy-l-k",
  "Quince": "heyva",
  "Green Beans": "lobya",
  "Apricot": "rik",
  "Mandarin": "mandarin",
  "Lemon": "limon",
  "Cherry Plum": "al-a",
  "Sweet Corn": "qar-dal-s-t-l",
  "Walnut": "local",
  "Beetroot": "u-undur",
  "Pumpkin": "balqabaq",
  "Chestnut": "abal-d",
  "Kiwi": "local",
  "Garlic": "white",
  "Sour Cherry": "gil-nar",
  "Cornelian Cherry": "zo-al",
  "Wheat flour": "flour",
  "Feijoa": "local",
  "Cauliflower": "g-l-k-l-m",
  "Blueberry": "bluberry",
  "Medlar": "zgil",
  "Rice (broken)": "broken",
  "Maize flour": "flour",
  "Goat": "local",
  "Chicken (frozen parts)": "frozen",
  "Milk (fresh)": "fresh",
  "Chili": "red",
};

// Yeni base yaradılmalı olan məhsullar (uyğun variety yoxdur)
const NEEDS_NEW_BASE = [
  "Pepper",
  "Plum", 
  "Rice",
  "Hazelnut",
  "Blackcurrant",
  "Kidney beans",
  "Cowpeas",
];

async function main() {
  console.log("🚀 Base variety yaratma prosesi başladı...\n");

  // ==========================================
  // ADDIM 1: Variety-si olmayan məhsullar (8 ədəd)
  // ==========================================
  console.log("📦 ADDIM 1: Variety-si olmayan məhsullar üçün base yaradılır...\n");

  const productsWithoutVariety = await prisma.globalProduct.findMany({
    where: {
      productVarieties: {
        none: {},
      },
    },
    include: {
      euProducts: true,
      faoProducts: true,
      fpmaCommodities: true,
      localProducts: {
        include: {
          productTypes: true,
        },
      },
    },
  });

  console.log(`   ${productsWithoutVariety.length} məhsul variety-siz tapıldı\n`);

  for (const product of productsWithoutVariety) {
    // Base variety yarat
    const baseVariety = await prisma.globalProductVariety.create({
      data: {
        slug: "base",
        nameEn: "Standard",
        nameAz: "Standart",
        globalProductId: product.id,
      },
    });

    console.log(`   ✅ ${product.nameEn}: base variety yaradıldı`);

    // EU Products-ı base variety-yə bağla
    if (product.euProducts.length > 0) {
      await prisma.euProduct.updateMany({
        where: { globalProductId: product.id },
        data: { globalProductVarietyId: baseVariety.id },
      });
      console.log(`      └── ${product.euProducts.length} EU product bağlandı`);
    }

    // FAO Products-ı base variety-yə bağla
    if (product.faoProducts.length > 0) {
      await prisma.faoProduct.updateMany({
        where: { globalProductId: product.id },
        data: { globalProductVarietyId: baseVariety.id },
      });
      console.log(`      └── ${product.faoProducts.length} FAO product bağlandı`);
    }

    // FPMA Commodities-i base variety-yə bağla
    if (product.fpmaCommodities.length > 0) {
      await prisma.fpmaCommodity.updateMany({
        where: { globalProductId: product.id },
        data: { globalProductVarietyId: baseVariety.id },
      });
      console.log(`      └── ${product.fpmaCommodities.length} FPMA commodity bağlandı`);
    }

    // AZ ProductTypes-ı base variety-yə bağla
    for (const localProduct of product.localProducts) {
      if (localProduct.productTypes.length > 0) {
        await prisma.productType.updateMany({
          where: { productId: localProduct.id },
          data: { globalProductVarietyId: baseVariety.id },
        });
        console.log(`      └── ${localProduct.productTypes.length} AZ product type bağlandı`);
      }
    }
  }

  // ==========================================
  // ADDIM 2: 1 variety olan məhsullar (38 ədəd)
  // ==========================================
  console.log("\n📦 ADDIM 2: 1 variety olan məhsulların variety-si base edilir...\n");

  const productsWith1Variety = await prisma.globalProduct.findMany({
    where: {
      productVarieties: {
        none: {
          slug: "base",
        },
      },
    },
    include: {
      productVarieties: true,
      euProducts: true,
      faoProducts: true,
      fpmaCommodities: true,
    },
  });

  // Yalnız 1 variety olanları filtr et
  const singleVarietyProducts = productsWith1Variety.filter(
    (p) => p.productVarieties.length === 1
  );

  console.log(`   ${singleVarietyProducts.length} məhsul 1 variety ilə tapıldı\n`);

  for (const product of singleVarietyProducts) {
    const existingVariety = product.productVarieties[0];

    // Mövcud variety-ni base et
    await prisma.globalProductVariety.update({
      where: { id: existingVariety.id },
      data: { slug: "base" },
    });

    console.log(`   ✅ ${product.nameEn}: "${existingVariety.slug}" → "base" edildi`);

    // Source əlaqələrini yoxla və variety-yə bağla (əgər bağlı deyilsə)
    // EU Products
    const unlinkedEU = product.euProducts.filter((ep) => !ep.globalProductVarietyId);
    if (unlinkedEU.length > 0) {
      await prisma.euProduct.updateMany({
        where: {
          globalProductId: product.id,
          globalProductVarietyId: null,
        },
        data: { globalProductVarietyId: existingVariety.id },
      });
      console.log(`      └── ${unlinkedEU.length} EU product base-ə bağlandı`);
    }

    // FAO Products
    const unlinkedFAO = product.faoProducts.filter((fp) => !fp.globalProductVarietyId);
    if (unlinkedFAO.length > 0) {
      await prisma.faoProduct.updateMany({
        where: {
          globalProductId: product.id,
          globalProductVarietyId: null,
        },
        data: { globalProductVarietyId: existingVariety.id },
      });
      console.log(`      └── ${unlinkedFAO.length} FAO product base-ə bağlandı`);
    }

    // FPMA Commodities
    const unlinkedFPMA = product.fpmaCommodities.filter((fc) => !fc.globalProductVarietyId);
    if (unlinkedFPMA.length > 0) {
      await prisma.fpmaCommodity.updateMany({
        where: {
          globalProductId: product.id,
          globalProductVarietyId: null,
        },
        data: { globalProductVarietyId: existingVariety.id },
      });
      console.log(`      └── ${unlinkedFPMA.length} FPMA commodity base-ə bağlandı`);
    }
  }

  // ==========================================
  // ADDIM 3: 2+ variety olan məhsullar (44 ədəd)
  // ==========================================
  console.log("\n📦 ADDIM 3: 2+ variety olan məhsullardan biri base edilir...\n");

  const productsWithMultipleVarieties = productsWith1Variety.filter(
    (p) => p.productVarieties.length >= 2
  );

  // Yenidən fetch edək ki, 2+ variety olanları düzgün alaq
  const multiVarietyProducts = await prisma.globalProduct.findMany({
    where: {
      productVarieties: {
        none: {
          slug: "base",
        },
      },
    },
    include: {
      productVarieties: true,
      euProducts: true,
      faoProducts: true,
      fpmaCommodities: true,
    },
  });

  const multiProducts = multiVarietyProducts.filter((p) => p.productVarieties.length >= 2);
  console.log(`   ${multiProducts.length} məhsul 2+ variety ilə tapıldı\n`);

  for (const product of multiProducts) {
    const targetSlug = BASE_VARIETY_MAPPINGS[product.nameEn];
    const needsNewBase = NEEDS_NEW_BASE.includes(product.nameEn);

    if (needsNewBase) {
      // Yeni base variety yarat
      const baseVariety = await prisma.globalProductVariety.create({
        data: {
          slug: "base",
          nameEn: "Standard",
          nameAz: "Standart",
          globalProductId: product.id,
        },
      });

      console.log(`   ✅ ${product.nameEn}: yeni base variety yaradıldı`);

      // Əlaqəsiz source-ları base-ə bağla
      const unlinkedEU = product.euProducts.filter((ep) => !ep.globalProductVarietyId);
      if (unlinkedEU.length > 0) {
        await prisma.euProduct.updateMany({
          where: {
            globalProductId: product.id,
            globalProductVarietyId: null,
          },
          data: { globalProductVarietyId: baseVariety.id },
        });
        console.log(`      └── ${unlinkedEU.length} EU product base-ə bağlandı`);
      }

      const unlinkedFAO = product.faoProducts.filter((fp) => !fp.globalProductVarietyId);
      if (unlinkedFAO.length > 0) {
        await prisma.faoProduct.updateMany({
          where: {
            globalProductId: product.id,
            globalProductVarietyId: null,
          },
          data: { globalProductVarietyId: baseVariety.id },
        });
        console.log(`      └── ${unlinkedFAO.length} FAO product base-ə bağlandı`);
      }

      const unlinkedFPMA = product.fpmaCommodities.filter((fc) => !fc.globalProductVarietyId);
      if (unlinkedFPMA.length > 0) {
        await prisma.fpmaCommodity.updateMany({
          where: {
            globalProductId: product.id,
            globalProductVarietyId: null,
          },
          data: { globalProductVarietyId: baseVariety.id },
        });
        console.log(`      └── ${unlinkedFPMA.length} FPMA commodity base-ə bağlandı`);
      }
    } else if (targetSlug) {
      // Mövcud variety-ni base et
      const varietyToBase = product.productVarieties.find((v) => v.slug === targetSlug);

      if (varietyToBase) {
        await prisma.globalProductVariety.update({
          where: { id: varietyToBase.id },
          data: { slug: "base" },
        });

        console.log(`   ✅ ${product.nameEn}: "${targetSlug}" → "base" edildi`);

        // Əlaqəsiz source-ları base-ə bağla
        const unlinkedEU = product.euProducts.filter((ep) => !ep.globalProductVarietyId);
        if (unlinkedEU.length > 0) {
          await prisma.euProduct.updateMany({
            where: {
              globalProductId: product.id,
              globalProductVarietyId: null,
            },
            data: { globalProductVarietyId: varietyToBase.id },
          });
          console.log(`      └── ${unlinkedEU.length} EU product base-ə bağlandı`);
        }

        const unlinkedFAO = product.faoProducts.filter((fp) => !fp.globalProductVarietyId);
        if (unlinkedFAO.length > 0) {
          await prisma.faoProduct.updateMany({
            where: {
              globalProductId: product.id,
              globalProductVarietyId: null,
            },
            data: { globalProductVarietyId: varietyToBase.id },
          });
          console.log(`      └── ${unlinkedFAO.length} FAO product base-ə bağlandı`);
        }

        const unlinkedFPMA = product.fpmaCommodities.filter((fc) => !fc.globalProductVarietyId);
        if (unlinkedFPMA.length > 0) {
          await prisma.fpmaCommodity.updateMany({
            where: {
              globalProductId: product.id,
              globalProductVarietyId: null,
            },
            data: { globalProductVarietyId: varietyToBase.id },
          });
          console.log(`      └── ${unlinkedFPMA.length} FPMA commodity base-ə bağlandı`);
        }
      } else {
        console.log(`   ⚠️ ${product.nameEn}: "${targetSlug}" tapılmadı, yeni base yaradılır`);

        // Yeni base yarat
        const baseVariety = await prisma.globalProductVariety.create({
          data: {
            slug: "base",
            nameEn: "Standard",
            nameAz: "Standart",
            globalProductId: product.id,
          },
        });

        // Əlaqəsiz source-ları base-ə bağla
        await prisma.euProduct.updateMany({
          where: {
            globalProductId: product.id,
            globalProductVarietyId: null,
          },
          data: { globalProductVarietyId: baseVariety.id },
        });

        await prisma.faoProduct.updateMany({
          where: {
            globalProductId: product.id,
            globalProductVarietyId: null,
          },
          data: { globalProductVarietyId: baseVariety.id },
        });

        await prisma.fpmaCommodity.updateMany({
          where: {
            globalProductId: product.id,
            globalProductVarietyId: null,
          },
          data: { globalProductVarietyId: baseVariety.id },
        });
      }
    } else {
      console.log(`   ⚠️ ${product.nameEn}: mapping yoxdur, yeni base yaradılır`);

      // Yeni base yarat
      const baseVariety = await prisma.globalProductVariety.create({
        data: {
          slug: "base",
          nameEn: "Standard",
          nameAz: "Standart",
          globalProductId: product.id,
        },
      });

      // Əlaqəsiz source-ları base-ə bağla
      await prisma.euProduct.updateMany({
        where: {
          globalProductId: product.id,
          globalProductVarietyId: null,
        },
        data: { globalProductVarietyId: baseVariety.id },
      });

      await prisma.faoProduct.updateMany({
        where: {
          globalProductId: product.id,
          globalProductVarietyId: null,
        },
        data: { globalProductVarietyId: baseVariety.id },
      });

      await prisma.fpmaCommodity.updateMany({
        where: {
          globalProductId: product.id,
          globalProductVarietyId: null,
        },
        data: { globalProductVarietyId: baseVariety.id },
      });
    }
  }

  // ==========================================
  // VERİFİKASİYA
  // ==========================================
  console.log("\n🔍 VERİFİKASİYA...\n");

  const productsWithoutBase = await prisma.globalProduct.count({
    where: {
      productVarieties: {
        none: {
          slug: "base",
        },
      },
    },
  });

  const totalProducts = await prisma.globalProduct.count();
  const productsWithBase = await prisma.globalProduct.count({
    where: {
      productVarieties: {
        some: {
          slug: "base",
        },
      },
    },
  });

  console.log(`   Cəmi məhsul: ${totalProducts}`);
  console.log(`   Base variety olan: ${productsWithBase}`);
  console.log(`   Base variety olmayan: ${productsWithoutBase}`);

  if (productsWithoutBase === 0) {
    console.log("\n✅ UĞURLU: Bütün məhsulların base variety-si var!");
  } else {
    console.log("\n⚠️ XƏBƏRDARLIQ: Hələ də base olmayan məhsullar var!");

    const remaining = await prisma.globalProduct.findMany({
      where: {
        productVarieties: {
          none: {
            slug: "base",
          },
        },
      },
      select: {
        nameEn: true,
        productVarieties: {
          select: { slug: true },
        },
      },
    });

    for (const p of remaining) {
      console.log(`   - ${p.nameEn}: ${p.productVarieties.map((v) => v.slug).join(", ")}`);
    }
  }

  // Source əlaqələrinin statistikası
  console.log("\n📊 SOURCE ƏLAQƏLƏRİ STATİSTİKASI:\n");

  const euWithVariety = await prisma.euProduct.count({
    where: { globalProductVarietyId: { not: null } },
  });
  const euTotal = await prisma.euProduct.count({
    where: { globalProductId: { not: null } },
  });

  const faoWithVariety = await prisma.faoProduct.count({
    where: { globalProductVarietyId: { not: null } },
  });
  const faoTotal = await prisma.faoProduct.count({
    where: { globalProductId: { not: null } },
  });

  const fpmaWithVariety = await prisma.fpmaCommodity.count({
    where: { globalProductVarietyId: { not: null } },
  });
  const fpmaTotal = await prisma.fpmaCommodity.count({
    where: { globalProductId: { not: null } },
  });

  const azWithVariety = await prisma.productType.count({
    where: { globalProductVarietyId: { not: null } },
  });
  const azTotal = await prisma.productType.count();

  console.log(`   EU Products: ${euWithVariety}/${euTotal} variety-yə bağlı`);
  console.log(`   FAO Products: ${faoWithVariety}/${faoTotal} variety-yə bağlı`);
  console.log(`   FPMA Commodities: ${fpmaWithVariety}/${fpmaTotal} variety-yə bağlı`);
  console.log(`   AZ ProductTypes: ${azWithVariety}/${azTotal} variety-yə bağlı`);

  console.log("\n🎉 Script tamamlandı!");
}

main()
  .catch((e) => {
    console.error("❌ Xəta:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

