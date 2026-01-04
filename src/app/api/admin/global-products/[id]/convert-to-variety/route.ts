import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * POST - Convert a GlobalProduct to a GlobalProductVariety
 * 
 * This will:
 * 1. Create a new GlobalProductVariety with the product's data
 * 2. Move all linked items (localProducts, euProducts, faoProducts, fpmaCommodities) to the new variety's parent product
 * 3. Delete the original GlobalProduct
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { targetProductId } = body;

    if (!targetProductId) {
      return NextResponse.json(
        { error: "targetProductId is required" },
        { status: 400 }
      );
    }

    // Get the product to convert
    const productToConvert = await prisma.globalProduct.findUnique({
      where: { id },
      include: {
        localProducts: true,
        euProducts: true,
        faoProducts: true,
        fpmaCommodities: true,
        productVarieties: true,
      },
    });

    if (!productToConvert) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Get the target product
    const targetProduct = await prisma.globalProduct.findUnique({
      where: { id: targetProductId },
    });

    if (!targetProduct) {
      return NextResponse.json(
        { error: "Target product not found" },
        { status: 404 }
      );
    }

    // Can't convert to itself
    if (id === targetProductId) {
      return NextResponse.json(
        { error: "Cannot convert product to variety of itself" },
        { status: 400 }
      );
    }

    // Generate slug for variety
    const slug = productToConvert.slug;

    // Check if variety with this slug already exists
    const existingVariety = await prisma.globalProductVariety.findUnique({
      where: {
        globalProductId_slug: {
          globalProductId: targetProductId,
          slug,
        },
      },
    });

    if (existingVariety) {
      return NextResponse.json(
        { error: `Variety with slug "${slug}" already exists for target product` },
        { status: 400 }
      );
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the variety
      const newVariety = await tx.globalProductVariety.create({
        data: {
          globalProductId: targetProductId,
          slug,
          nameEn: productToConvert.nameEn,
          nameAz: productToConvert.nameAz,
          nameRu: productToConvert.nameRu,
          hsCode: productToConvert.hsCode,
          description: productToConvert.descriptionEn,
          image: productToConvert.image,
          fpmaVarietyCode: productToConvert.fpmaCode,
        },
      });

      // 2. Move local products to target product (they'll keep variety link through productTypes)
      if (productToConvert.localProducts.length > 0) {
        await tx.product.updateMany({
          where: { globalProductId: id },
          data: { globalProductId: targetProductId },
        });
      }

      // 3. Move EU products and link to variety
      if (productToConvert.euProducts.length > 0) {
        await tx.euProduct.updateMany({
          where: { globalProductId: id },
          data: { 
            globalProductId: targetProductId,
            globalProductVarietyId: newVariety.id,
          },
        });
      }

      // 4. Move FAO products and link to variety
      if (productToConvert.faoProducts.length > 0) {
        await tx.faoProduct.updateMany({
          where: { globalProductId: id },
          data: { 
            globalProductId: targetProductId,
            globalProductVarietyId: newVariety.id,
          },
        });
      }

      // 5. Move FPMA commodities and link to variety
      if (productToConvert.fpmaCommodities.length > 0) {
        await tx.fpmaCommodity.updateMany({
          where: { globalProductId: id },
          data: { 
            globalProductId: targetProductId,
            globalProductVarietyId: newVariety.id,
          },
        });
      }

      // 6. Move existing varieties to target product (merge)
      if (productToConvert.productVarieties.length > 0) {
        for (const variety of productToConvert.productVarieties) {
          // Check for slug conflict
          const conflictVariety = await tx.globalProductVariety.findUnique({
            where: {
              globalProductId_slug: {
                globalProductId: targetProductId,
                slug: variety.slug,
              },
            },
          });

          if (!conflictVariety) {
            await tx.globalProductVariety.update({
              where: { id: variety.id },
              data: { globalProductId: targetProductId },
            });
          }
          // If conflict exists, leave it as is (will be deleted with parent)
        }
      }

      // 7. Delete the original product
      await tx.globalProduct.delete({
        where: { id },
      });

      return newVariety;
    });

    return NextResponse.json({
      success: true,
      data: {
        variety: result,
        message: `"${productToConvert.nameEn}" converted to variety of "${targetProduct.nameEn}"`,
      },
    });
  } catch (error: any) {
    console.error("Error converting product to variety:", error);
    return NextResponse.json(
      { error: error.message || "Failed to convert product to variety" },
      { status: 500 }
    );
  }
}

