/**
 * Admin API: EU Data Sync
 * 
 * POST - Trigger data sync from EC Agrifood or Eurostat
 * GET - Get sync history
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncAllPrices as syncEcAgrifood, syncLatestWeek } from "@/lib/services/ec-agrifood";
import { syncAllPrices as syncEurostat, syncLatestYear } from "@/lib/services/eurostat";
import { syncAllAggregates } from "@/lib/services/az-aggregate";
import { updateAllMatches } from "@/lib/services/product-matcher";

// GET - Get sync history
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const source = searchParams.get("source");
    const limit = parseInt(searchParams.get("limit") || "20");
    
    const syncs = await prisma.euDataSync.findMany({
      where: source ? { source } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit
    });
    
    // Get stats
    const stats = {
      ecAgrifood: {
        lastSync: syncs.find(s => s.source === "EC_AGRIFOOD" && s.status === "COMPLETED")?.completedAt,
        totalPrices: await prisma.euPrice.count({ where: { source: "EC_AGRIFOOD" } })
      },
      eurostat: {
        lastSync: syncs.find(s => s.source === "EUROSTAT" && s.status === "COMPLETED")?.completedAt,
        totalPrices: await prisma.euPrice.count({ where: { source: "EUROSTAT" } })
      },
      euCountries: await prisma.euCountry.count(),
      euProducts: await prisma.euProduct.count(),
      azAggregates: await prisma.azPriceAggregate.count()
    };
    
    return NextResponse.json({
      syncs,
      stats
    });
    
  } catch (error) {
    console.error("EU Sync GET error:", error);
    return NextResponse.json(
      { error: "Xəta baş verdi" },
      { status: 500 }
    );
  }
}

// POST - Trigger sync
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, source, startYear, endYear } = body;
    
    const currentYear = new Date().getFullYear();
    const sYear = startYear || 2020;
    const eYear = endYear || currentYear;
    
    let result;
    
    switch (action) {
      case "syncEcAgrifood":
        // Full sync from EC Agrifood
        result = await syncEcAgrifood(sYear, eYear);
        break;
        
      case "syncEcAgrifoodLatest":
        // Sync only latest week
        result = await syncLatestWeek();
        break;
        
      case "syncEurostat":
        // Full sync from Eurostat
        result = await syncEurostat(sYear, eYear);
        break;
        
      case "syncEurostatLatest":
        // Sync only latest year
        result = await syncLatestYear();
        break;
        
      case "syncAll":
        // Sync both sources
        const ecResult = await syncEcAgrifood(sYear, eYear);
        const eurostatResult = await syncEurostat(sYear, eYear);
        
        result = {
          success: ecResult.success && eurostatResult.success,
          source: "ALL",
          ecAgrifood: ecResult,
          eurostat: eurostatResult,
          duration: ecResult.duration + eurostatResult.duration
        };
        break;
        
      case "runMatching":
        // Run fuzzy matching
        const matchResult = await updateAllMatches();
        result = {
          success: true,
          source: "MATCHER",
          ...matchResult
        };
        break;
        
      case "syncAzAggregates":
        // Calculate AZ aggregates
        const aggResult = await syncAllAggregates(sYear, eYear);
        result = {
          success: aggResult.success,
          source: "AZ_AGGREGATE",
          ...aggResult
        };
        break;
        
      case "fullSync":
        // Full sync: EU data + matching + AZ aggregates
        console.log("Starting full sync...");
        
        // 1. Sync EC Agrifood
        const ec = await syncEcAgrifood(sYear, eYear);
        console.log("EC Agrifood sync complete");
        
        // 2. Sync Eurostat
        const es = await syncEurostat(sYear, eYear);
        console.log("Eurostat sync complete");
        
        // 3. Run matching
        const match = await updateAllMatches();
        console.log("Matching complete");
        
        // 4. Calculate AZ aggregates
        const agg = await syncAllAggregates(sYear, eYear);
        console.log("AZ aggregates complete");
        
        result = {
          success: ec.success && es.success && agg.success,
          source: "FULL_SYNC",
          ecAgrifood: ec,
          eurostat: es,
          matching: match,
          azAggregates: agg,
          duration: ec.duration + es.duration
        };
        break;
        
      default:
        return NextResponse.json(
          { error: "Bilinməyən əməliyyat" },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: result.success,
      message: result.success ? "Sinxronizasiya tamamlandı" : "Sinxronizasiya uğursuz oldu",
      data: result
    });
    
  } catch (error) {
    console.error("EU Sync POST error:", error);
    return NextResponse.json(
      { error: "Xəta baş verdi: " + String(error) },
      { status: 500 }
    );
  }
}







