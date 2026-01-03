import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: List GlobalProductVarieties (optionally filtered by product)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const unmapped = searchParams.get("unmapped") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = { isActive: true };
    
    if (productId) {
      where.globalProductId = productId;
    }
    
    if (unmapped) {
      // Varieties that were auto-matched with low confidence
      where.isAutoMatched = true;
      where.matchScore = { lt: 0.8 };
    }

    const [varieties, total] = await Promise.all([
      prisma.globalProductVariety.findMany({
        where,
        include: {
          globalProduct: {
            select: { id: true, slug: true, nameEn: true, nameAz: true }
          },
          _count: {
            select: {
              productTypes: true,
              fpmaCommodities: true,
            }
          }
        },
        orderBy: [
          { globalProductId: "asc" },
          { sortOrder: "asc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.globalProductVariety.count({ where }),
    ]);

    return NextResponse.json({
      varieties,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching global varieties:", error);
    return NextResponse.json(
      { error: "Failed to fetch varieties" },
      { status: 500 }
    );
  }
}

// POST: Create new GlobalProductVariety
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { globalProductId, slug, nameEn, nameAz, hsCode, image } = body;

    if (!globalProductId || !slug || !nameEn) {
      return NextResponse.json(
        { error: "globalProductId, slug and nameEn are required" },
        { status: 400 }
      );
    }

    const variety = await prisma.globalProductVariety.create({
      data: {
        globalProductId,
        slug,
        nameEn,
        nameAz,
        hsCode,
        image,
        isAutoMatched: false,
        matchScore: 1.0,
        isActive: true,
      },
      include: {
        globalProduct: true,
      },
    });

    return NextResponse.json({ variety });
  } catch (error) {
    console.error("Error creating global variety:", error);
    return NextResponse.json(
      { error: "Failed to create variety" },
      { status: 500 }
    );
  }
}

