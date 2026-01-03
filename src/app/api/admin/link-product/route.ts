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
    const { euProductId, azProductId, globalProductId, type } = body;

    if (type === "eu" && euProductId) {
      await prisma.euProduct.update({
        where: { id: euProductId },
        data: { globalProductId: globalProductId || null },
      });

      return NextResponse.json({ 
        success: true, 
        message: globalProductId ? "EU məhsul bağlandı" : "EU məhsul ayrıldı" 
      });
    }

    if (type === "az" && azProductId) {
      await prisma.product.update({
        where: { id: azProductId },
        data: { globalProductId: globalProductId || null },
      });

      return NextResponse.json({ 
        success: true, 
        message: globalProductId ? "AZ məhsul bağlandı" : "AZ məhsul ayrıldı" 
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid request" },
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





