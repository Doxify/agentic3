import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatErrorResponse, NotFoundError, ValidationError } from "@/lib/errors";

const VALID_STATUSES = ["pending", "sent", "acknowledged", "dismissed"];

/**
 * PATCH /api/alerts/:id
 * Update alert status (e.g., mark as sent, acknowledged, or dismissed).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      throw new ValidationError(`status must be one of: ${VALID_STATUSES.join(", ")}`);
    }

    const existing = await prisma.alert.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Alert", id);

    const data: Record<string, unknown> = { status };
    if (status === "sent" && !existing.sentAt) {
      data.sentAt = new Date();
    }

    const updated = await prisma.alert.update({ where: { id }, data });
    return NextResponse.json({ alert: updated });
  } catch (error) {
    const { error: err, status } = formatErrorResponse(error);
    return NextResponse.json({ error: err }, { status });
  }
}
