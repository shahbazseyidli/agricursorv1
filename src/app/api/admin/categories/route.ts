import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List all categories
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const countryId = searchParams.get("countryId");

    const where: any = {};
    if (countryId) where.countryId = countryId;

    const categories = await prisma.category.findMany({
      where,
      include: {
        country: true,
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { success: false, message: "Kateqoriyalar yüklənərkən xəta baş verdi" },
      { status: 500 }
    );
  }
}

// POST - Create new category
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "İcazə yoxdur" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, nameEn, nameRu, slug, aliases, countryId } = body;

    if (!name || !slug || !countryId) {
      return NextResponse.json(
        { success: false, message: "Ad, slug və ölkə tələb olunur" },
        { status: 400 }
      );
    }

    // Check for duplicate slug in country
    const existing = await prisma.category.findFirst({
      where: {
        slug,
        countryId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "Bu slug ilə kateqoriya artıq mövcuddur" },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        nameEn,
        nameRu,
        slug,
        aliases,
        countryId,
      },
      include: {
        country: true,
      },
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { success: false, message: "Kateqoriya yaradılarkən xəta baş verdi" },
      { status: 500 }
    );
  }
}





