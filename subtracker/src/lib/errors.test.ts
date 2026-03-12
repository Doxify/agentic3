import { describe, it, expect } from "vitest";
import {
  SubTrackerError,
  NotFoundError,
  ValidationError,
  ConflictError,
  formatErrorResponse,
} from "./errors";

describe("error classes", () => {
  it("SubTrackerError has code and statusCode", () => {
    const err = new SubTrackerError("test", "TEST_CODE", 422);
    expect(err.message).toBe("test");
    expect(err.code).toBe("TEST_CODE");
    expect(err.statusCode).toBe(422);
    expect(err.name).toBe("SubTrackerError");
  });

  it("NotFoundError defaults to 404", () => {
    const err = new NotFoundError("Document", "abc-123");
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.message).toContain("abc-123");
  });

  it("ValidationError defaults to 400", () => {
    const err = new ValidationError("bad input");
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("VALIDATION_ERROR");
  });

  it("ConflictError defaults to 409", () => {
    const err = new ConflictError("already exists");
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe("CONFLICT");
  });
});

describe("formatErrorResponse", () => {
  it("formats SubTrackerError correctly", () => {
    const result = formatErrorResponse(new NotFoundError("Item", "x"));
    expect(result.status).toBe(404);
    expect(result.error.code).toBe("NOT_FOUND");
  });

  it("formats unknown errors as 500", () => {
    const result = formatErrorResponse(new Error("oops"));
    expect(result.status).toBe(500);
    expect(result.error.code).toBe("INTERNAL_ERROR");
  });

  it("handles non-Error values", () => {
    const result = formatErrorResponse("string error");
    expect(result.status).toBe(500);
  });
});
