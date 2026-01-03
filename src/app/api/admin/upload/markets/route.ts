import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

const marketTypeMapping: Record<string, string> = {
  "Topdansatış": "WHOLESALE",
  "Müəssisə tərəfindən alış": "PROCESSING",
  "Pərakəndə satış": "RETAIL",
  "Sahədən satış": "FIELD",
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "İcazə yoxdur" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "Fayl seçilməyib" },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];

    if (data.length === 0) {
      return NextResponse.json(
        { success: false, message: "Fayl boşdur" },
        { status: 400 }
      );
    }

    const country = await prisma.country.findUnique({
      where: { iso2: "AZ" },
    });

    if (!country) {
      return NextResponse.json(
        { success: false, message: "Ölkə tapılmadı" },
        { status: 400 }
      );
    }

    const errors: string[] = [];
    let recordsNew = 0;
    let recordsSkipped = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2;

      try {
        const marketName = row.Market?.toString().trim();
        const typeName = row.type?.toString().trim();

        if (!marketName) {
          throw new Error("Market adı boşdur");
        }

        // Find market type
        const typeCode = marketTypeMapping[typeName] || "WHOLESALE";
        const marketType = await prisma.marketType.findFirst({
          where: {
            countryId: country.id,
            code: typeCode as any,
          },
        });

        if (!marketType) {
          throw new Error(`Bazar tipi tapılmadı: ${typeName}`);
        }

        // Check if market already exists with same name AND marketType
        const existingMarket = await prisma.market.findFirst({
          where: {
            countryId: country.id,
            marketTypeId: marketType.id,
            name: marketName,
          },
        });

        if (existingMarket) {
          // Already exists with same name and type - skip (no update needed)
          recordsSkipped++;
        } else {
          await prisma.market.create({
            data: {
              name: marketName,
              countryId: country.id,
              marketTypeId: marketType.id,
            },
          });
          recordsNew++;
        }
      } catch (err: any) {
        errors.push(`Sətir ${rowNum}: ${err.message}`);
      }
    }

    await prisma.upload.create({
      data: {
        fileName: file.name,
        fileSize: file.size,
        type: "MARKETS",
        status: "COMPLETED",
        recordsTotal: data.length,
        recordsNew: recordsNew,
        recordsError: errors.length,
        errorMessage: errors.length > 0 ? errors.join("\n") : null,
        uploadedBy: (session.user as any)?.id || "unknown",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Yükləmə tamamlandı`,
      recordsTotal: data.length,
      recordsNew,
      recordsSkipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Yükləmə xətası" },
      { status: 500 }
    );
  }
}

