import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List all markets with filters
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const countryId = searchParams.get("countryId");
    const marketTypeId = searchParams.get("marketTypeId");

    const where: any = {};
    if (countryId) where.countryId = countryId;
    if (marketTypeId) where.marketTypeId = marketTypeId;

    const markets = await prisma.market.findMany({
      where,
      include: {
        country: true,
        marketType: true,
        _count: {
          select: { prices: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: markets });
  } catch (error) {
    console.error("Error fetching markets:", error);
    return NextResponse.json(
      { success: false, message: "Bazarlar yüklənərkən xəta baş verdi" },
      { status: 500 }
    );
  }
}

// POST - Create new market
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
    const { name, nameEn, nameRu, aliases, countryId, marketTypeId } = body;

    if (!name || !countryId || !marketTypeId) {
      return NextResponse.json(
        { success: false, message: "Ad, ölkə və bazar tipi tələb olunur" },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await prisma.market.findFirst({
      where: {
        name,
        countryId,
        marketTypeId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "Bu bazar artıq mövcuddur" },
        { status: 400 }
      );
    }

    const market = await prisma.market.create({
      data: {
        name,
        nameEn,
        nameRu,
        aliases,
        countryId,
        marketTypeId,
      },
      include: {
        country: true,
        marketType: true,
      },
    });

    return NextResponse.json({ success: true, data: market });
  } catch (error) {
    console.error("Error creating market:", error);
    return NextResponse.json(
      { success: false, message: "Bazar yaradılarkən xəta baş verdi" },
      { status: 500 }
    );
  }
}

// DELETE - Clear all markets (with cascade to prices)
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "İcazə yoxdur" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const countryId = searchParams.get("countryId");

    // First delete all prices associated with markets
    const priceDeleteWhere: any = {};
    if (countryId) priceDeleteWhere.countryId = countryId;

    const deletedPrices = await prisma.price.deleteMany({
      where: priceDeleteWhere,
    });

    // Then delete markets
    const marketDeleteWhere: any = {};
    if (countryId) marketDeleteWhere.countryId = countryId;

    const deletedMarkets = await prisma.market.deleteMany({
      where: marketDeleteWhere,
    });

    return NextResponse.json({
      success: true,
      message: `${deletedMarkets.count} bazar və ${deletedPrices.count} qiymət silindi`,
      data: {
        marketsDeleted: deletedMarkets.count,
        pricesDeleted: deletedPrices.count,
      },
    });
  } catch (error) {
    console.error("Error clearing markets:", error);
    return NextResponse.json(
      { success: false, message: "Bazarlar silinərkən xəta baş verdi" },
      { status: 500 }
    );
  }
}







