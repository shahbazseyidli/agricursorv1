import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - List all GlobalMarkets with filters
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const countryId = searchParams.get("countryId");
    const countryCode = searchParams.get("countryCode");
    const search = searchParams.get("search");
    const marketType = searchParams.get("marketType");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = {};

    // Filter by country
    if (countryId) {
      where.globalCountryId = countryId;
    } else if (countryCode) {
      const country = await prisma.globalCountry.findFirst({
        where: { OR: [{ iso2: countryCode }, { iso3: countryCode }] },
      });
      if (country) {
        where.globalCountryId = country.id;
      }
    }

    // Filter by market type
    if (marketType) {
      where.marketType = marketType;
    }

    // Search by name
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nameEn: { contains: search } },
        { nameAz: { contains: search } },
      ];
    }

    const [markets, total] = await Promise.all([
      prisma.globalMarket.findMany({
        where,
        orderBy: [{ globalCountryId: "asc" }, { name: "asc" }],
        skip: offset,
        take: limit,
        include: {
          globalCountry: {
            select: {
              id: true,
              iso2: true,
              iso3: true,
              nameEn: true,
              nameAz: true,
              flagEmoji: true,
            },
          },
          _count: {
            select: {
              azMarkets: true,
              fpmaMarkets: true,
            },
          },
        },
      }),
      prisma.globalMarket.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: markets.map((m) => ({
        id: m.id,
        name: m.name,
        nameEn: m.nameEn,
        nameAz: m.nameAz,
        nameRu: m.nameRu,
        region: m.region,
        city: m.city,
        marketType: m.marketType,
        isNationalAvg: m.isNationalAvg,
        isActive: m.isActive,
        country: m.globalCountry,
        linkedCounts: {
          azMarkets: m._count.azMarkets,
          fpmaMarkets: m._count.fpmaMarkets,
        },
        totalLinked: m._count.azMarkets + m._count.fpmaMarkets,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching GlobalMarkets:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch markets" },
      { status: 500 }
    );
  }
}

// POST - Create new GlobalMarket
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      nameEn,
      nameAz,
      nameRu,
      globalCountryId,
      region,
      city,
      marketType,
      isNationalAvg,
    } = body;

    if (!name || !globalCountryId) {
      return NextResponse.json(
        { success: false, error: "name and globalCountryId are required" },
        { status: 400 }
      );
    }

    // Check if country exists
    const country = await prisma.globalCountry.findUnique({
      where: { id: globalCountryId },
    });

    if (!country) {
      return NextResponse.json(
        { success: false, error: "Country not found" },
        { status: 400 }
      );
    }

    // Check if market already exists in this country
    const existing = await prisma.globalMarket.findFirst({
      where: { globalCountryId, name },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Market "${name}" already exists in this country` },
        { status: 400 }
      );
    }

    const market = await prisma.globalMarket.create({
      data: {
        name,
        nameEn: nameEn || name,
        nameAz,
        nameRu,
        globalCountryId,
        region,
        city,
        marketType: marketType || "PHYSICAL",
        isNationalAvg: isNationalAvg || false,
      },
      include: {
        globalCountry: true,
      },
    });

    return NextResponse.json({ success: true, data: market });
  } catch (error) {
    console.error("Error creating GlobalMarket:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create market" },
      { status: 500 }
    );
  }
}


