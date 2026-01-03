/**
 * Admin API: EU Countries Management
 * 
 * GET - List all EU countries
 * POST - Create/update EU country
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - List all EU countries
export async function GET() {
  try {
    const countries = await prisma.euCountry.findMany({
      include: {
        _count: {
          select: { prices: true }
        }
      },
      orderBy: { nameEn: "asc" }
    });
    
    return NextResponse.json({
      data: countries.map(c => ({
        id: c.id,
        code: c.code,
        nameEn: c.nameEn,
        nameAz: c.nameAz,
        nameRu: c.nameRu,
        region: c.region,
        isActive: c.isActive,
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

// POST - Create EU country
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, nameEn, nameAz, nameRu, region } = body;
    
    if (!code || !nameEn) {
      return NextResponse.json(
        { error: "Kod və İngilis adı tələb olunur" },
        { status: 400 }
      );
    }
    
    // Check if exists
    const existing = await prisma.euCountry.findUnique({
      where: { code }
    });
    
    if (existing) {
      // Update
      const updated = await prisma.euCountry.update({
        where: { code },
        data: { nameEn, nameAz, nameRu, region }
      });
      
      return NextResponse.json({
        success: true,
        message: "Ölkə yeniləndi",
        data: updated
      });
    }
    
    // Create
    const country = await prisma.euCountry.create({
      data: { code, nameEn, nameAz, nameRu, region, isActive: true }
    });
    
    return NextResponse.json({
      success: true,
      message: "Ölkə əlavə edildi",
      data: country
    });
    
  } catch (error) {
    console.error("EU Countries POST error:", error);
    return NextResponse.json(
      { error: "Xəta baş verdi" },
      { status: 500 }
    );
  }
}






