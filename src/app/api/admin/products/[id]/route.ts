import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get single product with all relations
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        country: true,
        category: true,
        productTypes: {
          orderBy: { name: "asc" },
        },
        _count: {
          select: { prices: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Məhsul tapılmadı" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { success: false, message: "Məhsul yüklənərkən xəta baş verdi" },
      { status: 500 }
    );
  }
}

// PUT - Update product
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "İcazə yoxdur" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, nameEn, nameRu, unit, aliases, categoryId, faoCode, hsCode } =
      body;

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(nameEn !== undefined && { nameEn }),
        ...(nameRu !== undefined && { nameRu }),
        ...(unit && { unit }),
        ...(aliases !== undefined && { aliases }),
        ...(categoryId && { categoryId }),
        ...(faoCode !== undefined && { faoCode }),
        ...(hsCode !== undefined && { hsCode }),
      },
      include: {
        country: true,
        category: true,
        productTypes: true,
      },
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { success: false, message: "Məhsul yenilənərkən xəta baş verdi" },
      { status: 500 }
    );
  }
}

// DELETE - Delete single product with cascade
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "İcazə yoxdur" },
        { status: 403 }
      );
    }

    // Delete prices first
    await prisma.price.deleteMany({
      where: { productId: params.id },
    });

    // Delete product types
    await prisma.productType.deleteMany({
      where: { productId: params.id },
    });

    // Delete product
    await prisma.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "Məhsul uğurla silindi",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { success: false, message: "Məhsul silinərkən xəta baş verdi" },
      { status: 500 }
    );
  }
}







