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
        name: true,
        code: true,
        globalProductId: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: commodities,
    });
  } catch (error) {
    console.error("Error fetching FPMA commodities:", error);
    return NextResponse.json(
      { error: "Failed to fetch FPMA commodities" },
      { status: 500 }
    );
  }
}

