import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: List all FPMA Countries
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const countries = await prisma.fpmaCountry.findMany({
      select: {
        id: true,
        iso2: true,
        iso3: true,
        nameEn: true,
        nameAz: true,
        region: true,
        globalCountryId: true,
      },
      orderBy: { nameEn: "asc" },
    });

    const mappedCountries = countries.map(c => ({
      id: c.id,
      name: c.nameAz || c.nameEn,
      nameEn: c.nameEn,
      code: c.iso3 || c.iso2,
      region: c.region,
      globalCountryId: c.globalCountryId,
    }));

    return NextResponse.json({
      success: true,
      data: mappedCountries,
    });
  } catch (error) {
    console.error("Error fetching FPMA countries:", error);
    return NextResponse.json(
      { error: "Failed to fetch FPMA countries" },
      { status: 500 }
    );
  }
}

