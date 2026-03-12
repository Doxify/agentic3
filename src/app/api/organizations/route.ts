import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, error } from "@/lib/api-response";
import { createOrganizationSchema } from "@/lib/schemas";

export async function GET() {
  const orgs = await prisma.organization.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { subcontractors: true } } },
  });
  return ok(orgs);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createOrganizationSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0].message);

  const org = await prisma.organization.create({ data: parsed.data });
  return created(org);
}
