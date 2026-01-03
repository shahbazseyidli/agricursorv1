import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Link source price stages to GlobalPriceStage
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { azMarketTypeIds } = body;

    // Verify GlobalPriceStage exists
    const globalStage = await prisma.globalPriceStage.findUnique({
      where: { id },
    });

    if (!globalStage) {
      return NextResponse.json(
        { success: false, error: "GlobalPriceStage not found" },
        { status: 404 }
      );
    }

    let linked = 0;

    // Link AZ MarketTypes
    if (azMarketTypeIds && Array.isArray(azMarketTypeIds)) {
      for (const marketTypeId of azMarketTypeIds) {
        await prisma.marketType.update({
          where: { id: marketTypeId },
          data: { globalPriceStageId: id },
        });
        linked++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Linked ${linked} AZ market types`,
      linked,
    });
  } catch (error) {
    console.error("Error linking price stages:", error);
    return NextResponse.json(
      { success: false, error: "Failed to link price stages" },
      { status: 500 }
    );
  }
}

// DELETE - Unlink source price stages from GlobalPriceStage
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { azMarketTypeIds } = body;

    let unlinked = 0;

    // Unlink AZ MarketTypes
    if (azMarketTypeIds && Array.isArray(azMarketTypeIds)) {
      for (const marketTypeId of azMarketTypeIds) {
        await prisma.marketType.update({
          where: { id: marketTypeId },
          data: { globalPriceStageId: null },
        });
        unlinked++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Unlinked ${unlinked} AZ market types`,
      unlinked,
    });
  } catch (error) {
    console.error("Error unlinking price stages:", error);
    return NextResponse.json(
      { success: false, error: "Failed to unlink price stages" },
      { status: 500 }
    );
  }
}


