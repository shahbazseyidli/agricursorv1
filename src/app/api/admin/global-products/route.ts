import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: List all GlobalProducts with relations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = { isActive: true };
    
    if (categoryId) {
      where.globalCategoryId = categoryId;
    }
    
    if (search) {
      where.OR = [
        { nameEn: { contains: search } },
        { nameAz: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.globalProduct.findMany({
        where,
        include: {
          globalCategory: {
            select: { id: true, slug: true, nameEn: true, nameAz: true }
          },
          _count: {
            select: {
              productVarieties: true,
              localProducts: true,
              euProducts: true,
              faoProducts: true,
              fpmaCommodities: true,
            }
          }
        },
        orderBy: { nameEn: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.globalProduct.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching global products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST: Create new GlobalProduct
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { slug, nameEn, nameAz, globalCategoryId, hsCode, image } = body;

    if (!slug || !nameEn) {
      return NextResponse.json(
        { error: "slug and nameEn are required" },
        { status: 400 }
      );
    }

    const product = await prisma.globalProduct.create({
      data: {
        slug,
        nameEn,
        nameAz,
        globalCategoryId,
        hsCode,
        image,
        isActive: true,
      },
      include: {
        globalCategory: true,
      },
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("Error creating global product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
