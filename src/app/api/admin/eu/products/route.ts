/**
 * Admin API: EU Products Management
 * 
 * GET - List all EU products with their local mappings
 * POST - Trigger fuzzy match update
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAllMatches, updateAllMatches } from "@/lib/services/product-matcher";

// GET - List all EU products with mappings
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get("filter"); // all, matched, unmatched
    const category = searchParams.get("category");
    
    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (filter === "matched") {
      where.localProductId = { not: null };
    } else if (filter === "unmatched") {
      where.localProductId = null;
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
            category: {
              select: { name: true }
            }
          }
        },
        _count: {
          select: { prices: true }
        }
      },
      orderBy: [
        { matchScore: "desc" },
        { nameEn: "asc" }
      ]
    });
    
    // Get categories for filter
    const categories = await prisma.euProduct.groupBy({
      by: ["category"],
      _count: { id: true }
    });
    
    // Get stats
    const stats = {
      total: products.length,
      matched: products.filter(p => p.localProductId).length,
      unmatched: products.filter(p => !p.localProductId).length,
      manualMatches: products.filter(p => p.isManualMatch).length
    };
    
    return NextResponse.json({
      data: products.map(p => ({
        id: p.id,
        nameEn: p.nameEn,
        nameAz: p.nameAz,
        eurostatCode: p.eurostatCode,
        ecAgrifoodCode: p.ecAgrifoodCode,
        category: p.category,
        unit: p.unit,
        localProduct: p.localProduct,
        matchScore: p.matchScore,
        isManualMatch: p.isManualMatch,
        priceCount: p._count.prices
      })),
      categories: categories.map(c => ({
        name: c.category || "Təyin edilməmiş",
        count: c._count.id
      })),
      stats
    });
    
  } catch (error) {
    console.error("EU Products API error:", error);
    return NextResponse.json(
      { error: "Xəta baş verdi" },
      { status: 500 }
    );
  }
}

// POST - Run fuzzy match update
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;
    
    if (action === "runMatch") {
      // Run fuzzy matching
      const result = await updateAllMatches();
      
      return NextResponse.json({
        success: true,
        message: `${result.matched} məhsul uyğunlaşdırıldı, ${result.unmatched} uyğunsuz`,
        data: result
      });
    }
    
    return NextResponse.json(
      { error: "Bilinməyən əməliyyat" },
      { status: 400 }
    );
    
  } catch (error) {
    console.error("EU Products POST error:", error);
    return NextResponse.json(
      { error: "Xəta baş verdi" },
      { status: 500 }
    );
  }
}






