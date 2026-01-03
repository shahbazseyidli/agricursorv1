import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subMonths, subYears } from "date-fns";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "6m";

    // Parse comparison pairs
    const comparisons: { productId: string; marketId: string }[] = [];
    for (let i = 0; i < 6; i++) {
      const productId = searchParams.get(`product${i}`);
      const marketId = searchParams.get(`market${i}`);
      if (productId && marketId) {
        comparisons.push({ productId, marketId });
      }
    }

    if (comparisons.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Calculate date range
    let startDate: Date;
    const now = new Date();

    switch (range) {
      case "1m":
        startDate = subMonths(now, 1);
        break;
      case "3m":
        startDate = subMonths(now, 3);
        break;
      case "6m":
        startDate = subMonths(now, 6);
        break;
      case "1y":
        startDate = subYears(now, 1);
        break;
      case "all":
        startDate = new Date("2000-01-01");
        break;
      default:
        startDate = subMonths(now, 6);
    }

    // Fetch prices for all comparisons
    const allPrices = await Promise.all(
      comparisons.map(async (comp, index) => {
        const prices = await prisma.price.findMany({
          where: {
            productId: comp.productId,
            marketId: comp.marketId,
            date: { gte: startDate },
          },
          orderBy: { date: "asc" },
        });

        return prices.map((p) => ({
          date: p.date.toISOString().split("T")[0],
          [`comp${index}`]: Number(p.priceAvg),
        }));
      })
    );

    // Merge all data by date
    const dateMap = new Map<string, any>();

    allPrices.forEach((prices, index) => {
      prices.forEach((p) => {
        const existing = dateMap.get(p.date) || { date: p.date };
        existing[`comp${index}`] = p[`comp${index}`];
        dateMap.set(p.date, existing);
      });
    });

    // Sort by date and convert to array
    const chartData = Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // Remap keys to use comparison IDs
    const result = chartData.map((item) => {
      const mapped: any = { date: item.date };
      comparisons.forEach((_, index) => {
        const key = searchParams.get(`id${index}`) || `comp${index}`;
        mapped[key] = item[`comp${index}`];
      });
      return mapped;
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Compare API error:", error);
    return NextResponse.json(
      { error: "Xəta baş verdi" },
      { status: 500 }
    );
  }
}

