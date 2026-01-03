import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Link source markets to GlobalMarket
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { azMarketIds, fpmaMarketIds } = body;

    // Verify GlobalMarket exists
    const globalMarket = await prisma.globalMarket.findUnique({
      where: { id },
    });

    if (!globalMarket) {
      return NextResponse.json(
        { success: false, error: "GlobalMarket not found" },
        { status: 404 }
      );
    }

    let azLinked = 0;
    let fpmaLinked = 0;

    // Link AZ Markets
    if (azMarketIds && Array.isArray(azMarketIds)) {
      for (const marketId of azMarketIds) {
        await prisma.market.update({
          where: { id: marketId },
          data: { globalMarketId: id },
        });
        azLinked++;
      }
    }

    // Link FPMA Markets
    if (fpmaMarketIds && Array.isArray(fpmaMarketIds)) {
      for (const marketId of fpmaMarketIds) {
        await prisma.fpmaMarket.update({
          where: { id: marketId },
          data: { globalMarketId: id },
        });
        fpmaLinked++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Linked ${azLinked} AZ markets and ${fpmaLinked} FPMA markets`,
      linked: {
        az: azLinked,
        fpma: fpmaLinked,
      },
    });
  } catch (error) {
    console.error("Error linking markets:", error);
    return NextResponse.json(
      { success: false, error: "Failed to link markets" },
      { status: 500 }
    );
  }
}

// DELETE - Unlink source markets from GlobalMarket
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { azMarketIds, fpmaMarketIds } = body;

    let azUnlinked = 0;
    let fpmaUnlinked = 0;

    // Unlink AZ Markets
    if (azMarketIds && Array.isArray(azMarketIds)) {
      for (const marketId of azMarketIds) {
        await prisma.market.update({
          where: { id: marketId },
          data: { globalMarketId: null },
        });
        azUnlinked++;
      }
    }

    // Unlink FPMA Markets
    if (fpmaMarketIds && Array.isArray(fpmaMarketIds)) {
      for (const marketId of fpmaMarketIds) {
        await prisma.fpmaMarket.update({
          where: { id: marketId },
          data: { globalMarketId: null },
        });
        fpmaUnlinked++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Unlinked ${azUnlinked} AZ markets and ${fpmaUnlinked} FPMA markets`,
      unlinked: {
        az: azUnlinked,
        fpma: fpmaUnlinked,
      },
    });
  } catch (error) {
    console.error("Error unlinking markets:", error);
    return NextResponse.json(
      { success: false, error: "Failed to unlink markets" },
      { status: 500 }
    );
  }
}


