import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - List market types by country
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const countryId = searchParams.get("countryId");

    const where: any = {};
    if (countryId) where.countryId = countryId;

    const marketTypes = await prisma.marketType.findMany({
      where,
      include: {
        country: true,
        _count: {
          select: { markets: true },
        },
      },
      orderBy: { nameAz: "asc" },
    });

    return NextResponse.json({ success: true, data: marketTypes });
  } catch (error) {
    console.error("Error fetching market types:", error);
    return NextResponse.json(
      { success: false, message: "Bazar tipləri yüklənərkən xəta baş verdi" },
      { status: 500 }
    );
  }
}








