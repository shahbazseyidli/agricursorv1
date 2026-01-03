import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get price statistics
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const countryId = searchParams.get("countryId");

    const where: any = {};
    if (countryId) where.countryId = countryId;

    const totalPrices = await prisma.price.count({ where });

    // Get date range
    const dateRange = await prisma.price.aggregate({
      where,
      _min: { date: true },
      _max: { date: true },
    });

    // Get counts by market type
    const pricesByMarket = await prisma.price.groupBy({
      by: ["marketId"],
      where,
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        total: totalPrices,
        dateRange: {
          from: dateRange._min.date,
          to: dateRange._max.date,
        },
        marketCount: pricesByMarket.length,
      },
    });
  } catch (error) {
    console.error("Error fetching price stats:", error);
    return NextResponse.json(
      { success: false, message: "Qiymət statistikası yüklənərkən xəta baş verdi" },
      { status: 500 }
    );
  }
}

// DELETE - Clear all prices
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
    const marketTypeId = searchParams.get("marketTypeId");
    const productId = searchParams.get("productId");

    const where: any = {};
    if (countryId) where.countryId = countryId;
    if (productId) where.productId = productId;

    // If marketTypeId is provided, get all markets of that type
    if (marketTypeId) {
      const markets = await prisma.market.findMany({
        where: { marketTypeId },
        select: { id: true },
      });
      where.marketId = { in: markets.map((m) => m.id) };
    }

    const deleted = await prisma.price.deleteMany({ where });

    return NextResponse.json({
      success: true,
      message: `${deleted.count} qiymət silindi`,
      data: {
        pricesDeleted: deleted.count,
      },
    });
  } catch (error) {
    console.error("Error clearing prices:", error);
    return NextResponse.json(
      { success: false, message: "Qiymətlər silinərkən xəta baş verdi" },
      { status: 500 }
    );
  }
}







