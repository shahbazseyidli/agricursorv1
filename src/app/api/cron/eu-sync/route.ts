/**
 * Cron Job API: Data Sync
 * 
 * Scheduled jobs for updating prices:
 * - EC Agrifood: Weekly (Monday 06:00 UTC)
 * - Eurostat: Monthly (1st of month 06:00 UTC)
 * - FAOSTAT: Monthly (1st of month 07:00 UTC)
 * - AZ Aggregates: Daily (23:00 UTC)
 * 
 * Usage with external cron service:
 * POST /api/cron/eu-sync?job=weekly&secret=YOUR_CRON_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { syncLatestWeek as syncEcLatest } from "@/lib/services/ec-agrifood";
import { syncLatestYear as syncEurostatLatest } from "@/lib/services/eurostat";
import { syncLatestYear as syncFaoLatest } from "@/lib/services/fao-sync";
import { syncAllAggregates } from "@/lib/services/az-aggregate";
import { updateAllMatches } from "@/lib/services/product-matcher";

// Verify cron secret (protect from unauthorized access)
function verifyCronSecret(request: NextRequest): boolean {
  const secret = request.nextUrl.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;
  
  // If no secret is configured, allow in development
  if (!cronSecret) {
    return process.env.NODE_ENV === "development";
  }
  
  return secret === cronSecret;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    if (!verifyCronSecret(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const job = request.nextUrl.searchParams.get("job") || "weekly";
    const results: Record<string, unknown> = {};
    
    console.log(`Cron job started: ${job}`);
    
    switch (job) {
      case "weekly":
        // Weekly EC Agrifood sync
        console.log("Running weekly EC Agrifood sync...");
        results.ecAgrifood = await syncEcLatest();
        console.log("EC Agrifood sync complete");
        break;
        
      case "monthly":
        // Monthly Eurostat sync + FAO sync + matching
        console.log("Running monthly Eurostat sync...");
        results.eurostat = await syncEurostatLatest();
        console.log("Eurostat sync complete");
        
        // Also run FAO sync
        console.log("Running monthly FAO sync...");
        results.faostat = await syncFaoLatest();
        console.log("FAO sync complete");
        
        // Also run matching
        console.log("Running product matching...");
        results.matching = await updateAllMatches();
        console.log("Matching complete");
        break;
        
      case "fao":
        // FAO only sync
        console.log("Running FAO sync...");
        results.faostat = await syncFaoLatest();
        console.log("FAO sync complete");
        break;
        
      case "daily":
        // Daily AZ aggregates calculation
        const currentYear = new Date().getFullYear();
        console.log("Running daily AZ aggregates sync...");
        results.azAggregates = await syncAllAggregates(currentYear, currentYear);
        console.log("AZ aggregates sync complete");
        break;
        
      case "full":
        // Full sync (for initial setup or recovery)
        const thisYear = new Date().getFullYear();
        
        console.log("Running full sync...");
        results.ecAgrifood = await syncEcLatest();
        results.eurostat = await syncEurostatLatest();
        results.faostat = await syncFaoLatest();
        results.matching = await updateAllMatches();
        results.azAggregates = await syncAllAggregates(thisYear, thisYear);
        console.log("Full sync complete");
        break;
        
      default:
        return NextResponse.json(
          { error: `Unknown job type: ${job}` },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      job,
      timestamp: new Date().toISOString(),
      results
    });
    
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { 
        error: "Cron job failed",
        message: String(error)
      },
      { status: 500 }
    );
  }
}

// Also support GET for simple health checks
export async function GET(request: NextRequest) {
  const job = request.nextUrl.searchParams.get("job");
  
  return NextResponse.json({
    status: "ready",
    jobs: {
      weekly: "EC Agrifood sync - run every Monday",
      monthly: "Eurostat + FAO sync + matching - run 1st of month",
      fao: "FAO sync only - run manually",
      daily: "AZ aggregates - run daily at 23:00",
      full: "Full sync (all sources) - run manually when needed"
    },
    nextRun: {
      weekly: getNextMonday(),
      monthly: getFirstOfNextMonth(),
      daily: getTodayAt23()
    },
    currentJob: job || "none"
  });
}

function getNextMonday(): string {
  const now = new Date();
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(6, 0, 0, 0);
  return nextMonday.toISOString();
}

function getFirstOfNextMonth(): string {
  const now = new Date();
  const firstOfNext = new Date(now.getFullYear(), now.getMonth() + 1, 1, 6, 0, 0);
  return firstOfNext.toISOString();
}

function getTodayAt23(): string {
  const now = new Date();
  const todayAt23 = new Date(now);
  todayAt23.setHours(23, 0, 0, 0);
  if (todayAt23 < now) {
    todayAt23.setDate(todayAt23.getDate() + 1);
  }
  return todayAt23.toISOString();
}




