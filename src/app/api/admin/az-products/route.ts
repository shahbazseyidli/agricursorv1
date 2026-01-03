import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const products = await prisma.product.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        globalProductId: true,
      },
    });

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error("Error fetching AZ products:", error);
    return NextResponse.json(
      { success: false, error: "Xəta baş verdi" },
      { status: 500 }
    );
  }
}



