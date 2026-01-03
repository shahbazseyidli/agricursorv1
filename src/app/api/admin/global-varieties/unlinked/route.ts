import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Get unlinked product types and FPMA commodities
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const source = searchParams.get("source"); // az, fpma, or all
    const globalProductId = searchParams.get("globalProductId");

    const result: any = {};

    // Get unlinked AZ ProductTypes
    if (!source || source === "az" || source === "all") {
      const azWhere: any = { globalProductVarietyId: null };
      
      if (globalProductId) {
        // Get the local product ID for this global product
        const localProducts = await prisma.product.findMany({
          where: { globalProductId },
          select: { id: true }
        });
        if (localProducts.length > 0) {
          azWhere.productId = { in: localProducts.map(p => p.id) };
        }
      }

      const unlinkedAz = await prisma.productType.findMany({
        where: azWhere,
        include: {
          product: {
            include: {
              globalProduct: { select: { id: true, slug: true, nameAz: true } }
            }
          },
        },
        orderBy: { name: "asc" },
      });

      result.azProductTypes = unlinkedAz.map((pt) => ({
        id: pt.id,
        name: pt.name,
        productName: pt.product.name,
        productSlug: pt.product.slug,
        globalProductId: pt.product.globalProductId,
        globalProductSlug: pt.product.globalProduct?.slug,
      }));
    }

    // Get unlinked FPMA Commodities
    if (!source || source === "fpma" || source === "all") {
      const fpmaWhere: any = { globalProductVarietyId: null };
      
      if (globalProductId) {
        fpmaWhere.globalProductId = globalProductId;
      }

      const unlinkedFpma = await prisma.fpmaCommodity.findMany({
        where: fpmaWhere,
        include: {
          globalProduct: { select: { id: true, slug: true, nameAz: true } },
        },
        orderBy: { nameEn: "asc" },
      });

      result.fpmaCommodities = unlinkedFpma.map((c) => ({
        id: c.id,
        code: c.code,
        baseCode: c.baseCode,
        nameEn: c.nameEn,
        nameAz: c.nameAz,
        varietyName: c.varietyName,
        globalProductId: c.globalProductId,
        globalProductSlug: c.globalProduct?.slug,
      }));
    }

    // Summary
    result.summary = {
      unlinkedAzProductTypes: result.azProductTypes?.length || 0,
      unlinkedFpmaCommodities: result.fpmaCommodities?.length || 0,
      total: (result.azProductTypes?.length || 0) + (result.fpmaCommodities?.length || 0),
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching unlinked varieties:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch unlinked varieties" },
      { status: 500 }
    );
  }
}


