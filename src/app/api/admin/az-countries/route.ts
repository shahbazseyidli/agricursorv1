import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: List all AZ Countries
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const countries = await prisma.country.findMany({
      select: {
        id: true,
        iso2: true,
        name: true,
        nameEn: true,
        globalCountryId: true,
      },
      orderBy: { name: "asc" },
    });

    const mappedCountries = countries.map(c => ({
      id: c.id,
      name: c.name,
      nameEn: c.nameEn || c.name,
      code: c.iso2,
      globalCountryId: c.globalCountryId,
    }));

    return NextResponse.json({
      success: true,
      data: mappedCountries,
    });
  } catch (error) {
    console.error("Error fetching AZ countries:", error);
    return NextResponse.json(
      { error: "Failed to fetch AZ countries" },
      { status: 500 }
    );
  }
}

