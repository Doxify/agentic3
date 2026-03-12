import { NextRequest, NextResponse } from "next/server";
import { extractCoverages } from "@/lib/extraction";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) {
    return NextResponse.json({ error: "document not found" }, { status: 404 });
  }

  try {
    const result = await extractCoverages(id);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "extraction failed", details: message },
      { status: 500 }
    );
  }
}
