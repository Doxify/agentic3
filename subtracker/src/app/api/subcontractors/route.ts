import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function computeComplianceStatus(
  subcontractor: { documents: { status: string; coverages: { expirationDate: Date | null }[] }[] }
): "compliant" | "non_compliant" | "pending" | "no_documents" {
  const docs = subcontractor.documents;
  if (docs.length === 0) return "no_documents";

  const hasProcessed = docs.some((d) => d.status === "processed");
  if (!hasProcessed) return "pending";

  const now = new Date();
  const allCoverages = docs.flatMap((d) => d.coverages);
  if (allCoverages.length === 0) return "non_compliant";

  const hasExpired = allCoverages.some(
    (c) => c.expirationDate && c.expirationDate < now
  );
  return hasExpired ? "non_compliant" : "compliant";
}

export async function GET(request: NextRequest) {
  const organizationId = request.nextUrl.searchParams.get("organizationId");

  if (!organizationId) {
    return NextResponse.json(
      { error: "organizationId query param is required" },
      { status: 400 }
    );
  }

  const subcontractors = await prisma.subcontractor.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      documents: {
        include: { coverages: true },
      },
    },
  });

  const result = subcontractors.map((sub) => ({
    id: sub.id,
    name: sub.name,
    contactEmail: sub.contactEmail,
    organizationId: sub.organizationId,
    createdAt: sub.createdAt,
    updatedAt: sub.updatedAt,
    complianceStatus: computeComplianceStatus(sub),
    documentCount: sub.documents.length,
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!body.organizationId) {
    return NextResponse.json(
      { error: "organizationId is required" },
      { status: 400 }
    );
  }

  const org = await prisma.organization.findUnique({
    where: { id: body.organizationId },
  });
  if (!org) {
    return NextResponse.json(
      { error: "organization not found" },
      { status: 404 }
    );
  }

  const subcontractor = await prisma.subcontractor.create({
    data: {
      name: body.name.trim(),
      contactEmail: body.contactEmail ?? null,
      organizationId: body.organizationId,
    },
  });
  return NextResponse.json(subcontractor, { status: 201 });
}
