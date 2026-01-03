/**
 * Public API: EU Countries
 * 
 * GET - List all active EU countries with price data
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const countries = await prisma.euCountry.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { prices: true }
        }
      },
      orderBy: { nameEn: "asc" }
    });
    
    // Only return countries with price data
    const countriesWithData = countries.filter(c => c._count.prices > 0);
    
    return NextResponse.json({
      data: countriesWithData.map(c => ({
        id: c.id,
        code: c.code,
        nameEn: c.nameEn,
        nameAz: c.nameAz,
        priceCount: c._count.prices
      }))
    });
    
  } catch (error) {
    console.error("EU Countries API error:", error);
    return NextResponse.json(
      { error: "Xəta baş verdi" },
      { status: 500 }
    );
  }
}






