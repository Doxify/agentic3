import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      coverages: { orderBy: { createdAt: "desc" } },
      extractionLogs: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!document) {
    return NextResponse.json({ error: "document not found" }, { status: 404 });
  }

  return NextResponse.json(document);
}
