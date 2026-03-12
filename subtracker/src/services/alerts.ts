import type {
  AlertGenerationResult,
  AlertTrigger,
  AlertType,
} from "@/lib/types";
import { ALERT_THRESHOLDS } from "@/lib/types";
import { daysBetween } from "./scoring";

/** Alert trigger matrix: defines when and how alerts fire */
export const ALERT_TRIGGERS: AlertTrigger[] = [
  {
    alertType: "EXPIRATION_90",
    daysBeforeExpiration: 90,
    subject: "Document expiring in 90 days",
    template:
      "The {{documentType}} for {{subcontractorName}} ({{fileName}}) expires on {{expirationDate}}. Please request an updated document.",
  },
  {
    alertType: "EXPIRATION_60",
    daysBeforeExpiration: 60,
    subject: "Document expiring in 60 days - Action required",
    template:
      "REMINDER: The {{documentType}} for {{subcontractorName}} ({{fileName}}) expires on {{expirationDate}}. An updated document has not been received.",
  },
  {
    alertType: "EXPIRATION_30",
    daysBeforeExpiration: 30,
    subject: "URGENT: Document expiring in 30 days",
    template:
      "URGENT: The {{documentType}} for {{subcontractorName}} ({{fileName}}) expires on {{expirationDate}}. Subcontractor compliance is at risk.",
  },
  {
    alertType: "EXPIRED",
    daysBeforeExpiration: 0,
    subject: "CRITICAL: Document has expired",
    template:
      "CRITICAL: The {{documentType}} for {{subcontractorName}} ({{fileName}}) expired on {{expirationDate}}. Subcontractor is non-compliant.",
  },
];

/** Determine which alert types should exist for a document based on its expiration date */
export const determineRequiredAlerts = (
  expirationDate: Date,
  now: Date = new Date()
): AlertType[] => {
  const daysLeft = daysBetween(now, expirationDate);
  const alerts: AlertType[] = [];

  if (daysLeft < 0) {
    alerts.push("EXPIRED");
  }

  for (const threshold of ALERT_THRESHOLDS) {
    if (daysLeft <= threshold) {
      alerts.push(`EXPIRATION_${threshold}` as AlertType);
    }
  }

  return alerts;
};

/** Render an alert template with context variables */
export const renderTemplate = (
  template: string,
  vars: Record<string, string>
): string =>
  Object.entries(vars).reduce(
    (result, [key, value]) => result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value),
    template
  );

/** Get the trigger config for a given alert type */
export const getTriggerForType = (
  alertType: AlertType
): AlertTrigger | undefined =>
  ALERT_TRIGGERS.find((t) => t.alertType === alertType);

/**
 * Generate alerts for documents approaching expiration.
 *
 * Pure logic layer — accepts document and existing alert data,
 * returns which alerts need to be created. Does not touch the DB directly.
 */
export const generateAlerts = (
  documents: Array<{
    id: string;
    expirationDate: Date | null;
    existingAlertTypes: string[];
  }>,
  now: Date = new Date()
): { documentId: string; alertType: AlertType; scheduledAt: Date }[] => {
  const newAlerts: { documentId: string; alertType: AlertType; scheduledAt: Date }[] = [];

  for (const doc of documents) {
    if (!doc.expirationDate) continue;

    const required = determineRequiredAlerts(doc.expirationDate, now);

    for (const alertType of required) {
      if (doc.existingAlertTypes.includes(alertType)) continue;
      newAlerts.push({
        documentId: doc.id,
        alertType,
        scheduledAt: now,
      });
    }
  }

  return newAlerts;
};

/**
 * Process alert generation against the database.
 * This is the integration layer that connects pure logic to Prisma.
 */
export const processAlertGeneration = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: { document: any; alert: any },
  now: Date = new Date()
): Promise<AlertGenerationResult> => {
  const errors: string[] = [];
  let created = 0;
  let skipped = 0;

  const documents = await prisma.document.findMany({
    where: {
      expirationDate: { not: null },
      status: { in: ["pending", "verified"] },
    },
    include: { alerts: { select: { type: true } } },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const alertInputs = documents.map((doc: any) => ({
    id: doc.id as string,
    expirationDate: doc.expirationDate as Date | null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    existingAlertTypes: doc.alerts.map((a: any) => a.type as string),
  }));

  const newAlerts = generateAlerts(alertInputs, now);

  if (newAlerts.length === 0) {
    return { created: 0, skipped: documents.length, errors: [] };
  }

  try {
    const result = await prisma.alert.createMany({
      data: newAlerts.map((a) => ({
        documentId: a.documentId,
        type: a.alertType,
        status: "pending",
        scheduledAt: a.scheduledAt,
      })),
    });
    created = result.count;
    skipped = documents.length - newAlerts.length;
  } catch (err) {
    errors.push(`Failed to create alerts: ${err instanceof Error ? err.message : String(err)}`);
  }

  return { created, skipped, errors };
};
