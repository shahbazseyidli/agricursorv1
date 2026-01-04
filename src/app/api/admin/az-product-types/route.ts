import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Fetch AZ product types
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const productId = searchParams.get("productId");
    const unlinked = searchParams.get("unlinked") === "true";

    const where: any = {};
    
    if (search) {
      where.name = { contains: search };
    }
    
    if (productId) {
      where.productId = productId;
    }
    
    if (unlinked) {
      where.globalProductVarietyId = null;
    }

    const [productTypes, total] = await Promise.all([
      prisma.productType.findMany({
        where,
        include: {
          product: {
            select: { id: true, name: true, nameEn: true }
          },
          globalProductVariety: {
            select: { 
              id: true, 
              nameEn: true, 
              nameAz: true,
              globalProduct: {
                select: { id: true, nameEn: true, nameAz: true }
              }
            }
          },
        },
        orderBy: [
          { product: { name: "asc" } },
          { name: "asc" }
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.productType.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        productTypes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching product types:", error);
    return NextResponse.json(
      { error: "Failed to fetch product types" },
      { status: 500 }
    );
  }
}

