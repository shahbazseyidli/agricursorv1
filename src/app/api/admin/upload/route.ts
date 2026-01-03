import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// POST: Upload image file OR set external URL
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";
    
    // Handle JSON body (for external URL links)
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const { externalUrl, entityType, entityId } = body;
      
      if (!externalUrl || !entityType || !entityId) {
        return NextResponse.json(
          { error: "externalUrl, entityType and entityId are required" },
          { status: 400 }
        );
      }
      
      // Validate URL format
      try {
        new URL(externalUrl);
      } catch {
        return NextResponse.json(
          { error: "Invalid URL format" },
          { status: 400 }
        );
      }
      
      // Update entity with external URL
      let updated = null;
      
      switch (entityType) {
        case "globalProduct":
          updated = await prisma.globalProduct.update({
            where: { id: entityId },
            data: { imageUrl: externalUrl },
          });
          break;
        case "globalCategory":
          updated = await prisma.globalCategory.update({
            where: { id: entityId },
            data: { image: externalUrl },
          });
          break;
        case "globalProductVariety":
          updated = await prisma.globalProductVariety.update({
            where: { id: entityId },
            data: { imageUrl: externalUrl },
          });
          break;
        case "globalCountry":
          updated = await prisma.globalCountry.update({
            where: { id: entityId },
            data: { flagUrl: externalUrl },
          });
          break;
        default:
          return NextResponse.json(
            { error: "Invalid entityType. Allowed: globalProduct, globalCategory, globalProductVariety, globalCountry" },
            { status: 400 }
          );
      }
      
      return NextResponse.json({
        success: true,
        url: externalUrl,
        entityType,
        entityId,
        message: "External URL linked successfully",
      });
    }
    
    // Handle FormData (for file uploads)
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string || "products"; // products, categories, countries, varieties
    const entityType = formData.get("entityType") as string | null;
    const entityId = formData.get("entityId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size: 5MB" },
        { status: 400 }
      );
    }

    // Create upload directory
    const uploadDir = path.join(process.cwd(), "public", "uploads", type);
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return public URL
    const url = `/uploads/${type}/${filename}`;
    
    // If entityType and entityId provided, update the entity
    if (entityType && entityId) {
      switch (entityType) {
        case "globalProduct":
          await prisma.globalProduct.update({
            where: { id: entityId },
            data: { image: url },
          });
          break;
        case "globalCategory":
          await prisma.globalCategory.update({
            where: { id: entityId },
            data: { image: url },
          });
          break;
        case "globalProductVariety":
          await prisma.globalProductVariety.update({
            where: { id: entityId },
            data: { image: url },
          });
          break;
        case "globalCountry":
          await prisma.globalCountry.update({
            where: { id: entityId },
            data: { flagUrl: url },
          });
          break;
      }
    }

    return NextResponse.json({
      success: true,
      url,
      filename,
      size: file.size,
      type: file.type,
      entityUpdated: !!(entityType && entityId),
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

