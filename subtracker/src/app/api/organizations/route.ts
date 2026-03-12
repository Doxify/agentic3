import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { subcontractors: true } } },
  });
  return NextResponse.json(organizations);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const organization = await prisma.organization.create({
    data: { name: body.name.trim() },
  });
  return NextResponse.json(organization, { status: 201 });
}
