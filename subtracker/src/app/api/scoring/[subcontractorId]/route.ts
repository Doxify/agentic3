import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildComplianceOutput } from "@/services/scoring";
import { formatErrorResponse, NotFoundError } from "@/lib/errors";

/**
 * GET /api/scoring/:subcontractorId
 * Calculate and return the compliance score for a subcontractor.
 * Optionally persists the score if ?persist=true is passed.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subcontractorId: string }> }
) {
  try {
    const { subcontractorId } = await params;
    const persist = request.nextUrl.searchParams.get("persist") === "true";

    const subcontractor = await prisma.subcontractor.findUnique({
      where: { id: subcontractorId },
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

    if (!subcontractor) {
      throw new NotFoundError("Subcontractor", subcontractorId);
    }

    const output = buildComplianceOutput(
      subcontractor.id,
      subcontractor.name,
      subcontractor.documents
    );

    if (persist) {
      await prisma.complianceScore.create({
        data: {
          subcontractorId: output.subcontractorId,
          overallScore: output.overallScore,
          breakdown: JSON.stringify(output.breakdown),
          status: output.status,
        },
      });
    }

    return NextResponse.json(output);
  } catch (error) {
    const { error: err, status } = formatErrorResponse(error);
    return NextResponse.json({ error: err }, { status });
  }
}
