import type {
  ComplianceOutput,
  ComplianceStatus,
  DocumentType,
  ExpiringDocument,
  ScoreBreakdown,
} from "@/lib/types";
import { ALERT_THRESHOLDS } from "@/lib/types";

/** Weight each document category contributes to the overall score */
const CATEGORY_WEIGHTS: Record<string, number> = {
  COI: 0.5,
  LICENSE: 0.3,
  SAFETY_CERT: 0.2,
};

/** Thresholds for traffic-light status */
const STATUS_THRESHOLDS = {
  green: 80,
  yellow: 50,
} as const;

/** Calculate days between two dates (positive = future, negative = past) */
export const daysBetween = (from: Date, to: Date): number =>
  Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

/** Score a single document based on its status and expiration proximity */
export const scoreDocument = (
  status: string,
  expirationDate: Date | null,
  now: Date = new Date()
): number => {
  if (status === "expired" || status === "rejected") return 0;
  if (status === "pending") return 30;
  if (status !== "verified") return 0;

  // Verified document - score based on expiration proximity
  if (!expirationDate) return 100; // No expiration = always valid

  const daysLeft = daysBetween(now, expirationDate);
  if (daysLeft < 0) return 0; // Already expired
  if (daysLeft <= 30) return 40;
  if (daysLeft <= 60) return 65;
  if (daysLeft <= 90) return 80;
  return 100;
};

/** Calculate category score from a set of documents */
export const scoreCategoryDocuments = (
  documents: Array<{ status: string; expirationDate: Date | null }>,
  now: Date = new Date()
): number => {
  if (documents.length === 0) return 0;
  const total = documents.reduce(
    (sum, doc) => sum + scoreDocument(doc.status, doc.expirationDate, now),
    0
  );
  return Math.round(total / documents.length);
};

/** Derive traffic-light status from an overall score */
export const deriveStatus = (score: number): ComplianceStatus => {
  if (score >= STATUS_THRESHOLDS.green) return "green";
  if (score >= STATUS_THRESHOLDS.yellow) return "yellow";
  return "red";
};

/** Build score breakdown by document category */
export const buildBreakdown = (
  documents: Array<{
    type: string;
    status: string;
    expirationDate: Date | null;
  }>,
  now: Date = new Date()
): ScoreBreakdown => {
  const byCategory = { COI: [] as typeof documents, LICENSE: [] as typeof documents, SAFETY_CERT: [] as typeof documents };

  for (const doc of documents) {
    const cat = doc.type as keyof typeof byCategory;
    if (cat in byCategory) byCategory[cat].push(doc);
  }

  return {
    coi: scoreCategoryDocuments(byCategory.COI, now),
    license: scoreCategoryDocuments(byCategory.LICENSE, now),
    safety: scoreCategoryDocuments(byCategory.SAFETY_CERT, now),
  };
};

/** Calculate the weighted overall score from a breakdown */
export const calculateOverallScore = (breakdown: ScoreBreakdown): number => {
  const weighted =
    breakdown.coi * CATEGORY_WEIGHTS.COI +
    breakdown.license * CATEGORY_WEIGHTS.LICENSE +
    breakdown.safety * CATEGORY_WEIGHTS.SAFETY_CERT;
  return Math.round(weighted);
};

/** Find documents expiring within the alert window */
export const findExpiringDocuments = (
  documents: Array<{
    id: string;
    type: string;
    fileName: string;
    expirationDate: Date | null;
  }>,
  now: Date = new Date()
): ExpiringDocument[] => {
  const maxThreshold = Math.max(...ALERT_THRESHOLDS);

  return documents
    .filter((doc) => {
      if (!doc.expirationDate) return false;
      const days = daysBetween(now, doc.expirationDate);
      return days >= 0 && days <= maxThreshold;
    })
    .map((doc) => ({
      documentId: doc.id,
      type: doc.type as DocumentType,
      fileName: doc.fileName,
      expirationDate: doc.expirationDate!,
      daysUntilExpiration: daysBetween(now, doc.expirationDate!),
    }))
    .sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);
};

/** Build the full compliance output for a subcontractor */
export const buildComplianceOutput = (
  subcontractorId: string,
  subcontractorName: string,
  documents: Array<{
    id: string;
    type: string;
    fileName: string;
    status: string;
    expirationDate: Date | null;
  }>,
  now: Date = new Date()
): ComplianceOutput => {
  const breakdown = buildBreakdown(documents, now);
  const overallScore = calculateOverallScore(breakdown);

  return {
    subcontractorId,
    subcontractorName,
    overallScore,
    status: deriveStatus(overallScore),
    breakdown,
    calculatedAt: now,
    expiringDocuments: findExpiringDocuments(documents, now),
  };
};
