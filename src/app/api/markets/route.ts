import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const where: any = {};

    if (type) {
      where.marketType = { code: type };
    }

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const markets = await prisma.market.findMany({
      where,
      include: {
        marketType: true,
        country: true,
        _count: {
          select: { prices: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      data: markets,
    });
  } catch (error) {
    console.error("Markets API error:", error);
    return NextResponse.json(
      { error: "Xəta baş verdi" },
      { status: 500 }
    );
  }
}

