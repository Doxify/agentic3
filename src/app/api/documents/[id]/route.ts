import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound } from "@/lib/api-response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      subcontractor: {
        select: { id: true, name: true, organizationId: true },
      },
      coverages: true,
      extractionLog: true,
    },
  });

  if (!doc) return notFound("Document");
  return ok(doc);
}
