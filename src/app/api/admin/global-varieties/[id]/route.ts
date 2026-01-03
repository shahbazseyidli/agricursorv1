import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface Params {
  params: { id: string };
}

// GET: Get single GlobalProductVariety with full details
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const variety = await prisma.globalProductVariety.findUnique({
      where: { id: params.id },
      include: {
        globalProduct: {
          include: { globalCategory: true }
        },
        productTypes: {
          include: { product: true }
        },
        fpmaCommodities: true,
      },
    });

    if (!variety) {
      return NextResponse.json({ error: "Variety not found" }, { status: 404 });
    }

    return NextResponse.json({ variety });
  } catch (error) {
    console.error("Error fetching global variety:", error);
    return NextResponse.json(
      { error: "Failed to fetch variety" },
      { status: 500 }
    );
  }
}

// PATCH: Update GlobalProductVariety
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      nameEn,
      nameAz,
      nameRu,
      hsCode,
      image,
      description,
      globalProductId,
      sortOrder,
      isActive,
    } = body;

    const variety = await prisma.globalProductVariety.update({
      where: { id: params.id },
      data: {
        ...(nameEn && { nameEn }),
        ...(nameAz !== undefined && { nameAz }),
        ...(nameRu !== undefined && { nameRu }),
        ...(hsCode !== undefined && { hsCode }),
        ...(image !== undefined && { image }),
        ...(description !== undefined && { description }),
        ...(globalProductId && { globalProductId }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
        // Mark as manually updated
        isAutoMatched: false,
        matchScore: 1.0,
      },
      include: {
        globalProduct: true,
      },
    });

    return NextResponse.json({ variety });
  } catch (error) {
    console.error("Error updating global variety:", error);
    return NextResponse.json(
      { error: "Failed to update variety" },
      { status: 500 }
    );
  }
}

// DELETE: Soft delete GlobalProductVariety
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const variety = await prisma.globalProductVariety.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({ variety, message: "Variety deactivated" });
  } catch (error) {
    console.error("Error deleting global variety:", error);
    return NextResponse.json(
      { error: "Failed to delete variety" },
      { status: 500 }
    );
  }
}

