/** Alert threshold days before document expiration */
export const ALERT_THRESHOLDS = [90, 60, 30] as const;
export type AlertThreshold = (typeof ALERT_THRESHOLDS)[number];

/** Alert type derived from threshold */
export type AlertType = "EXPIRATION_90" | "EXPIRATION_60" | "EXPIRATION_30" | "EXPIRED";

/** Alert delivery status */
export type AlertStatus = "pending" | "sent" | "acknowledged" | "dismissed";

/** Document types tracked for compliance */
export type DocumentType = "COI" | "LICENSE" | "SAFETY_CERT";

/** Document verification status */
export type DocumentStatus = "pending" | "verified" | "expired" | "rejected";

/** Compliance traffic-light status */
export type ComplianceStatus = "green" | "yellow" | "red";

/** Scoring breakdown by document category */
export interface ScoreBreakdown {
  coi: number;
  license: number;
  safety: number;
}

/** Service-level compliance output for dashboard consumption */
export interface ComplianceOutput {
  subcontractorId: string;
  subcontractorName: string;
  overallScore: number;
  status: ComplianceStatus;
  breakdown: ScoreBreakdown;
  calculatedAt: Date;
  expiringDocuments: ExpiringDocument[];
}

/** Document approaching expiration */
export interface ExpiringDocument {
  documentId: string;
  type: DocumentType;
  fileName: string;
  expirationDate: Date;
  daysUntilExpiration: number;
}

/** Alert trigger matrix entry */
export interface AlertTrigger {
  alertType: AlertType;
  daysBeforeExpiration: number;
  template: string;
  subject: string;
}

/** Result of an alert generation run */
export interface AlertGenerationResult {
  created: number;
  skipped: number;
  errors: string[];
}

/** Retry configuration for integration hardening */
export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}
