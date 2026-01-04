import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST - Link/unlink a source item to a variety
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { source, sourceId, varietyId } = body;

    if (!source || !sourceId) {
      return NextResponse.json(
        { error: "source and sourceId are required" },
        { status: 400 }
      );
    }

    // varietyId can be null to unlink
    const newVarietyId = varietyId === "__unlink__" ? null : (varietyId || null);

    let result;

    switch (source) {
      case "azProductType":
        result = await prisma.productType.update({
          where: { id: sourceId },
          data: { globalProductVarietyId: newVarietyId },
          include: {
            globalProductVariety: {
              select: { id: true, nameEn: true, nameAz: true }
            }
          }
        });
        break;

      case "euProduct":
        result = await prisma.euProduct.update({
          where: { id: sourceId },
          data: { globalProductVarietyId: newVarietyId },
          include: {
            globalProductVariety: {
              select: { id: true, nameEn: true, nameAz: true }
            }
          }
        });
        break;

      case "faoProduct":
        result = await prisma.faoProduct.update({
          where: { id: sourceId },
          data: { globalProductVarietyId: newVarietyId },
          include: {
            globalProductVariety: {
              select: { id: true, nameEn: true, nameAz: true }
            }
          }
        });
        break;

      case "fpmaCommodity":
        result = await prisma.fpmaCommodity.update({
          where: { id: sourceId },
          data: { globalProductVarietyId: newVarietyId },
          include: {
            globalProductVariety: {
              select: { id: true, nameEn: true, nameAz: true }
            }
          }
        });
        break;

      default:
        return NextResponse.json(
          { error: "Invalid source type. Must be one of: azProductType, euProduct, faoProduct, fpmaCommodity" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: { result },
      message: newVarietyId ? "Linked successfully" : "Unlinked successfully",
    });
  } catch (error) {
    console.error("Error linking variety:", error);
    return NextResponse.json(
      { error: "Failed to link variety" },
      { status: 500 }
    );
  }
}

