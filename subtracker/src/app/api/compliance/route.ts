import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildComplianceOutput } from "@/services/scoring";
import { formatErrorResponse } from "@/lib/errors";

/**
 * GET /api/compliance?organizationId=xxx
 * Return compliance scores for all subcontractors in an organization.
 * Service-level output for dashboard consumption.
 */
export async function GET(request: NextRequest) {
  try {
    const organizationId = request.nextUrl.searchParams.get("organizationId");

    const where = organizationId ? { organizationId } : {};

    const subcontractors = await prisma.subcontractor.findMany({
      where,
      include: {
        documents: {
          select: {
            id: true,
            type: true,
            fileName: true,
            status: true,
            expirationDate: true,
          },
        },
      },
    });

    const results = subcontractors.map((sub: typeof subcontractors[number]) =>
      buildComplianceOutput(sub.id, sub.name, sub.documents)
    );

    const summary = {
      total: results.length,
      green: results.filter((r: (typeof results)[number]) => r.status === "green").length,
      yellow: results.filter((r: (typeof results)[number]) => r.status === "yellow").length,
      red: results.filter((r: (typeof results)[number]) => r.status === "red").length,
      averageScore:
        results.length > 0
          ? Math.round(results.reduce((s: number, r: (typeof results)[number]) => s + r.overallScore, 0) / results.length)
          : 0,
    };

    return NextResponse.json({ summary, subcontractors: results });
  } catch (error) {
    const { error: err, status } = formatErrorResponse(error);
    return NextResponse.json({ error: err }, { status });
  }
}
