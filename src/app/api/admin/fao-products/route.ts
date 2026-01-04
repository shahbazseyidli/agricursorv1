import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: List all FAO Products
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const products = await prisma.faoProduct.findMany({
      select: {
        id: true,
        nameEn: true,
        nameAz: true,
        itemCode: true,
        cpcCode: true,
        category: true,
        globalProductId: true,
        globalProductVarietyId: true,
        globalProductVariety: {
          select: { id: true, nameEn: true, nameAz: true }
        },
      },
      orderBy: { nameEn: "asc" },
    });

    // Map to expected format
    const mappedProducts = products.map(p => ({
      id: p.id,
      itemNameEn: p.nameEn,
      name: p.nameAz || p.nameEn,
      nameEn: p.nameEn,
      nameAz: p.nameAz,
      itemCode: p.itemCode,
      cpcCode: p.cpcCode,
      category: p.category,
      globalProductId: p.globalProductId,
      globalProductVarietyId: p.globalProductVarietyId,
      globalProductVariety: p.globalProductVariety,
    }));

    return NextResponse.json({
      success: true,
      data: mappedProducts,
    });
  } catch (error) {
    console.error("Error fetching FAO products:", error);
    return NextResponse.json(
      { error: "Failed to fetch FAO products" },
      { status: 500 }
    );
  }
}

