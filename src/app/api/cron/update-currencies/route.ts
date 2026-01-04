import { NextResponse } from "next/server";

// Cron endpoint that triggers the main currency update API
// This is called by Vercel Cron or external schedulers
// It delegates to /api/currencies/update-rates for actual work (DRY principle)

export async function GET(req: Request) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Allow in development
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Get the base URL for internal API call
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   "http://localhost:3000";

    // Call the main currency update endpoint
    const response = await fetch(`${baseUrl}/api/currencies/update-rates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `API error: ${response.status}`);
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: "Currency update triggered successfully",
      ...result,
    });
  } catch (error) {
    console.error("Cron currency update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update currencies" },
      { status: 500 }
    );
  }
}
