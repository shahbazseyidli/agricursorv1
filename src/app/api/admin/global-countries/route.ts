import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: List all GlobalCountries with relations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const region = searchParams.get("region");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = { isActive: true };
    
    if (region && region !== "all") {
      where.region = region;
    }
    
    if (search) {
      where.OR = [
        { nameEn: { contains: search } },
        { nameAz: { contains: search } },
        { iso2: { contains: search } },
        { iso3: { contains: search } },
      ];
    }

    const [countries, total] = await Promise.all([
      prisma.globalCountry.findMany({
        where,
        include: {
          _count: {
            select: {
              azCountries: true,
              euCountries: true,
              faoCountries: true,
              fpmaCountries: true,
              globalMarkets: true,
            }
          }
        },
        orderBy: { nameEn: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.globalCountry.count({ where }),
    ]);

    // Get unique regions for filter
    const regions = await prisma.globalCountry.findMany({
      where: { isActive: true },
      select: { region: true },
      distinct: ["region"],
    });

    return NextResponse.json({
      success: true,
      data: countries,
      regions: regions.map(r => r.region),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching global countries:", error);
    return NextResponse.json(
      { error: "Failed to fetch countries" },
      { status: 500 }
    );
  }
}

// POST: Create new GlobalCountry
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { iso2, iso3, nameEn, nameAz, region, subRegion, flagEmoji } = body;

    if (!iso2 || !iso3 || !nameEn || !region) {
      return NextResponse.json(
        { error: "iso2, iso3, nameEn, and region are required" },
        { status: 400 }
      );
    }

    const country = await prisma.globalCountry.create({
      data: {
        iso2: iso2.toUpperCase(),
        iso3: iso3.toUpperCase(),
        nameEn,
        nameAz,
        region,
        subRegion,
        flagEmoji,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, data: country });
  } catch (error) {
    console.error("Error creating global country:", error);
    return NextResponse.json(
      { error: "Failed to create country" },
      { status: 500 }
    );
  }
}

