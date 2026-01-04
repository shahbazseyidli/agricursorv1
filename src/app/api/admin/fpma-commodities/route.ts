import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: List all FPMA Commodities
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const commodities = await prisma.fpmaCommodity.findMany({
      select: {
        id: true,
        nameEn: true,
        nameAz: true,
        code: true,
        baseCode: true,
        varietyName: true,
        globalProductId: true,
      },
      orderBy: { nameEn: "asc" },
    });

    // Map to expected format
    const mappedCommodities = commodities.map(c => ({
      id: c.id,
      name: c.nameAz || c.nameEn,
      nameEn: c.nameEn,
      nameAz: c.nameAz,
      code: c.code,
      baseCode: c.baseCode,
      varietyName: c.varietyName,
      globalProductId: c.globalProductId,
    }));

    return NextResponse.json({
      success: true,
      data: mappedCommodities,
    });
  } catch (error) {
    console.error("Error fetching FPMA commodities:", error);
    return NextResponse.json(
      { error: "Failed to fetch FPMA commodities" },
      { status: 500 }
    );
  }
}

