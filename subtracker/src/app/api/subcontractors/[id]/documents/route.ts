import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const documents = await prisma.document.findMany({
    where: { subcontractorId: id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { coverages: true } } },
  });

  return NextResponse.json(documents);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const sub = await prisma.subcontractor.findUnique({ where: { id } });
  if (!sub) {
    return NextResponse.json(
      { error: "subcontractor not found" },
      { status: 404 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const uploadsDir = path.join(process.cwd(), "uploads", id);
  await mkdir(uploadsDir, { recursive: true });

  const fileName = `${Date.now()}-${file.name}`;
  const filePath = path.join(uploadsDir, fileName);
  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  const document = await prisma.document.create({
    data: {
      fileName: file.name,
      filePath,
      mimeType: file.type || "application/octet-stream",
      subcontractorId: id,
    },
  });

  return NextResponse.json(document, { status: 201 });
}
