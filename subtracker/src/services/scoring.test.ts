import { describe, it, expect } from "vitest";
import {
  daysBetween,
  scoreDocument,
  scoreCategoryDocuments,
  deriveStatus,
  buildBreakdown,
  calculateOverallScore,
  findExpiringDocuments,
  buildComplianceOutput,
} from "./scoring";

const now = new Date("2026-03-11T00:00:00Z");
const daysFromNow = (days: number) =>
  new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

describe("daysBetween", () => {
  it("returns positive for future dates", () => {
    expect(daysBetween(now, daysFromNow(30))).toBe(30);
  });

  it("returns negative for past dates", () => {
    expect(daysBetween(now, daysFromNow(-10))).toBe(-10);
  });

  it("returns 0 for same date", () => {
    expect(daysBetween(now, now)).toBe(0);
  });
});

describe("scoreDocument", () => {
  it("returns 0 for expired documents", () => {
    expect(scoreDocument("expired", null, now)).toBe(0);
  });

  it("returns 0 for rejected documents", () => {
    expect(scoreDocument("rejected", null, now)).toBe(0);
  });

  it("returns 30 for pending documents", () => {
    expect(scoreDocument("pending", null, now)).toBe(30);
  });

  it("returns 100 for verified docs with no expiration", () => {
    expect(scoreDocument("verified", null, now)).toBe(100);
  });

  it("returns 100 for verified docs expiring > 90 days", () => {
    expect(scoreDocument("verified", daysFromNow(120), now)).toBe(100);
  });

  it("returns 80 for verified docs expiring in 61-90 days", () => {
    expect(scoreDocument("verified", daysFromNow(75), now)).toBe(80);
  });

  it("returns 65 for verified docs expiring in 31-60 days", () => {
    expect(scoreDocument("verified", daysFromNow(45), now)).toBe(65);
  });

  it("returns 40 for verified docs expiring in 1-30 days", () => {
    expect(scoreDocument("verified", daysFromNow(15), now)).toBe(40);
  });

  it("returns 0 for verified docs already expired", () => {
    expect(scoreDocument("verified", daysFromNow(-5), now)).toBe(0);
  });
});

describe("scoreCategoryDocuments", () => {
  it("returns 0 for empty array", () => {
    expect(scoreCategoryDocuments([], now)).toBe(0);
  });

  it("averages scores across documents", () => {
    const docs = [
      { status: "verified", expirationDate: daysFromNow(120) }, // 100
      { status: "verified", expirationDate: daysFromNow(15) },  // 40
    ];
    expect(scoreCategoryDocuments(docs, now)).toBe(70); // (100+40)/2 rounded
  });
});

describe("deriveStatus", () => {
  it("returns green for score >= 80", () => {
    expect(deriveStatus(80)).toBe("green");
    expect(deriveStatus(100)).toBe("green");
  });

  it("returns yellow for score 50-79", () => {
    expect(deriveStatus(50)).toBe("yellow");
    expect(deriveStatus(79)).toBe("yellow");
  });

  it("returns red for score < 50", () => {
    expect(deriveStatus(49)).toBe("red");
    expect(deriveStatus(0)).toBe("red");
  });
});

describe("buildBreakdown", () => {
  it("scores each category independently", () => {
    const docs = [
      { type: "COI", status: "verified", expirationDate: daysFromNow(120) },
      { type: "LICENSE", status: "expired", expirationDate: daysFromNow(-5) },
      { type: "SAFETY_CERT", status: "pending", expirationDate: null },
    ];
    const breakdown = buildBreakdown(docs, now);
    expect(breakdown.coi).toBe(100);
    expect(breakdown.license).toBe(0);
    expect(breakdown.safety).toBe(30);
  });

  it("returns 0 for missing categories", () => {
    const breakdown = buildBreakdown([], now);
    expect(breakdown.coi).toBe(0);
    expect(breakdown.license).toBe(0);
    expect(breakdown.safety).toBe(0);
  });
});

describe("calculateOverallScore", () => {
  it("applies correct weights (COI=0.5, LICENSE=0.3, SAFETY=0.2)", () => {
    const result = calculateOverallScore({ coi: 100, license: 100, safety: 100 });
    expect(result).toBe(100);
  });

  it("weights categories properly", () => {
    const result = calculateOverallScore({ coi: 100, license: 0, safety: 0 });
    expect(result).toBe(50); // 100*0.5 + 0*0.3 + 0*0.2 = 50
  });
});

describe("findExpiringDocuments", () => {
  it("returns documents within 90-day window", () => {
    const docs = [
      { id: "1", type: "COI", fileName: "coi.pdf", expirationDate: daysFromNow(30) },
      { id: "2", type: "LICENSE", fileName: "lic.pdf", expirationDate: daysFromNow(120) },
      { id: "3", type: "COI", fileName: "coi2.pdf", expirationDate: daysFromNow(60) },
    ];
    const expiring = findExpiringDocuments(docs, now);
    expect(expiring).toHaveLength(2);
    expect(expiring[0].documentId).toBe("1"); // 30 days - sorted first
    expect(expiring[1].documentId).toBe("3"); // 60 days
  });

  it("excludes documents without expiration dates", () => {
    const docs = [{ id: "1", type: "COI", fileName: "coi.pdf", expirationDate: null }];
    expect(findExpiringDocuments(docs, now)).toHaveLength(0);
  });

  it("excludes already-expired documents", () => {
    const docs = [
      { id: "1", type: "COI", fileName: "coi.pdf", expirationDate: daysFromNow(-5) },
    ];
    expect(findExpiringDocuments(docs, now)).toHaveLength(0);
  });
});

describe("buildComplianceOutput", () => {
  it("assembles complete compliance output", () => {
    const docs = [
      { id: "1", type: "COI", fileName: "coi.pdf", status: "verified", expirationDate: daysFromNow(120) },
      { id: "2", type: "LICENSE", fileName: "lic.pdf", status: "verified", expirationDate: daysFromNow(45) },
      { id: "3", type: "SAFETY_CERT", fileName: "safe.pdf", status: "verified", expirationDate: daysFromNow(200) },
    ];

    const output = buildComplianceOutput("sub-1", "Acme Subs", docs, now);

    expect(output.subcontractorId).toBe("sub-1");
    expect(output.subcontractorName).toBe("Acme Subs");
    expect(output.breakdown.coi).toBe(100);
    expect(output.breakdown.license).toBe(65);
    expect(output.breakdown.safety).toBe(100);
    expect(output.overallScore).toBe(90); // 100*0.5 + 65*0.3 + 100*0.2 = 50+19.5+20 = 89.5 -> 90
    expect(output.status).toBe("green");
    expect(output.expiringDocuments).toHaveLength(1); // only license at 45 days
  });
});
