import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    // Check admin permission
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const products = await prisma.globalProduct.findMany({
      orderBy: { nameEn: "asc" },
      include: {
        _count: {
          select: {
            localProducts: true,
            euProducts: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error("Error fetching global products:", error);
    return NextResponse.json(
      { success: false, error: "Xəta baş verdi" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { nameAz, nameEn, slug, category, defaultUnit, image, faoCode, eurostatCode } = body;

    if (!nameEn || !slug) {
      return NextResponse.json(
        { success: false, error: "nameEn and slug are required" },
        { status: 400 }
      );
    }

    const product = await prisma.globalProduct.create({
      data: {
        nameAz,
        nameEn,
        slug,
        category,
        defaultUnit: defaultUnit || "kg",
        image,
        faoCode,
        eurostatCode,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    console.error("Error creating global product:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Xəta baş verdi" },
      { status: 500 }
    );
  }
}


