import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Fetch all varieties for a global product
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const globalProductId = searchParams.get("globalProductId");
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};
    
    if (globalProductId) {
      where.globalProductId = globalProductId;
    }
    
    if (search) {
      where.OR = [
        { nameEn: { contains: search } },
        { nameAz: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    const [varieties, total] = await Promise.all([
      prisma.globalProductVariety.findMany({
        where,
        include: {
          globalProduct: {
            select: { id: true, nameEn: true, nameAz: true, slug: true }
          },
          productTypes: {
            select: { id: true, name: true, productId: true }
          },
          fpmaCommodities: {
            select: { id: true, nameEn: true, code: true }
          },
          euProducts: {
            select: { id: true, nameEn: true, eurostatCode: true }
          },
          faoProducts: {
            select: { id: true, nameEn: true, itemCode: true }
          },
          _count: {
            select: {
              productTypes: true,
              fpmaCommodities: true,
              euProducts: true,
              faoProducts: true,
            }
          }
        },
        orderBy: [
          { globalProductId: "asc" },
          { sortOrder: "asc" },
          { nameEn: "asc" }
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.globalProductVariety.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        varieties,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching varieties:", error);
    return NextResponse.json(
      { error: "Failed to fetch varieties" },
      { status: 500 }
    );
  }
}

// POST - Create a new variety
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { globalProductId, slug, nameEn, nameAz, description, hsCode } = body;

    if (!globalProductId || !slug || !nameEn) {
      return NextResponse.json(
        { error: "globalProductId, slug, and nameEn are required" },
        { status: 400 }
      );
    }

    // Check if variety already exists
    const existing = await prisma.globalProductVariety.findUnique({
      where: {
        globalProductId_slug: {
          globalProductId,
          slug,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Variety with this slug already exists for this product" },
        { status: 400 }
      );
    }

    const variety = await prisma.globalProductVariety.create({
      data: {
        globalProductId,
        slug,
        nameEn,
        nameAz,
        description,
        hsCode,
      },
      include: {
        globalProduct: {
          select: { id: true, nameEn: true, nameAz: true, slug: true }
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { variety },
    });
  } catch (error) {
    console.error("Error creating variety:", error);
    return NextResponse.json(
      { error: "Failed to create variety" },
      { status: 500 }
    );
  }
}
