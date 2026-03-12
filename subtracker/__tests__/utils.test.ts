import { describe, it, expect } from "vitest";
import { complianceColor, complianceLabel, documentStatusColor, formatDate } from "@/lib/utils";

describe("complianceColor", () => {
  it("returns green colors for compliant status", () => {
    const result = complianceColor("compliant");
    expect(result.bg).toContain("emerald");
    expect(result.text).toContain("emerald");
    expect(result.dot).toContain("emerald");
  });

  it("returns amber colors for expiring_soon status", () => {
    const result = complianceColor("expiring_soon");
    expect(result.bg).toContain("amber");
  });

  it("returns red colors for non_compliant status", () => {
    const result = complianceColor("non_compliant");
    expect(result.bg).toContain("red");
  });

  it("returns slate colors for pending status", () => {
    const result = complianceColor("pending");
    expect(result.bg).toContain("slate");
  });
});

describe("complianceLabel", () => {
  it("returns human-readable labels", () => {
    expect(complianceLabel("compliant")).toBe("Compliant");
    expect(complianceLabel("expiring_soon")).toBe("Expiring Soon");
    expect(complianceLabel("non_compliant")).toBe("Non-Compliant");
    expect(complianceLabel("pending")).toBe("Pending");
  });
});

describe("documentStatusColor", () => {
  it("returns correct colors for all statuses", () => {
    expect(documentStatusColor("valid").bg).toContain("emerald");
    expect(documentStatusColor("expiring").bg).toContain("amber");
    expect(documentStatusColor("expired").bg).toContain("red");
    expect(documentStatusColor("pending_review").bg).toContain("blue");
    expect(documentStatusColor("missing").bg).toContain("slate");
  });
});

describe("formatDate", () => {
  it("formats ISO dates to readable format", () => {
    const result = formatDate("2026-01-15T10:00:00Z");
    expect(result).toContain("Jan");
    expect(result).toContain("15");
    expect(result).toContain("2026");
  });
});
