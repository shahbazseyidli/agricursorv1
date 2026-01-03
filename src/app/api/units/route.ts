import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const units = await prisma.unit.findMany({
      where: { isActive: true },
      orderBy: [
        { category: "asc" },
        { code: "asc" }
      ]
    });

    // Group by category
    const grouped = units.reduce((acc, unit) => {
      if (!acc[unit.category]) acc[unit.category] = [];
      acc[unit.category].push(unit);
      return acc;
    }, {} as Record<string, typeof units>);

    return NextResponse.json({
      data: units,
      grouped,
      defaultUnit: "kg"
    });
  } catch (error) {
    console.error("Units API error:", error);
    return NextResponse.json(
      { error: "Xəta baş verdi" },
      { status: 500 }
    );
  }
}





