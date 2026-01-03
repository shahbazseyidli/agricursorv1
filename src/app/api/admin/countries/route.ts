import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List all countries
export async function GET() {
  try {
    const countries = await prisma.country.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            markets: true,
            products: true,
            prices: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: countries });
  } catch (error) {
    console.error("Error fetching countries:", error);
    return NextResponse.json(
      { success: false, message: "Ölkələr yüklənərkən xəta baş verdi" },
      { status: 500 }
    );
  }
}

// POST - Create new country
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "İcazə yoxdur" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { iso2, name, nameEn, nameRu } = body;

    if (!iso2 || !name) {
      return NextResponse.json(
        { success: false, message: "ISO2 kodu və ad tələb olunur" },
        { status: 400 }
      );
    }

    // Check if country already exists
    const existing = await prisma.country.findUnique({
      where: { iso2: iso2.toUpperCase() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "Bu ISO2 kodu ilə ölkə artıq mövcuddur" },
        { status: 400 }
      );
    }

    const country = await prisma.country.create({
      data: {
        iso2: iso2.toUpperCase(),
        name,
        nameEn,
        nameRu,
      },
    });

    // Create default market types for new country
    const defaultMarketTypes = [
      { code: "WHOLESALE", nameAz: "Topdansatış", nameEn: "Wholesale", nameRu: "Оптовая" },
      { code: "PROCESSING", nameAz: "Müəssisə tərəfindən alış", nameEn: "Processing", nameRu: "Переработка" },
      { code: "RETAIL", nameAz: "Pərakəndə satış", nameEn: "Retail", nameRu: "Розничная" },
      { code: "FIELD", nameAz: "Sahədən satış", nameEn: "Field", nameRu: "Полевая" },
    ];

    for (const mt of defaultMarketTypes) {
      await prisma.marketType.create({
        data: {
          code: `${mt.code}_${country.iso2}`,
          nameAz: mt.nameAz,
          nameEn: mt.nameEn,
          nameRu: mt.nameRu,
          countryId: country.id,
        },
      });
    }

    return NextResponse.json({ success: true, data: country });
  } catch (error) {
    console.error("Error creating country:", error);
    return NextResponse.json(
      { success: false, message: "Ölkə yaradılarkən xəta baş verdi" },
      { status: 500 }
    );
  }
}







