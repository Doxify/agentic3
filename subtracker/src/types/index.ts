export type ComplianceStatus = "compliant" | "expiring_soon" | "non_compliant" | "pending";

export type DocumentStatus = "valid" | "expiring" | "expired" | "pending_review" | "missing";

export interface Subcontractor {
  id: string;
  name: string;
  email: string;
  company: string;
  status: ComplianceStatus;
  invitedAt: string;
  onboardedAt: string | null;
  documents: Document[];
}

export interface Document {
  id: string;
  subcontractorId: string;
  type: DocumentType;
  fileName: string;
  status: DocumentStatus;
  uploadedAt: string;
  expiresAt: string | null;
  extractedData: ExtractedCOIData | null;
}

export type DocumentType =
  | "coi"
  | "w9"
  | "insurance_endorsement"
  | "license"
  | "other";

export interface ExtractedCOIData {
  policyNumber: string | null;
  carrier: string | null;
  effectiveDate: string | null;
  expirationDate: string | null;
  coverageTypes: string[];
  limits: Record<string, string>;
}

export interface SubcontractorInvite {
  name: string;
  email: string;
  company: string;
  message?: string;
}

export interface ComplianceSummary {
  total: number;
  compliant: number;
  expiringSoon: number;
  nonCompliant: number;
  pending: number;
}
