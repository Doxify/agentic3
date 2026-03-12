import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound } from "@/lib/api-response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sub = await prisma.subcontractor.findUnique({
    where: { id },
    include: {
      organization: { select: { id: true, name: true } },
      documents: {
        include: {
          coverages: true,
          extractionLog: {
            select: {
              success: true,
              completedAt: true,
              errorMessage: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!sub) return notFound("Subcontractor");

  // Compute compliance summary
  const allCoverages = sub.documents.flatMap((d) => d.coverages);
  const coverageSummary = allCoverages.reduce(
    (acc, c) => {
      acc[c.coverageType] = {
        isExpired: c.isExpired,
        expirationDate: c.expirationDate,
        carrier: c.carrier,
        policyNumber: c.policyNumber,
      };
      return acc;
    },
    {} as Record<
      string,
      {
        isExpired: boolean;
        expirationDate: Date | null;
        carrier: string | null;
        policyNumber: string | null;
      }
    >
  );

  return ok({ ...sub, coverageSummary });
}
