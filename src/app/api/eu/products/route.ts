/**
 * Public API: EU Products
 * 
 * GET - List EU products that have local AZ matches
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const localProductId = searchParams.get("localProductId");
    const category = searchParams.get("category");
    
    const where: Record<string, unknown> = {
      localProductId: { not: null }
    };
    
    if (localProductId) {
      where.localProductId = localProductId;
    }
    
    if (category) {
      where.category = category;
    }
    
    const products = await prisma.euProduct.findMany({
      where,
      include: {
        localProduct: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            slug: true
          }
        },
        _count: {
          select: { prices: true }
        }
      },
      orderBy: { nameEn: "asc" }
    });
    
    return NextResponse.json({
      data: products.map(p => ({
        id: p.id,
        nameEn: p.nameEn,
        nameAz: p.nameAz,
        eurostatCode: p.eurostatCode,
        ecAgrifoodCode: p.ecAgrifoodCode,
        category: p.category,
        localProduct: p.localProduct,
        priceCount: p._count.prices
      }))
    });
    
  } catch (error) {
    console.error("EU Products API error:", error);
    return NextResponse.json(
      { error: "Xəta baş verdi" },
      { status: 500 }
    );
  }
}






