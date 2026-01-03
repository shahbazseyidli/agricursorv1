import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface Params {
  params: { id: string };
}

// PATCH: Update GlobalCategory
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
      description,
      descriptionAz,
      icon,
      image,
      sortOrder,
      isActive,
    } = body;

    const category = await prisma.globalCategory.update({
      where: { id: params.id },
      data: {
        ...(nameEn && { nameEn }),
        ...(nameAz !== undefined && { nameAz }),
        ...(nameRu !== undefined && { nameRu }),
        ...(description !== undefined && { description }),
        ...(descriptionAz !== undefined && { descriptionAz }),
        ...(icon !== undefined && { icon }),
        ...(image !== undefined && { image }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error updating global category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}


