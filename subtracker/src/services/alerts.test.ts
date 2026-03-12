import { describe, it, expect } from "vitest";
import {
  determineRequiredAlerts,
  renderTemplate,
  getTriggerForType,
  generateAlerts,
  ALERT_TRIGGERS,
} from "./alerts";

const now = new Date("2026-03-11T00:00:00Z");
const daysFromNow = (days: number) =>
  new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

describe("determineRequiredAlerts", () => {
  it("returns EXPIRED for past dates", () => {
    const alerts = determineRequiredAlerts(daysFromNow(-5), now);
    expect(alerts).toContain("EXPIRED");
    // Also includes all threshold alerts since daysLeft < all thresholds
    expect(alerts).toContain("EXPIRATION_30");
    expect(alerts).toContain("EXPIRATION_60");
    expect(alerts).toContain("EXPIRATION_90");
  });

  it("returns 30-day alert when 25 days remain", () => {
    const alerts = determineRequiredAlerts(daysFromNow(25), now);
    expect(alerts).toContain("EXPIRATION_30");
    expect(alerts).toContain("EXPIRATION_60");
    expect(alerts).toContain("EXPIRATION_90");
    expect(alerts).not.toContain("EXPIRED");
  });

  it("returns 60-day alert when 55 days remain", () => {
    const alerts = determineRequiredAlerts(daysFromNow(55), now);
    expect(alerts).toContain("EXPIRATION_60");
    expect(alerts).toContain("EXPIRATION_90");
    expect(alerts).not.toContain("EXPIRATION_30");
  });

  it("returns 90-day alert when 85 days remain", () => {
    const alerts = determineRequiredAlerts(daysFromNow(85), now);
    expect(alerts).toContain("EXPIRATION_90");
    expect(alerts).not.toContain("EXPIRATION_60");
    expect(alerts).not.toContain("EXPIRATION_30");
  });

  it("returns empty for far-future dates", () => {
    const alerts = determineRequiredAlerts(daysFromNow(120), now);
    expect(alerts).toHaveLength(0);
  });
});

describe("renderTemplate", () => {
  it("replaces all template variables", () => {
    const template = "{{documentType}} for {{subcontractorName}} expires on {{expirationDate}}";
    const result = renderTemplate(template, {
      documentType: "COI",
      subcontractorName: "Acme",
      expirationDate: "2026-06-01",
    });
    expect(result).toBe("COI for Acme expires on 2026-06-01");
  });

  it("handles missing variables gracefully", () => {
    const result = renderTemplate("Hello {{name}}", {});
    expect(result).toBe("Hello {{name}}");
  });

  it("replaces multiple occurrences", () => {
    const result = renderTemplate("{{a}} and {{a}}", { a: "X" });
    expect(result).toBe("X and X");
  });
});

describe("getTriggerForType", () => {
  it("returns trigger for valid types", () => {
    expect(getTriggerForType("EXPIRATION_90")).toBeDefined();
    expect(getTriggerForType("EXPIRATION_60")).toBeDefined();
    expect(getTriggerForType("EXPIRATION_30")).toBeDefined();
    expect(getTriggerForType("EXPIRED")).toBeDefined();
  });
});

describe("ALERT_TRIGGERS", () => {
  it("has 4 trigger definitions", () => {
    expect(ALERT_TRIGGERS).toHaveLength(4);
  });

  it("has correct days mapping", () => {
    const map = Object.fromEntries(ALERT_TRIGGERS.map((t) => [t.alertType, t.daysBeforeExpiration]));
    expect(map["EXPIRATION_90"]).toBe(90);
    expect(map["EXPIRATION_60"]).toBe(60);
    expect(map["EXPIRATION_30"]).toBe(30);
    expect(map["EXPIRED"]).toBe(0);
  });
});

describe("generateAlerts", () => {
  it("creates alerts for documents within thresholds", () => {
    const docs = [
      { id: "doc-1", expirationDate: daysFromNow(25), existingAlertTypes: [] },
    ];
    const alerts = generateAlerts(docs, now);
    expect(alerts).toHaveLength(3); // 30, 60, 90
    expect(alerts.map((a) => a.alertType)).toEqual(
      expect.arrayContaining(["EXPIRATION_30", "EXPIRATION_60", "EXPIRATION_90"])
    );
  });

  it("skips already-existing alerts", () => {
    const docs = [
      { id: "doc-1", expirationDate: daysFromNow(25), existingAlertTypes: ["EXPIRATION_90", "EXPIRATION_60"] },
    ];
    const alerts = generateAlerts(docs, now);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].alertType).toBe("EXPIRATION_30");
  });

  it("skips documents without expiration dates", () => {
    const docs = [{ id: "doc-1", expirationDate: null, existingAlertTypes: [] }];
    expect(generateAlerts(docs, now)).toHaveLength(0);
  });

  it("creates EXPIRED alert for past dates", () => {
    const docs = [
      { id: "doc-1", expirationDate: daysFromNow(-5), existingAlertTypes: [] },
    ];
    const alerts = generateAlerts(docs, now);
    expect(alerts.map((a) => a.alertType)).toContain("EXPIRED");
  });

  it("returns empty for far-future documents", () => {
    const docs = [
      { id: "doc-1", expirationDate: daysFromNow(200), existingAlertTypes: [] },
    ];
    expect(generateAlerts(docs, now)).toHaveLength(0);
  });
});
