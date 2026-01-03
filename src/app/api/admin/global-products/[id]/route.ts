import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const product = await prisma.globalProduct.findUnique({
      where: { id },
      include: {
        localProducts: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        euProducts: {
          select: {
            id: true,
            nameEn: true,
            nameAz: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("Error fetching global product:", error);
    return NextResponse.json(
      { success: false, error: "Xəta baş verdi" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    
    const {
      nameAz,
      nameEn,
      image,
      category,
      defaultUnit,
      faoCode,
      eurostatCode,
      descriptionAz,
      descriptionEn,
      historyAz,
      historyEn,
      usesAz,
      usesEn,
      productionRegionsAz,
      productionRegionsEn,
      growingConditionsAz,
      growingConditionsEn,
      isActive,
    } = body;

    const product = await prisma.globalProduct.update({
      where: { id },
      data: {
        ...(nameAz !== undefined && { nameAz }),
        ...(nameEn !== undefined && { nameEn }),
        ...(image !== undefined && { image }),
        ...(category !== undefined && { category }),
        ...(defaultUnit !== undefined && { defaultUnit }),
        ...(faoCode !== undefined && { faoCode }),
        ...(eurostatCode !== undefined && { eurostatCode }),
        ...(descriptionAz !== undefined && { descriptionAz }),
        ...(descriptionEn !== undefined && { descriptionEn }),
        ...(historyAz !== undefined && { historyAz }),
        ...(historyEn !== undefined && { historyEn }),
        ...(usesAz !== undefined && { usesAz }),
        ...(usesEn !== undefined && { usesEn }),
        ...(productionRegionsAz !== undefined && { productionRegionsAz }),
        ...(productionRegionsEn !== undefined && { productionRegionsEn }),
        ...(growingConditionsAz !== undefined && { growingConditionsAz }),
        ...(growingConditionsEn !== undefined && { growingConditionsEn }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    console.error("Error updating global product:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Xəta baş verdi" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    await prisma.globalProduct.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Deleted" });
  } catch (error: any) {
    console.error("Error deleting global product:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Xəta baş verdi" },
      { status: 500 }
    );
  }
}

