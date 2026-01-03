import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Get unlinked markets from all sources
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const source = searchParams.get("source"); // az, fpma, or all
    const countryCode = searchParams.get("countryCode");

    const result: any = {};

    // Get unlinked AZ markets
    if (!source || source === "az" || source === "all") {
      const azWhere: any = { globalMarketId: null };
      
      if (countryCode) {
        const country = await prisma.country.findFirst({
          where: { iso2: countryCode },
        });
        if (country) {
          azWhere.countryId = country.id;
        }
      }

      const unlinkedAz = await prisma.market.findMany({
        where: azWhere,
        include: {
          country: true,
          marketType: true,
        },
        orderBy: { name: "asc" },
      });

      result.azMarkets = unlinkedAz.map((m) => ({
        id: m.id,
        name: m.name,
        nameEn: m.nameEn,
        country: m.country.name,
        countryCode: m.country.iso2,
        marketType: m.marketType.nameAz,
      }));
    }

    // Get unlinked FPMA markets
    if (!source || source === "fpma" || source === "all") {
      const fpmaWhere: any = { globalMarketId: null };
      
      if (countryCode) {
        const fpmaCountry = await prisma.fpmaCountry.findFirst({
          where: { OR: [{ iso2: countryCode }, { iso3: countryCode }] },
        });
        if (fpmaCountry) {
          fpmaWhere.countryId = fpmaCountry.id;
        }
      }

      const unlinkedFpma = await prisma.fpmaMarket.findMany({
        where: fpmaWhere,
        include: {
          country: true,
        },
        orderBy: { name: "asc" },
      });

      result.fpmaMarkets = unlinkedFpma.map((m) => ({
        id: m.id,
        name: m.name,
        faoId: m.faoId,
        country: m.country.nameEn,
        countryCode: m.country.iso2 || m.country.iso3,
        adminUnit: m.adminUnit,
        originalMarketType: m.originalMarketType,
      }));
    }

    // Summary
    result.summary = {
      unlinkedAzMarkets: result.azMarkets?.length || 0,
      unlinkedFpmaMarkets: result.fpmaMarkets?.length || 0,
      total: (result.azMarkets?.length || 0) + (result.fpmaMarkets?.length || 0),
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching unlinked markets:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch unlinked markets" },
      { status: 500 }
    );
  }
}


