import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Link source product types/commodities to GlobalProductVariety
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { azProductTypeIds, fpmaCommodityIds } = body;

    // Verify GlobalProductVariety exists
    const variety = await prisma.globalProductVariety.findUnique({
      where: { id },
    });

    if (!variety) {
      return NextResponse.json(
        { success: false, error: "GlobalProductVariety not found" },
        { status: 404 }
      );
    }

    let azLinked = 0;
    let fpmaLinked = 0;

    // Link AZ ProductTypes
    if (azProductTypeIds && Array.isArray(azProductTypeIds)) {
      for (const productTypeId of azProductTypeIds) {
        await prisma.productType.update({
          where: { id: productTypeId },
          data: { globalProductVarietyId: id },
        });
        azLinked++;
      }
    }

    // Link FPMA Commodities
    if (fpmaCommodityIds && Array.isArray(fpmaCommodityIds)) {
      for (const commodityId of fpmaCommodityIds) {
        await prisma.fpmaCommodity.update({
          where: { id: commodityId },
          data: { globalProductVarietyId: id },
        });
        fpmaLinked++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Linked ${azLinked} AZ product types and ${fpmaLinked} FPMA commodities`,
      linked: {
        az: azLinked,
        fpma: fpmaLinked,
      },
    });
  } catch (error) {
    console.error("Error linking varieties:", error);
    return NextResponse.json(
      { success: false, error: "Failed to link varieties" },
      { status: 500 }
    );
  }
}

// DELETE - Unlink source product types/commodities from GlobalProductVariety
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { azProductTypeIds, fpmaCommodityIds } = body;

    let azUnlinked = 0;
    let fpmaUnlinked = 0;

    // Unlink AZ ProductTypes
    if (azProductTypeIds && Array.isArray(azProductTypeIds)) {
      for (const productTypeId of azProductTypeIds) {
        await prisma.productType.update({
          where: { id: productTypeId },
          data: { globalProductVarietyId: null },
        });
        azUnlinked++;
      }
    }

    // Unlink FPMA Commodities
    if (fpmaCommodityIds && Array.isArray(fpmaCommodityIds)) {
      for (const commodityId of fpmaCommodityIds) {
        await prisma.fpmaCommodity.update({
          where: { id: commodityId },
          data: { globalProductVarietyId: null },
        });
        fpmaUnlinked++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Unlinked ${azUnlinked} AZ product types and ${fpmaUnlinked} FPMA commodities`,
      unlinked: {
        az: azUnlinked,
        fpma: fpmaUnlinked,
      },
    });
  } catch (error) {
    console.error("Error unlinking varieties:", error);
    return NextResponse.json(
      { success: false, error: "Failed to unlink varieties" },
      { status: 500 }
    );
  }
}


