import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch all active currencies with FX rates
export async function GET() {
  try {
    const currencies = await prisma.currency.findMany({
      where: { isActive: true },
      orderBy: [{ isBase: "desc" }, { code: "asc" }],
    });

    return NextResponse.json({
      data: currencies,
      lastUpdated: currencies[0]?.lastUpdated || null,
    });
  } catch (error) {
    console.error("Currencies API error:", error);
    return NextResponse.json(
      { error: "Xəta baş verdi" },
      { status: 500 }
    );
  }
}




