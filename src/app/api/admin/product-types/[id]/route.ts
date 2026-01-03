import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get single product type
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productType = await prisma.productType.findUnique({
      where: { id: params.id },
      include: {
        product: true,
        _count: {
          select: { prices: true },
        },
      },
    });

    if (!productType) {
      return NextResponse.json(
        { success: false, message: "Məhsul növü tapılmadı" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: productType });
  } catch (error) {
    console.error("Error fetching product type:", error);
    return NextResponse.json(
      { success: false, message: "Məhsul növü yüklənərkən xəta baş verdi" },
      { status: 500 }
    );
  }
}

// PUT - Update product type
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

    const productType = await prisma.productType.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(nameEn !== undefined && { nameEn }),
        ...(nameRu !== undefined && { nameRu }),
        ...(aliases !== undefined && { aliases }),
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json({ success: true, data: productType });
  } catch (error) {
    console.error("Error updating product type:", error);
    return NextResponse.json(
      { success: false, message: "Məhsul növü yenilənərkən xəta baş verdi" },
      { status: 500 }
    );
  }
}

// DELETE - Delete product type
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

    // Delete associated prices first
    await prisma.price.deleteMany({
      where: { productTypeId: params.id },
    });

    // Delete product type
    await prisma.productType.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "Məhsul növü uğurla silindi",
    });
  } catch (error) {
    console.error("Error deleting product type:", error);
    return NextResponse.json(
      { success: false, message: "Məhsul növü silinərkən xəta baş verdi" },
      { status: 500 }
    );
  }
}




