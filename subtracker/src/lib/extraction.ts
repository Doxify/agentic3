import { prisma } from "@/lib/prisma";

interface ExtractedCoverage {
  type: string;
  carrier: string | null;
  policyNumber: string | null;
  effectiveDate: string | null;
  expirationDate: string | null;
  limitAmount: number | null;
}

/**
 * Stub COI parser. In production, this would call an OCR provider
 * (AWS Textract, Google Vision, etc.) and then an LLM to extract
 * structured coverage data from the document.
 */
function parseCOI(_filePath: string): ExtractedCoverage[] {
  // Stub: returns sample data to validate the pipeline end-to-end.
  // Replace with real OCR + LLM extraction in production.
  return [
    {
      type: "general_liability",
      carrier: "Acme Insurance Co.",
      policyNumber: "GL-2026-001",
      effectiveDate: "2026-01-01",
      expirationDate: "2027-01-01",
      limitAmount: 1_000_000,
    },
    {
      type: "workers_comp",
      carrier: "Acme Insurance Co.",
      policyNumber: "WC-2026-001",
      effectiveDate: "2026-01-01",
      expirationDate: "2027-01-01",
      limitAmount: 500_000,
    },
  ];
}

export async function extractCoverages(documentId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) throw new Error("Document not found");

  // Mark as processing
  await prisma.document.update({
    where: { id: documentId },
    data: { status: "processing" },
  });

  try {
    const extracted = parseCOI(document.filePath);

    // Delete old coverages for idempotent re-extraction
    await prisma.coverage.deleteMany({ where: { documentId } });

    // Persist extracted coverages
    await prisma.coverage.createMany({
      data: extracted.map((c) => ({
        documentId,
        type: c.type,
        carrier: c.carrier,
        policyNumber: c.policyNumber,
        effectiveDate: c.effectiveDate ? new Date(c.effectiveDate) : null,
        expirationDate: c.expirationDate ? new Date(c.expirationDate) : null,
        limitAmount: c.limitAmount,
      })),
    });

    // Log success
    await prisma.extractionLog.create({
      data: {
        documentId,
        status: "success",
        rawOutput: JSON.stringify(extracted),
      },
    });

    // Mark processed
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "processed" },
    });

    return { status: "processed", coveragesExtracted: extracted.length };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    await prisma.extractionLog.create({
      data: {
        documentId,
        status: "error",
        error: errorMessage,
      },
    });

    await prisma.document.update({
      where: { id: documentId },
      data: { status: "failed" },
    });

    throw err;
  }
}
