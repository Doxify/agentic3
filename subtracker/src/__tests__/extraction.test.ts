import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { execFileSync } from "child_process";

const TEST_DB_URL = "file:./test.db";
process.env.DATABASE_URL = TEST_DB_URL;

const adapter = new PrismaLibSql({ url: TEST_DB_URL });
const prisma = new PrismaClient({ adapter });

describe("COI extraction pipeline", () => {
  let orgId: string;
  let subId: string;
  let docId: string;

  beforeEach(async () => {
    execFileSync("npx", ["prisma", "db", "push", "--force-reset", "--accept-data-loss"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: "file:./test.db",
        PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: "yes",
      },
      stdio: "pipe",
    });

    const org = await prisma.organization.create({
      data: { name: "Test Org" },
    });
    orgId = org.id;

    const sub = await prisma.subcontractor.create({
      data: { name: "Test Sub", organizationId: orgId },
    });
    subId = sub.id;

    const doc = await prisma.document.create({
      data: {
        fileName: "test-coi.pdf",
        filePath: "/tmp/test-coi.pdf",
        mimeType: "application/pdf",
        subcontractorId: subId,
      },
    });
    docId = doc.id;
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it("should create document with pending status", async () => {
    const doc = await prisma.document.findUnique({ where: { id: docId } });
    expect(doc).not.toBeNull();
    expect(doc!.status).toBe("pending");
  });

  it("should transition document through extraction lifecycle", async () => {
    await prisma.document.update({
      where: { id: docId },
      data: { status: "processing" },
    });

    const docProcessing = await prisma.document.findUnique({ where: { id: docId } });
    expect(docProcessing!.status).toBe("processing");

    await prisma.coverage.createMany({
      data: [
        {
          documentId: docId,
          type: "general_liability",
          carrier: "Test Carrier",
          policyNumber: "GL-001",
          effectiveDate: new Date("2026-01-01"),
          expirationDate: new Date("2027-01-01"),
          limitAmount: 1_000_000,
        },
      ],
    });

    await prisma.document.update({
      where: { id: docId },
      data: { status: "processed" },
    });

    const docProcessed = await prisma.document.findUnique({
      where: { id: docId },
    });
    expect(docProcessed!.status).toBe("processed");

    const coverages = await prisma.coverage.findMany({
      where: { documentId: docId },
    });
    expect(coverages).toHaveLength(1);
    expect(coverages[0].type).toBe("general_liability");
  });

  it("should support idempotent re-extraction (delete old coverages)", async () => {
    await prisma.coverage.create({
      data: {
        documentId: docId,
        type: "auto",
        carrier: "Old Carrier",
        limitAmount: 100_000,
      },
    });

    let coverages = await prisma.coverage.findMany({
      where: { documentId: docId },
    });
    expect(coverages).toHaveLength(1);

    await prisma.coverage.deleteMany({ where: { documentId: docId } });
    await prisma.coverage.createMany({
      data: [
        { documentId: docId, type: "auto", carrier: "New Carrier", limitAmount: 200_000 },
        { documentId: docId, type: "workers_comp", carrier: "New Carrier", limitAmount: 500_000 },
      ],
    });

    coverages = await prisma.coverage.findMany({
      where: { documentId: docId },
    });
    expect(coverages).toHaveLength(2);
    const autoCov = coverages.find((c) => c.type === "auto");
    expect(autoCov!.carrier).toBe("New Carrier");
  });

  it("should log extraction attempts", async () => {
    await prisma.extractionLog.create({
      data: {
        documentId: docId,
        status: "success",
        rawOutput: JSON.stringify([{ type: "general_liability" }]),
      },
    });

    await prisma.extractionLog.create({
      data: {
        documentId: docId,
        status: "error",
        error: "OCR service unavailable",
      },
    });

    const logs = await prisma.extractionLog.findMany({
      where: { documentId: docId },
      orderBy: { createdAt: "asc" },
    });
    expect(logs).toHaveLength(2);
    expect(logs[0].status).toBe("success");
    expect(logs[1].status).toBe("error");
    expect(logs[1].error).toBe("OCR service unavailable");
  });

  it("should cascade delete from subcontractor to documents and coverages", async () => {
    await prisma.coverage.create({
      data: {
        documentId: docId,
        type: "umbrella",
        limitAmount: 5_000_000,
      },
    });

    await prisma.subcontractor.delete({ where: { id: subId } });

    const docs = await prisma.document.findMany({
      where: { subcontractorId: subId },
    });
    expect(docs).toHaveLength(0);

    const coverages = await prisma.coverage.findMany({
      where: { documentId: docId },
    });
    expect(coverages).toHaveLength(0);
  });

  it("should cascade delete from organization to all children", async () => {
    await prisma.organization.delete({ where: { id: orgId } });

    const subs = await prisma.subcontractor.findMany({
      where: { organizationId: orgId },
    });
    expect(subs).toHaveLength(0);
  });
});
