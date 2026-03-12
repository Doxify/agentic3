import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, error, notFound } from "@/lib/api-response";
import { runExtractionPipeline } from "@/lib/extraction";

/**
 * POST /api/documents/:id/extract
 * Manually trigger (re-)extraction for a document.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return notFound("Document");

  if (doc.documentType !== "coi") {
    return error("Extraction only supported for COI documents");
  }

  try {
    await runExtractionPipeline(id);
    const updated = await prisma.document.findUnique({
      where: { id },
      include: { coverages: true, extractionLog: true },
    });
    return ok(updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Extraction failed";
    return error(msg, 500);
  }
}
