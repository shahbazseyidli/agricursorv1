import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get single category
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: params.id },
      include: {
        country: true,
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Kateqoriya tapılmadı" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { success: false, message: "Kateqoriya yüklənərkən xəta baş verdi" },
      { status: 500 }
    );
  }
}

// PUT - Update category
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
    const { name, nameEn, nameRu, aliases } = body;

    const category = await prisma.category.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(nameEn !== undefined && { nameEn }),
        ...(nameRu !== undefined && { nameRu }),
        ...(aliases !== undefined && { aliases }),
      },
      include: {
        country: true,
      },
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { success: false, message: "Kateqoriya yenilənərkən xəta baş verdi" },
      { status: 500 }
    );
  }
}

// DELETE - Delete category (only if no products)
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

    // Check if category has products
    const productsCount = await prisma.product.count({
      where: { categoryId: params.id },
    });

    if (productsCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Bu kateqoriyaya ${productsCount} məhsul bağlıdır. Əvvəlcə məhsulları silin.`,
        },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "Kateqoriya uğurla silindi",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { success: false, message: "Kateqoriya silinərkən xəta baş verdi" },
      { status: 500 }
    );
  }
}







