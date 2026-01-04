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
        itemNameEn: true,
        itemCode: true,
        globalProductId: true,
      },
      orderBy: { itemNameEn: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Error fetching FAO products:", error);
    return NextResponse.json(
      { error: "Failed to fetch FAO products" },
      { status: 500 }
    );
  }
}

