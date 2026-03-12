import { prisma } from "./prisma";

/**
 * Coverage type constants used across the system.
 */
export const COVERAGE_TYPES = [
  "general_liability",
  "auto_liability",
  "umbrella",
  "workers_comp",
  "professional_liability",
] as const;

export type CoverageType = (typeof COVERAGE_TYPES)[number];

/**
 * Parsed coverage entry from a COI document.
 */
export interface ParsedCoverage {
  coverageType: CoverageType;
  carrier?: string;
  policyNumber?: string;
  effectiveDate?: string; // ISO date string
  expirationDate?: string; // ISO date string
  limitAmount?: number;
  aggregateLimit?: number;
}

/**
 * Result of running the extraction pipeline on a document.
 */
export interface ExtractionResult {
  success: boolean;
  coverages: ParsedCoverage[];
  error?: string;
  rawOutput?: string;
}

/**
 * Parse a COI document and extract coverage data.
 *
 * Current implementation: stub parser that returns empty coverages.
 * Production: integrate OCR (Textract, Google Vision) + LLM extraction.
 */
export async function parseCOIDocument(
  _filePath: string,
  _mimeType: string
): Promise<ExtractionResult> {
  // Stub: in production, this would:
  // 1. Send the document to an OCR service
  // 2. Parse the OCR output with an LLM or rule-based extractor
  // 3. Return structured coverage data
  return {
    success: true,
    coverages: [],
    rawOutput: "stub: no OCR provider configured",
  };
}

/**
 * Run the full extraction pipeline for a document:
 * 1. Mark document as processing
 * 2. Parse the document
 * 3. Persist extracted coverages
 * 4. Update document status and extraction log
 */
export async function runExtractionPipeline(documentId: string): Promise<void> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!doc) throw new Error(`Document ${documentId} not found`);

  await prisma.document.update({
    where: { id: documentId },
    data: { status: "processing" },
  });

  const startedAt = new Date();
  let result: ExtractionResult;

  try {
    result = await parseCOIDocument(doc.storagePath, doc.mimeType);
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown extraction error";
    await prisma.$transaction([
      prisma.document.update({
        where: { id: documentId },
        data: { status: "failed" },
      }),
      prisma.extractionLog.upsert({
        where: { documentId },
        create: {
          documentId,
          startedAt,
          completedAt: new Date(),
          success: false,
          errorMessage,
        },
        update: {
          startedAt,
          completedAt: new Date(),
          success: false,
          errorMessage,
        },
      }),
    ]);
    return;
  }

  const now = new Date();

  await prisma.$transaction([
    // Delete any previous coverages for re-extraction
    prisma.coverage.deleteMany({ where: { documentId } }),

    // Create new coverages
    ...result.coverages.map((c) =>
      prisma.coverage.create({
        data: {
          documentId,
          coverageType: c.coverageType,
          carrier: c.carrier ?? null,
          policyNumber: c.policyNumber ?? null,
          effectiveDate: c.effectiveDate ? new Date(c.effectiveDate) : null,
          expirationDate: c.expirationDate
            ? new Date(c.expirationDate)
            : null,
          limitAmount: c.limitAmount ?? null,
          aggregateLimit: c.aggregateLimit ?? null,
          isExpired: c.expirationDate
            ? new Date(c.expirationDate) < now
            : false,
          isCompliant: c.expirationDate
            ? new Date(c.expirationDate) >= now
            : false,
        },
      })
    ),

    prisma.document.update({
      where: { id: documentId },
      data: { status: result.success ? "processed" : "failed" },
    }),

    prisma.extractionLog.upsert({
      where: { documentId },
      create: {
        documentId,
        startedAt,
        completedAt: now,
        success: result.success,
        errorMessage: result.error ?? null,
        rawOutput: result.rawOutput ?? null,
      },
      update: {
        startedAt,
        completedAt: now,
        success: result.success,
        errorMessage: result.error ?? null,
        rawOutput: result.rawOutput ?? null,
      },
    }),
  ]);
}
