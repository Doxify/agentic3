import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { processAlertGeneration } from "@/services/alerts";
import { formatErrorResponse } from "@/lib/errors";

/**
 * POST /api/alerts/generate
 * Trigger alert generation for all documents approaching expiration.
 * Idempotent: will not create duplicate alerts for the same threshold.
 */
export async function POST() {
  try {
    const result = await processAlertGeneration(prisma);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const { error: err, status } = formatErrorResponse(error);
    return NextResponse.json({ success: false, error: err }, { status });
  }
}
