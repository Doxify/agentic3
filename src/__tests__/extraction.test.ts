import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { runExtractionPipeline } from "@/lib/extraction";

const prisma = new PrismaClient();

describe("COI Extraction Pipeline", () => {
  let orgId: string;
  let subId: string;

  beforeEach(async () => {
    const org = await prisma.organization.create({
      data: { name: "Test Org" },
    });
    orgId = org.id;

    const sub = await prisma.subcontractor.create({
      data: { name: "Test Sub", organizationId: orgId },
    });
    subId = sub.id;
  });

  afterEach(async () => {
    await prisma.extractionLog.deleteMany();
    await prisma.coverage.deleteMany();
    await prisma.document.deleteMany();
    await prisma.subcontractor.deleteMany();
    await prisma.organization.deleteMany();
  });

  it("should process a document through the extraction pipeline", async () => {
    const doc = await prisma.document.create({
      data: {
        subcontractorId: subId,
        filename: "test.pdf",
        originalFilename: "test.pdf",
        mimeType: "application/pdf",
        fileSize: 1024,
        storagePath: "/tmp/test.pdf",
        documentType: "coi",
        status: "pending",
      },
    });

    await runExtractionPipeline(doc.id);

    const updated = await prisma.document.findUnique({
      where: { id: doc.id },
      include: { extractionLog: true },
    });

    expect(updated).not.toBeNull();
    expect(updated!.status).toBe("processed");
    expect(updated!.extractionLog).not.toBeNull();
    expect(updated!.extractionLog!.success).toBe(true);
  });

  it("should throw for non-existent document", async () => {
    await expect(
      runExtractionPipeline("non-existent-id")
    ).rejects.toThrow("Document non-existent-id not found");
  });

  it("should transition document through processing states", async () => {
    const doc = await prisma.document.create({
      data: {
        subcontractorId: subId,
        filename: "states.pdf",
        originalFilename: "states.pdf",
        mimeType: "application/pdf",
        fileSize: 512,
        storagePath: "/tmp/states.pdf",
        documentType: "coi",
        status: "pending",
      },
    });

    // Initially pending
    expect(doc.status).toBe("pending");

    await runExtractionPipeline(doc.id);

    // After pipeline completes: processed
    const after = await prisma.document.findUnique({ where: { id: doc.id } });
    expect(after!.status).toBe("processed");
  });
});

describe("Schema Validation", () => {
  it("should create and retrieve an organization", async () => {
    const org = await prisma.organization.create({
      data: { name: "Schema Test Org" },
    });
    expect(org.name).toBe("Schema Test Org");
    expect(org.id).toBeTruthy();

    const fetched = await prisma.organization.findUnique({
      where: { id: org.id },
    });
    expect(fetched).not.toBeNull();

    await prisma.organization.delete({ where: { id: org.id } });
  });

  it("should cascade delete subcontractors when org is deleted", async () => {
    const org = await prisma.organization.create({
      data: { name: "Cascade Test" },
    });
    const sub = await prisma.subcontractor.create({
      data: { name: "Sub to delete", organizationId: org.id },
    });

    await prisma.organization.delete({ where: { id: org.id } });

    const deleted = await prisma.subcontractor.findUnique({
      where: { id: sub.id },
    });
    expect(deleted).toBeNull();
  });

  it("should cascade delete documents and coverages", async () => {
    const org = await prisma.organization.create({
      data: { name: "Doc Cascade" },
    });
    const sub = await prisma.subcontractor.create({
      data: { name: "Sub with docs", organizationId: org.id },
    });
    const doc = await prisma.document.create({
      data: {
        subcontractorId: sub.id,
        filename: "cascade.pdf",
        originalFilename: "cascade.pdf",
        mimeType: "application/pdf",
        fileSize: 100,
        storagePath: "/tmp/cascade.pdf",
      },
    });
    await prisma.coverage.create({
      data: {
        documentId: doc.id,
        coverageType: "general_liability",
        limitAmount: 1000000,
      },
    });

    await prisma.organization.delete({ where: { id: org.id } });

    const deletedDoc = await prisma.document.findUnique({
      where: { id: doc.id },
    });
    expect(deletedDoc).toBeNull();
  });
});
