import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get single market by ID
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const market = await prisma.market.findUnique({
      where: { id: params.id },
      include: {
        country: true,
        marketType: true,
        _count: {
          select: { prices: true },
        },
      },
    });

    if (!market) {
      return NextResponse.json(
        { success: false, message: "Bazar tapılmadı" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: market });
  } catch (error) {
    console.error("Error fetching market:", error);
    return NextResponse.json(
      { success: false, message: "Bazar yüklənərkən xəta baş verdi" },
      { status: 500 }
    );
  }
}

// PUT - Update market
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
    const { name, nameEn, nameRu, aliases, marketTypeId } = body;

    const market = await prisma.market.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(nameEn !== undefined && { nameEn }),
        ...(nameRu !== undefined && { nameRu }),
        ...(aliases !== undefined && { aliases }),
        ...(marketTypeId && { marketTypeId }),
      },
      include: {
        country: true,
        marketType: true,
      },
    });

    return NextResponse.json({ success: true, data: market });
  } catch (error) {
    console.error("Error updating market:", error);
    return NextResponse.json(
      { success: false, message: "Bazar yenilənərkən xəta baş verdi" },
      { status: 500 }
    );
  }
}

// DELETE - Delete single market
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

    // First delete associated prices
    await prisma.price.deleteMany({
      where: { marketId: params.id },
    });

    // Then delete market
    await prisma.market.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "Bazar uğurla silindi",
    });
  } catch (error) {
    console.error("Error deleting market:", error);
    return NextResponse.json(
      { success: false, message: "Bazar silinərkən xəta baş verdi" },
      { status: 500 }
    );
  }
}





