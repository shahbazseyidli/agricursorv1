import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: List all GlobalCategories
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await prisma.globalCategory.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { globalProducts: true, localCategories: true }
        }
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching global categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST: Create new GlobalCategory
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { code, slug, nameEn, nameAz, description, icon, image, sortOrder } = body;

    if (!code || !slug || !nameEn) {
      return NextResponse.json(
        { error: "code, slug and nameEn are required" },
        { status: 400 }
      );
    }

    const category = await prisma.globalCategory.create({
      data: {
        code,
        slug,
        nameEn,
        nameAz,
        description,
        icon,
        image,
        sortOrder: sortOrder || 0,
        isActive: true,
      },
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error creating global category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

