import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List all products with filters
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const countryId = searchParams.get("countryId");
    const categoryId = searchParams.get("categoryId");

    const where: any = {};
    if (countryId) where.countryId = countryId;
    if (categoryId) where.categoryId = categoryId;

    const products = await prisma.product.findMany({
      where,
      include: {
        country: true,
        category: true,
        productTypes: true,
        _count: {
          select: { prices: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, message: "Məhsullar yüklənərkən xəta baş verdi" },
      { status: 500 }
    );
  }
}

// POST - Create new product
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "İcazə yoxdur" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      nameEn,
      nameRu,
      slug,
      unit,
      aliases,
      categoryId,
      countryId,
      faoCode,
      hsCode,
    } = body;

    if (!name || !slug || !categoryId || !countryId) {
      return NextResponse.json(
        { success: false, message: "Ad, slug, kateqoriya və ölkə tələb olunur" },
        { status: 400 }
      );
    }

    // Check for duplicate slug in country
    const existing = await prisma.product.findFirst({
      where: {
        slug,
        countryId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "Bu slug ilə məhsul artıq mövcuddur" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        nameEn,
        nameRu,
        slug,
        unit: unit || "kg",
        aliases,
        categoryId,
        countryId,
        faoCode,
        hsCode,
      },
      include: {
        country: true,
        category: true,
      },
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { success: false, message: "Məhsul yaradılarkən xəta baş verdi" },
      { status: 500 }
    );
  }
}

// DELETE - Clear all products (with cascade)
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "İcazə yoxdur" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const countryId = searchParams.get("countryId");

    const where: any = {};
    if (countryId) where.countryId = countryId;

    // Delete prices first
    const deletedPrices = await prisma.price.deleteMany({ where });

    // Delete product types
    const productIds = await prisma.product.findMany({
      where,
      select: { id: true },
    });

    const deletedTypes = await prisma.productType.deleteMany({
      where: {
        productId: { in: productIds.map((p) => p.id) },
      },
    });

    // Delete products
    const deletedProducts = await prisma.product.deleteMany({ where });

    return NextResponse.json({
      success: true,
      message: `${deletedProducts.count} məhsul, ${deletedTypes.count} növ və ${deletedPrices.count} qiymət silindi`,
      data: {
        productsDeleted: deletedProducts.count,
        typesDeleted: deletedTypes.count,
        pricesDeleted: deletedPrices.count,
      },
    });
  } catch (error) {
    console.error("Error clearing products:", error);
    return NextResponse.json(
      { success: false, message: "Məhsullar silinərkən xəta baş verdi" },
      { status: 500 }
    );
  }
}





