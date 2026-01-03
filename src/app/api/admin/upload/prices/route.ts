import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function POST(req: Request) {
  try {
    // Check auth
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "İcazə yoxdur" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const marketTypeId = formData.get("marketTypeId") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "Fayl seçilməyib" },
        { status: 400 }
      );
    }

    // Read Excel file
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

    // Get Azerbaijan country
    const country = await prisma.country.findUnique({
      where: { iso2: "AZ" },
    });

    if (!country) {
      return NextResponse.json(
        { success: false, message: "Ölkə tapılmadı. Əvvəlcə seed edin." },
        { status: 400 }
      );
    }

    const errors: string[] = [];
    let recordsNew = 0;
    let recordsUpdated = 0;

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // Excel row number (1-indexed + header)

      try {
        // Parse date (DD.MM.YYYY format)
        let date: Date;
        if (typeof row.date === "number") {
          // Excel serial date
          date = new Date((row.date - 25569) * 86400 * 1000);
        } else if (typeof row.date === "string") {
          const parts = row.date.split(".");
          date = new Date(
            parseInt(parts[2]),
            parseInt(parts[1]) - 1,
            parseInt(parts[0])
          );
        } else {
          throw new Error(`Tarix formatı yanlışdır`);
        }

        if (isNaN(date.getTime())) {
          throw new Error(`Tarix formatı yanlışdır`);
        }

        // Find or create product
        const productName = row.product_name?.toString().trim();
        if (!productName) {
          throw new Error("Məhsul adı boşdur");
        }

        let product = await prisma.product.findFirst({
          where: {
            countryId: country.id,
            name: productName,
          },
        });

        if (!product) {
          // Get or create default category
          let category = await prisma.category.findFirst({
            where: { countryId: country.id },
          });

          if (!category) {
            category = await prisma.category.create({
              data: {
                name: "Digər",
                slug: "other",
                countryId: country.id,
              },
            });
          }

          // Create product with auto-generated slug
          const slug = productName
            .toLowerCase()
            .replace(/[əƏ]/g, "e")
            .replace(/[ıİ]/g, "i")
            .replace(/[öÖ]/g, "o")
            .replace(/[üÜ]/g, "u")
            .replace(/[çÇ]/g, "c")
            .replace(/[şŞ]/g, "s")
            .replace(/[ğĞ]/g, "g")
            .replace(/\s+/g, "-")
            .replace(/[^\w-]+/g, "");

          product = await prisma.product.create({
            data: {
              name: productName,
              slug: `${slug}-${Date.now()}`,
              unit: row.unit?.toString() || "kg",
              countryId: country.id,
              categoryId: category.id,
            },
          });
        }

        // Find or create product type (if exists)
        let productTypeId: string | null = null;
        const productTypeName = row.product_type?.toString().trim();

        if (productTypeName) {
          let productType = await prisma.productType.findFirst({
            where: {
              productId: product.id,
              name: productTypeName,
            },
          });

          if (!productType) {
            productType = await prisma.productType.create({
              data: {
                name: productTypeName,
                productId: product.id,
              },
            });
          }

          productTypeId = productType.id;
        }

        // Find or create market
        const marketName = row.market?.toString().trim();
        if (!marketName) {
          throw new Error("Bazar adı boşdur");
        }

        // Get market type - use provided marketTypeId or find default
        let marketType;
        if (marketTypeId) {
          marketType = await prisma.marketType.findUnique({
            where: { id: marketTypeId },
          });
        } else {
          marketType = await prisma.marketType.findFirst({
            where: { countryId: country.id },
          });
        }

        if (!marketType) {
          throw new Error("Bazar tipi tapılmadı");
        }

        // Find market by name AND marketType
        let market = await prisma.market.findFirst({
          where: {
            countryId: country.id,
            marketTypeId: marketType.id,
            name: marketName,
          },
        });

        if (!market) {
          market = await prisma.market.create({
            data: {
              name: marketName,
              countryId: country.id,
              marketTypeId: marketType.id,
            },
          });
        }

        // Parse prices
        const priceMin = parseFloat(row.price_min) || 0;
        const priceAvg = parseFloat(row.price_avg) || 0;
        const priceMax = parseFloat(row.price_max) || 0;

        if (priceMin === 0 && priceAvg === 0 && priceMax === 0) {
          throw new Error("Qiymət məlumatları yanlışdır");
        }

        // Upsert price record
        const existingPrice = await prisma.price.findFirst({
          where: {
            countryId: country.id,
            productId: product.id,
            productTypeId: productTypeId,
            marketId: market.id,
            date: date,
          },
        });

        if (existingPrice) {
          await prisma.price.update({
            where: { id: existingPrice.id },
            data: {
              priceMin,
              priceAvg,
              priceMax,
              unit: row.unit?.toString() || "kg",
              currency: row.currency?.toString() || "AZN",
              source: row.source?.toString() || "agro.gov.az",
            },
          });
          recordsUpdated++;
        } else {
          await prisma.price.create({
            data: {
              countryId: country.id,
              productId: product.id,
              productTypeId: productTypeId,
              marketId: market.id,
              date: date,
              priceMin,
              priceAvg,
              priceMax,
              unit: row.unit?.toString() || "kg",
              currency: row.currency?.toString() || "AZN",
              source: row.source?.toString() || "agro.gov.az",
            },
          });
          recordsNew++;
        }
      } catch (err: any) {
        errors.push(`Sətir ${rowNum}: ${err.message}`);
      }
    }

    // Create upload record
    await prisma.upload.create({
      data: {
        fileName: file.name,
        fileSize: file.size,
        type: "PRICES",
        status: errors.length === 0 ? "COMPLETED" : "COMPLETED",
        recordsTotal: data.length,
        recordsNew: recordsNew,
        recordsError: errors.length,
        errorMessage: errors.length > 0 ? errors.join("\n") : null,
        uploadedBy: (session.user as any)?.id || "unknown",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Yükləmə tamamlandı: ${recordsNew} yeni, ${recordsUpdated} yeniləndi`,
      recordsTotal: data.length,
      recordsNew,
      recordsUpdated,
      data: {
        inserted: recordsNew,
        updated: recordsUpdated,
        skipped: 0,
        errors: errors.length,
      },
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

