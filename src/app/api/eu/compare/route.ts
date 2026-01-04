/**
 * Public API: EU-AZ Price Comparison
 * 
 * GET - Compare prices between Azerbaijan and EU countries
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compareWithEU } from "@/lib/services/az-aggregate";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const localProductId = searchParams.get("productId");
    const euCountryCode = searchParams.get("euCountryCode") || "DE"; // Default Germany
    const marketTypeCode = searchParams.get("marketType") || "RETAIL";
    const priceStage = searchParams.get("priceStage") || "RETAIL_SELLING";
    const startYear = parseInt(searchParams.get("startYear") || "2020");
    const endYear = parseInt(searchParams.get("endYear") || new Date().getFullYear().toString());
    const currency = searchParams.get("currency") || "EUR";
    
    if (!localProductId) {
      return NextResponse.json(
        { error: "productId tələb olunur" },
        { status: 400 }
      );
    }
    
    // Get comparison data
    const comparison = await compareWithEU({
      localProductId,
      euCountryCode,
      marketTypeCode,
      priceStage,
      startYear,
      endYear
    });
    
    // Get currency rate if needed (USD-based)
    let exchangeRate = 1;
    if (currency !== "EUR" && currency !== "USD") {
      const currencyRecord = await prisma.currency.findUnique({
        where: { code: currency }
      });
      if (currencyRecord) {
        exchangeRate = currencyRecord.rateToUSD;
      }
    }
    
    // Get EUR to USD rate for conversion display
    const eurCurrency = await prisma.currency.findUnique({
      where: { code: "EUR" }
    });
    const eurToUsd = eurCurrency?.rateToUSD || 0.92; // Default rate (1 USD = 0.92 EUR)
    
    // Format response (USD-based)
    const response = {
      azData: comparison.azData.map(d => ({
        ...d,
        priceInSelectedCurrency: currency === "USD" ? d.price : d.price / exchangeRate
      })),
      euData: comparison.euData.map(d => ({
        ...d,
        priceInUSD: d.price / eurToUsd, // Convert EUR to USD
        priceInSelectedCurrency: currency === "EUR" ? d.price : d.price / eurToUsd * exchangeRate
      })),
      comparison: comparison.comparison ? {
        ...comparison.comparison,
        euAvgInUSD: Math.round(comparison.comparison.euAvg / eurToUsd * 100) / 100,
        currency,
        exchangeRate: currency === "EUR" ? 1 : (currency === "USD" ? 1 / eurToUsd : exchangeRate)
      } : null,
      metadata: {
        localProductId,
        euCountryCode,
        marketTypeCode,
        priceStage,
        startYear,
        endYear,
        currency,
        eurToUsd
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("EU Compare API error:", error);
    return NextResponse.json(
      { error: "Xəta baş verdi" },
      { status: 500 }
    );
  }
}







