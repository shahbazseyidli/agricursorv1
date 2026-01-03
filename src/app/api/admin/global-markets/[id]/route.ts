import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Get single GlobalMarket with all linked items
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const market = await prisma.globalMarket.findUnique({
      where: { id },
      include: {
        globalCountry: true,
        azMarkets: {
          include: {
            marketType: true,
            country: true,
          },
        },
        fpmaMarkets: {
          include: {
            country: true,
          },
        },
      },
    });

    if (!market) {
      return NextResponse.json(
        { success: false, error: "Market not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: market });
  } catch (error) {
    console.error("Error fetching GlobalMarket:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch market" },
      { status: 500 }
    );
  }
}

// PUT - Update GlobalMarket
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      name,
      nameEn,
      nameAz,
      nameRu,
      region,
      city,
      marketType,
      isNationalAvg,
      isActive,
      sortOrder,
    } = body;

    const market = await prisma.globalMarket.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(nameEn !== undefined && { nameEn }),
        ...(nameAz !== undefined && { nameAz }),
        ...(nameRu !== undefined && { nameRu }),
        ...(region !== undefined && { region }),
        ...(city !== undefined && { city }),
        ...(marketType !== undefined && { marketType }),
        ...(isNationalAvg !== undefined && { isNationalAvg }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
      include: {
        globalCountry: true,
      },
    });

    return NextResponse.json({ success: true, data: market });
  } catch (error) {
    console.error("Error updating GlobalMarket:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update market" },
      { status: 500 }
    );
  }
}

// DELETE - Delete GlobalMarket (only if no linked items)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check for linked items
    const market = await prisma.globalMarket.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            azMarkets: true,
            fpmaMarkets: true,
          },
        },
      },
    });

    if (!market) {
      return NextResponse.json(
        { success: false, error: "Market not found" },
        { status: 404 }
      );
    }

    const totalLinked = market._count.azMarkets + market._count.fpmaMarkets;

    if (totalLinked > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete: ${totalLinked} items are linked to this market`,
        },
        { status: 400 }
      );
    }

    await prisma.globalMarket.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Market deleted" });
  } catch (error) {
    console.error("Error deleting GlobalMarket:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete market" },
      { status: 500 }
    );
  }
}


