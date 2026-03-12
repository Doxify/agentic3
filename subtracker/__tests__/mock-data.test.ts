import { describe, it, expect } from "vitest";
import { mockSubcontractors, getMockComplianceSummary } from "@/lib/mock-data";

describe("mockSubcontractors", () => {
  it("contains expected number of subcontractors", () => {
    expect(mockSubcontractors.length).toBe(5);
  });

  it("has valid structure for each subcontractor", () => {
    for (const sub of mockSubcontractors) {
      expect(sub.id).toBeTruthy();
      expect(sub.name).toBeTruthy();
      expect(sub.email).toContain("@");
      expect(sub.company).toBeTruthy();
      expect(["compliant", "expiring_soon", "non_compliant", "pending"]).toContain(sub.status);
      expect(sub.invitedAt).toBeTruthy();
      expect(Array.isArray(sub.documents)).toBe(true);
    }
  });
});

describe("getMockComplianceSummary", () => {
  it("returns correct totals", () => {
    const summary = getMockComplianceSummary();
    expect(summary.total).toBe(5);
    expect(
      summary.compliant + summary.expiringSoon + summary.nonCompliant + summary.pending,
    ).toBe(summary.total);
  });

  it("counts each status correctly", () => {
    const summary = getMockComplianceSummary();
    expect(summary.compliant).toBe(2);
    expect(summary.expiringSoon).toBe(1);
    expect(summary.nonCompliant).toBe(1);
    expect(summary.pending).toBe(1);
  });
});
