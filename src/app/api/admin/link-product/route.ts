import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { sourceId, euProductId, azProductId, globalProductId, type } = body;

    // Use sourceId if provided, fallback to legacy format
    const productId = sourceId || euProductId || azProductId;

    if (type === "eu") {
      await prisma.euProduct.update({
        where: { id: productId },
        data: { globalProductId: globalProductId || null },
      });

      return NextResponse.json({ 
        success: true, 
        message: globalProductId ? "EU məhsul bağlandı" : "EU məhsul ayrıldı" 
      });
    }

    if (type === "az") {
      await prisma.product.update({
        where: { id: productId },
        data: { globalProductId: globalProductId || null },
      });

      return NextResponse.json({ 
        success: true, 
        message: globalProductId ? "AZ məhsul bağlandı" : "AZ məhsul ayrıldı" 
      });
    }

    if (type === "fpma") {
      await prisma.fpmaCommodity.update({
        where: { id: productId },
        data: { globalProductId: globalProductId || null },
      });

      return NextResponse.json({ 
        success: true, 
        message: globalProductId ? "FPMA commodity bağlandı" : "FPMA commodity ayrıldı" 
      });
    }

    if (type === "fao") {
      await prisma.faoProduct.update({
        where: { id: productId },
        data: { globalProductId: globalProductId || null },
      });

      return NextResponse.json({ 
        success: true, 
        message: globalProductId ? "FAO məhsul bağlandı" : "FAO məhsul ayrıldı" 
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid request - type must be eu, az, fpma, or fao" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error linking product:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Xəta baş verdi" },
      { status: 500 }
    );
  }
}






