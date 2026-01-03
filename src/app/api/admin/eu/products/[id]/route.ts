/**
 * Admin API: Single EU Product Management
 * 
 * GET - Get single EU product details
 * PATCH - Update EU product (manual match, translations)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setManualMatch } from "@/lib/services/product-matcher";

// GET - Get single EU product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const product = await prisma.euProduct.findUnique({
      where: { id },
      include: {
        localProduct: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            category: { select: { name: true } }
          }
        },
        prices: {
          take: 10,
          orderBy: { year: "desc" },
          include: {
            country: { select: { code: true, nameEn: true } }
          }
        }
      }
    });
    
    if (!product) {
      return NextResponse.json(
        { error: "Məhsul tapılmadı" },
        { status: 404 }
      );
    }
    
    // Get available local products for matching
    const localProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        nameEn: true,
        category: { select: { name: true } }
      },
      orderBy: { name: "asc" }
    });
    
    return NextResponse.json({
      data: product,
      localProducts
    });
    
  } catch (error) {
    console.error("EU Product GET error:", error);
    return NextResponse.json(
      { error: "Xəta baş verdi" },
      { status: 500 }
    );
  }
}

// PATCH - Update EU product
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Handle manual match
    if ("localProductId" in body) {
      await setManualMatch(id, body.localProductId);
      
      const updated = await prisma.euProduct.findUnique({
        where: { id },
        include: {
          localProduct: {
            select: { id: true, name: true, nameEn: true }
          }
        }
      });
      
      return NextResponse.json({
        success: true,
        message: body.localProductId 
          ? "Məhsul əl ilə uyğunlaşdırıldı" 
          : "Uyğunlaşdırma silindi",
        data: updated
      });
    }
    
    // Handle translations update
    if ("nameAz" in body || "nameRu" in body) {
      const updated = await prisma.euProduct.update({
        where: { id },
        data: {
          nameAz: body.nameAz,
          nameRu: body.nameRu
        }
      });
      
      return NextResponse.json({
        success: true,
        message: "Tərcümələr yeniləndi",
        data: updated
      });
    }
    
    return NextResponse.json(
      { error: "Heç bir dəyişiklik göndərilmədi" },
      { status: 400 }
    );
    
  } catch (error) {
    console.error("EU Product PATCH error:", error);
    return NextResponse.json(
      { error: "Xəta baş verdi" },
      { status: 500 }
    );
  }
}







