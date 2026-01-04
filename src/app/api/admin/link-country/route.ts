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
    const { sourceId, globalCountryId, type } = body;

    if (!sourceId) {
      return NextResponse.json(
        { success: false, error: "sourceId is required" },
        { status: 400 }
      );
    }

    if (type === "az") {
      await prisma.country.update({
        where: { id: sourceId },
        data: { globalCountryId: globalCountryId || null },
      });

      return NextResponse.json({ 
        success: true, 
        message: globalCountryId ? "AZ ölkə bağlandı" : "AZ ölkə ayrıldı" 
      });
    }

    if (type === "eu") {
      await prisma.euCountry.update({
        where: { id: sourceId },
        data: { globalCountryId: globalCountryId || null },
      });

      return NextResponse.json({ 
        success: true, 
        message: globalCountryId ? "EU ölkə bağlandı" : "EU ölkə ayrıldı" 
      });
    }

    if (type === "fpma") {
      await prisma.fpmaCountry.update({
        where: { id: sourceId },
        data: { globalCountryId: globalCountryId || null },
      });

      return NextResponse.json({ 
        success: true, 
        message: globalCountryId ? "FPMA ölkə bağlandı" : "FPMA ölkə ayrıldı" 
      });
    }

    if (type === "fao") {
      await prisma.faoCountry.update({
        where: { id: sourceId },
        data: { globalCountryId: globalCountryId || null },
      });

      return NextResponse.json({ 
        success: true, 
        message: globalCountryId ? "FAO ölkə bağlandı" : "FAO ölkə ayrıldı" 
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid request - type must be az, eu, fpma, or fao" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error linking country:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Xəta baş verdi" },
      { status: 500 }
    );
  }
}

