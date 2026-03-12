import type { Subcontractor, SubcontractorInvite, ComplianceSummary } from "@/types";
import { mockSubcontractors, getMockComplianceSummary } from "./mock-data";

// Mock API client — will be replaced with real endpoints when Stream A (ACM-89) delivers
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchSubcontractors(): Promise<Subcontractor[]> {
  await delay(300);
  return mockSubcontractors;
}

export async function fetchSubcontractor(id: string): Promise<Subcontractor | null> {
  await delay(200);
  return mockSubcontractors.find((s) => s.id === id) ?? null;
}

export async function fetchComplianceSummary(): Promise<ComplianceSummary> {
  await delay(200);
  return getMockComplianceSummary();
}

export async function inviteSubcontractor(data: SubcontractorInvite): Promise<Subcontractor> {
  await delay(500);
  const newSub: Subcontractor = {
    id: `sub-${Date.now()}`,
    name: data.name,
    email: data.email,
    company: data.company,
    status: "pending",
    invitedAt: new Date().toISOString(),
    onboardedAt: null,
    documents: [],
  };
  return newSub;
}

export async function uploadDocument(
  _subcontractorId: string,
  _file: File,
): Promise<{ success: boolean; documentId: string }> {
  await delay(800);
  return { success: true, documentId: `doc-${Date.now()}` };
}
