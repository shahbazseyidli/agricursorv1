import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List product types (optionally by product)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    const where: any = {};
    if (productId) where.productId = productId;

    const productTypes = await prisma.productType.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: { prices: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: productTypes });
  } catch (error) {
    console.error("Error fetching product types:", error);
    return NextResponse.json(
      { success: false, message: "Məhsul növləri yüklənərkən xəta baş verdi" },
      { status: 500 }
    );
  }
}

// POST - Create new product type
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
    const { name, nameEn, nameRu, aliases, productId } = body;

    if (!name || !productId) {
      return NextResponse.json(
        { success: false, message: "Ad və məhsul tələb olunur" },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await prisma.productType.findFirst({
      where: {
        name,
        productId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "Bu adla məhsul növü artıq mövcuddur" },
        { status: 400 }
      );
    }

    const productType = await prisma.productType.create({
      data: {
        name,
        nameEn,
        nameRu,
        aliases,
        productId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: productType });
  } catch (error) {
    console.error("Error creating product type:", error);
    return NextResponse.json(
      { success: false, message: "Məhsul növü yaradılarkən xəta baş verdi" },
      { status: 500 }
    );
  }
}




