import { describe, it, expect } from "vitest";
import {
  validateId,
  validateDate,
  validateDocumentType,
  validateDocumentStatus,
  validateDocumentDates,
} from "./validation";

describe("validateId", () => {
  it("returns trimmed string for valid input", () => {
    expect(validateId("  abc-123  ", "testId")).toBe("abc-123");
  });

  it("throws for empty string", () => {
    expect(() => validateId("", "testId")).toThrow("testId is required");
  });

  it("throws for non-string", () => {
    expect(() => validateId(123, "testId")).toThrow("testId is required");
  });
});

describe("validateDate", () => {
  it("returns Date for valid ISO string", () => {
    const date = validateDate("2026-06-15T00:00:00Z", "testDate");
    expect(date).toBeInstanceOf(Date);
    expect(date.getFullYear()).toBe(2026);
  });

  it("throws for invalid date string", () => {
    expect(() => validateDate("not-a-date", "testDate")).toThrow("not a valid date");
  });

  it("throws for non-string", () => {
    expect(() => validateDate(12345, "testDate")).toThrow("must be an ISO date string");
  });
});

describe("validateDocumentType", () => {
  it("accepts valid types", () => {
    expect(validateDocumentType("COI")).toBe("COI");
    expect(validateDocumentType("LICENSE")).toBe("LICENSE");
    expect(validateDocumentType("SAFETY_CERT")).toBe("SAFETY_CERT");
  });

  it("rejects invalid types", () => {
    expect(() => validateDocumentType("INVOICE")).toThrow("type must be one of");
  });
});

describe("validateDocumentStatus", () => {
  it("accepts valid statuses", () => {
    expect(validateDocumentStatus("pending")).toBe("pending");
    expect(validateDocumentStatus("verified")).toBe("verified");
    expect(validateDocumentStatus("expired")).toBe("expired");
    expect(validateDocumentStatus("rejected")).toBe("rejected");
  });

  it("rejects invalid statuses", () => {
    expect(() => validateDocumentStatus("active")).toThrow("status must be one of");
  });
});

describe("validateDocumentDates", () => {
  it("passes when expiration is after issue date", () => {
    expect(() =>
      validateDocumentDates(new Date("2026-01-01"), new Date("2026-12-31"))
    ).not.toThrow();
  });

  it("throws when expiration equals issue date", () => {
    const d = new Date("2026-06-01");
    expect(() => validateDocumentDates(d, d)).toThrow("expirationDate must be after issueDate");
  });

  it("throws when expiration is before issue date", () => {
    expect(() =>
      validateDocumentDates(new Date("2026-12-31"), new Date("2026-01-01"))
    ).toThrow("expirationDate must be after issueDate");
  });

  it("passes when either date is null", () => {
    expect(() => validateDocumentDates(null, new Date("2026-12-31"))).not.toThrow();
    expect(() => validateDocumentDates(new Date("2026-01-01"), null)).not.toThrow();
    expect(() => validateDocumentDates(null, null)).not.toThrow();
  });
});
