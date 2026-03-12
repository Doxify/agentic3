import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, error } from "@/lib/api-response";
import { createSubcontractorSchema } from "@/lib/schemas";

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get("organizationId");

  const subcontractors = await prisma.subcontractor.findMany({
    where: orgId ? { organizationId: orgId } : undefined,
    orderBy: { name: "asc" },
    include: {
      organization: { select: { id: true, name: true } },
      documents: {
        select: {
          id: true,
          documentType: true,
          status: true,
          createdAt: true,
          coverages: {
            select: {
              id: true,
              coverageType: true,
              carrier: true,
              policyNumber: true,
              effectiveDate: true,
              expirationDate: true,
              limitAmount: true,
              aggregateLimit: true,
              isExpired: true,
              isCompliant: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  // Compute aggregate compliance state per subcontractor
  const enriched = subcontractors.map((sub) => {
    const allCoverages = sub.documents.flatMap((d) => d.coverages);
    const hasExpired = allCoverages.some((c) => c.isExpired);
    const hasActive = allCoverages.some((c) => !c.isExpired);
    const hasPendingDocs = sub.documents.some(
      (d) => d.status === "pending" || d.status === "processing"
    );

    let complianceStatus: "compliant" | "non_compliant" | "pending" | "unknown";
    if (hasPendingDocs && allCoverages.length === 0) {
      complianceStatus = "pending";
    } else if (allCoverages.length === 0) {
      complianceStatus = "unknown";
    } else if (hasExpired && !hasActive) {
      complianceStatus = "non_compliant";
    } else if (hasActive) {
      complianceStatus = "compliant";
    } else {
      complianceStatus = "unknown";
    }

    return { ...sub, complianceStatus };
  });

  return ok(enriched);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createSubcontractorSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0].message);

  // Verify organization exists
  const org = await prisma.organization.findUnique({
    where: { id: parsed.data.organizationId },
  });
  if (!org) return error("Organization not found", 404);

  const sub = await prisma.subcontractor.create({
    data: parsed.data,
    include: { organization: { select: { id: true, name: true } } },
  });
  return created(sub);
}
