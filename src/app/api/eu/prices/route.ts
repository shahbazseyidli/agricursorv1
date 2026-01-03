/**
 * Public API: EU Prices
 * 
 * GET - Get EU prices for comparison
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { interpolateToWeekly, interpolateToMonthly } from "@/lib/services/eurostat";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const localProductId = searchParams.get("localProductId");
    const euProductId = searchParams.get("euProductId");
    const countryCode = searchParams.get("countryCode");
    const priceStage = searchParams.get("priceStage");
    const startYear = parseInt(searchParams.get("startYear") || "2020");
    const endYear = parseInt(searchParams.get("endYear") || new Date().getFullYear().toString());
    const interpolate = searchParams.get("interpolate"); // weekly, monthly, none
    
    // Find EU product
    let euProduct;
    if (euProductId) {
      euProduct = await prisma.euProduct.findUnique({ where: { id: euProductId } });
    } else if (localProductId) {
      euProduct = await prisma.euProduct.findFirst({ 
        where: { localProductId } 
      });
    }
    
    if (!euProduct) {
      return NextResponse.json({
        data: [],
        message: "Bu məhsul üçün EU datası mövcud deyil"
      });
    }
    
    // Find EU country
    let euCountry;
    if (countryCode) {
      euCountry = await prisma.euCountry.findUnique({ 
        where: { code: countryCode } 
      });
    }
    
    // Build query
    const where: Record<string, unknown> = {
      productId: euProduct.id,
      year: { gte: startYear, lte: endYear }
    };
    
    if (euCountry) {
      where.countryId = euCountry.id;
    }
    
    if (priceStage) {
      where.priceStage = priceStage;
    }
    
    const prices = await prisma.euPrice.findMany({
      where,
      include: {
        country: { select: { code: true, nameEn: true, nameAz: true } },
        product: { select: { nameEn: true, eurostatCode: true } }
      },
      orderBy: [{ year: "asc" }, { period: "asc" }]
    });
    
    // Handle interpolation for annual data
    if (interpolate && prices.length > 0) {
      const annualPrices = prices
        .filter(p => p.periodType === "Year")
        .map(p => ({ year: p.year, price: p.price }));
      
      if (annualPrices.length > 0) {
        if (interpolate === "weekly") {
          const interpolated = interpolateToWeekly(annualPrices);
          return NextResponse.json({
            data: interpolated.map(p => ({
              date: p.date,
              week: p.week,
              price: p.price,
              currency: "EUR",
              source: prices[0].sourceName,
              country: prices[0].country,
              product: prices[0].product,
              isInterpolated: true
            }))
          });
        } else if (interpolate === "monthly") {
          const interpolated = interpolateToMonthly(annualPrices);
          return NextResponse.json({
            data: interpolated.map(p => ({
              date: p.date,
              price: p.price,
              currency: "EUR",
              source: prices[0].sourceName,
              country: prices[0].country,
              product: prices[0].product,
              isInterpolated: true
            }))
          });
        }
      }
    }
    
    // Return raw data
    return NextResponse.json({
      data: prices.map(p => ({
        id: p.id,
        date: p.startDate || new Date(p.year, (p.period || 1) - 1, 1),
        year: p.year,
        period: p.period,
        periodType: p.periodType,
        price: p.price,
        currency: p.currency,
        unit: p.unit,
        priceStage: p.priceStage,
        variety: p.variety,
        source: p.source,
        sourceName: p.sourceName,
        country: p.country,
        product: {
          nameEn: p.product.nameEn,
          eurostatCode: p.product.eurostatCode
        }
      })),
      euProduct: {
        id: euProduct.id,
        nameEn: euProduct.nameEn,
        eurostatCode: euProduct.eurostatCode
      }
    });
    
  } catch (error) {
    console.error("EU Prices API error:", error);
    return NextResponse.json(
      { error: "Xəta baş verdi" },
      { status: 500 }
    );
  }
}



