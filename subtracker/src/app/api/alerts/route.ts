import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatErrorResponse } from "@/lib/errors";

/**
 * GET /api/alerts?status=pending&documentId=xxx
 * List alerts with optional filtering by status or document.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const documentId = searchParams.get("documentId");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (documentId) where.documentId = documentId;

    const alerts = await prisma.alert.findMany({
      where,
      orderBy: { scheduledAt: "asc" },
      include: {
        document: {
          select: {
            id: true,
            type: true,
            fileName: true,
            expirationDate: true,
            subcontractor: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    const { error: err, status } = formatErrorResponse(error);
    return NextResponse.json({ error: err }, { status });
  }
}
