import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - List all GlobalPriceStages with related counts
export async function GET() {
  try {
    const stages = await prisma.globalPriceStage.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: {
            azMarketTypes: true,
            euPrices: true,
            faoPrices: true,
            fpmaSeries: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: stages.map((stage) => ({
        id: stage.id,
        code: stage.code,
        nameEn: stage.nameEn,
        nameAz: stage.nameAz,
        nameRu: stage.nameRu,
        description: stage.description,
        sortOrder: stage.sortOrder,
        isActive: stage.isActive,
        linkedCounts: {
          azMarketTypes: stage._count.azMarketTypes,
          euPrices: stage._count.euPrices,
          faoPrices: stage._count.faoPrices,
          fpmaSeries: stage._count.fpmaSeries,
        },
        totalLinked:
          stage._count.azMarketTypes +
          stage._count.euPrices +
          stage._count.faoPrices +
          stage._count.fpmaSeries,
      })),
    });
  } catch (error) {
    console.error("Error fetching GlobalPriceStages:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch price stages" },
      { status: 500 }
    );
  }
}

// POST - Create new GlobalPriceStage
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, nameEn, nameAz, nameRu, description, sortOrder } = body;

    if (!code || !nameEn) {
      return NextResponse.json(
        { success: false, error: "code and nameEn are required" },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await prisma.globalPriceStage.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Price stage with code ${code} already exists` },
        { status: 400 }
      );
    }

    const stage = await prisma.globalPriceStage.create({
      data: {
        code: code.toUpperCase(),
        nameEn,
        nameAz,
        nameRu,
        description,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json({ success: true, data: stage });
  } catch (error) {
    console.error("Error creating GlobalPriceStage:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create price stage" },
      { status: 500 }
    );
  }
}


