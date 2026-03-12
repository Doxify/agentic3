import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { ok, created, error, notFound } from "@/lib/api-response";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "@/lib/schemas";
import { runExtractionPipeline } from "@/lib/extraction";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const docs = await prisma.document.findMany({
    where: { subcontractorId: id },
    include: {
      coverages: true,
      extractionLog: {
        select: { success: true, completedAt: true, errorMessage: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return ok(docs);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Verify subcontractor exists
  const sub = await prisma.subcontractor.findUnique({ where: { id } });
  if (!sub) return notFound("Subcontractor");

  const formData = await req.formData().catch(() => null);
  if (!formData) return error("Expected multipart form data");

  const file = formData.get("file") as File | null;
  if (!file) return error("Missing 'file' field");

  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return error(
      `Unsupported file type: ${file.type}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return error(`File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  const documentType =
    (formData.get("documentType") as string) || "coi";

  // Save file to disk
  const fileId = randomUUID();
  const ext = path.extname(file.name) || ".pdf";
  const filename = `${fileId}${ext}`;
  const uploadDir = path.join(process.cwd(), "uploads", id);
  await mkdir(uploadDir, { recursive: true });
  const storagePath = path.join(uploadDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(storagePath, buffer);

  const doc = await prisma.document.create({
    data: {
      subcontractorId: id,
      filename,
      originalFilename: file.name,
      mimeType: file.type,
      fileSize: file.size,
      storagePath,
      documentType,
      status: "pending",
    },
  });

  // Trigger extraction asynchronously (fire-and-forget)
  if (documentType === "coi") {
    runExtractionPipeline(doc.id).catch((err) =>
      console.error(`Extraction failed for doc ${doc.id}:`, err)
    );
  }

  return created(doc);
}
