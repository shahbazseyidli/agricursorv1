import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: List all EU Countries
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const countries = await prisma.euCountry.findMany({
      select: {
        id: true,
        code: true,
        nameEn: true,
        nameAz: true,
        globalCountryId: true,
      },
      orderBy: { nameEn: "asc" },
    });

    const mappedCountries = countries.map(c => ({
      id: c.id,
      name: c.nameAz || c.nameEn,
      nameEn: c.nameEn,
      code: c.code,
      globalCountryId: c.globalCountryId,
    }));

    return NextResponse.json({
      success: true,
      data: mappedCountries,
    });
  } catch (error) {
    console.error("Error fetching EU countries:", error);
    return NextResponse.json(
      { error: "Failed to fetch EU countries" },
      { status: 500 }
    );
  }
}

