import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const subcontractor = await prisma.subcontractor.findUnique({
    where: { id },
    include: {
      documents: {
        include: { coverages: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!subcontractor) {
    return NextResponse.json(
      { error: "subcontractor not found" },
      { status: 404 }
    );
  }

  // Build a coverage summary map: type -> latest coverage info
  const coverageSummary: Record<
    string,
    { carrier: string | null; expirationDate: Date | null; limitAmount: number | null; isExpired: boolean }
  > = {};
  const now = new Date();

  for (const doc of subcontractor.documents) {
    for (const cov of doc.coverages) {
      if (!coverageSummary[cov.type] || (cov.expirationDate && (!coverageSummary[cov.type].expirationDate || cov.expirationDate > coverageSummary[cov.type].expirationDate!))) {
        coverageSummary[cov.type] = {
          carrier: cov.carrier,
          expirationDate: cov.expirationDate,
          limitAmount: cov.limitAmount,
          isExpired: cov.expirationDate ? cov.expirationDate < now : false,
        };
      }
    }
  }

  return NextResponse.json({
    ...subcontractor,
    coverageSummary,
  });
}
