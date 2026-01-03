import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Get single GlobalPriceStage with all linked items
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const stage = await prisma.globalPriceStage.findUnique({
      where: { id },
      include: {
        azMarketTypes: {
          include: {
            country: true,
          },
        },
        _count: {
          select: {
            euPrices: true,
            faoPrices: true,
            fpmaSeries: true,
          },
        },
      },
    });

    if (!stage) {
      return NextResponse.json(
        { success: false, error: "Price stage not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: stage });
  } catch (error) {
    console.error("Error fetching GlobalPriceStage:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch price stage" },
      { status: 500 }
    );
  }
}

// PUT - Update GlobalPriceStage
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { nameEn, nameAz, nameRu, description, sortOrder, isActive } = body;

    const stage = await prisma.globalPriceStage.update({
      where: { id },
      data: {
        ...(nameEn && { nameEn }),
        ...(nameAz !== undefined && { nameAz }),
        ...(nameRu !== undefined && { nameRu }),
        ...(description !== undefined && { description }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ success: true, data: stage });
  } catch (error) {
    console.error("Error updating GlobalPriceStage:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update price stage" },
      { status: 500 }
    );
  }
}

// DELETE - Delete GlobalPriceStage (only if no linked items)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check for linked items
    const stage = await prisma.globalPriceStage.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            azMarketTypes: true,
            euPrices: true,
            faoPrices: true,
            fpmaSeries: true,
          },
        },
      },
    });

    if (!stage) {
      return NextResponse.json(
        { success: false, error: "Price stage not found" },
        { status: 404 }
      );
    }

    const totalLinked =
      stage._count.azMarketTypes +
      stage._count.euPrices +
      stage._count.faoPrices +
      stage._count.fpmaSeries;

    if (totalLinked > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete: ${totalLinked} items are linked to this price stage`,
        },
        { status: 400 }
      );
    }

    await prisma.globalPriceStage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Price stage deleted" });
  } catch (error) {
    console.error("Error deleting GlobalPriceStage:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete price stage" },
      { status: 500 }
    );
  }
}


