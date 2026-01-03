import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

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
    let recordsUpdated = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2;

      try {
        const productName = row.product_name?.toString().trim();
        const categoryName = row.category?.toString().trim();
        const slug = row.slug?.toString().trim();

        if (!productName || !categoryName || !slug) {
          throw new Error("product_name, category və slug tələb olunur");
        }

        // Find or create category
        let category = await prisma.category.findFirst({
          where: {
            countryId: country.id,
            name: categoryName,
          },
        });

        if (!category) {
          const catSlug = categoryName
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

          category = await prisma.category.create({
            data: {
              name: categoryName,
              slug: catSlug,
              countryId: country.id,
            },
          });
        }

        // Upsert product
        const existingProduct = await prisma.product.findUnique({
          where: {
            countryId_slug: {
              countryId: country.id,
              slug: slug,
            },
          },
        });

        if (existingProduct) {
          await prisma.product.update({
            where: { id: existingProduct.id },
            data: {
              name: productName,
              nameEn: row.name_en?.toString() || null,
              nameRu: row.name_ru?.toString() || null,
              unit: row.unit?.toString() || "kg",
              categoryId: category.id,
            },
          });
          recordsUpdated++;
        } else {
          await prisma.product.create({
            data: {
              name: productName,
              nameEn: row.name_en?.toString() || null,
              nameRu: row.name_ru?.toString() || null,
              slug: slug,
              unit: row.unit?.toString() || "kg",
              countryId: country.id,
              categoryId: category.id,
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
        type: "PRODUCTS",
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
      recordsUpdated,
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

