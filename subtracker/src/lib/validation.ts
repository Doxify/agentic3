import { ValidationError } from "./errors";

/** Validate that a string is a non-empty ID */
export const validateId = (value: unknown, field: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(`${field} is required and must be a non-empty string`);
  }
  return value.trim();
};

/** Validate that a value is a valid ISO date string */
export const validateDate = (value: unknown, field: string): Date => {
  if (typeof value !== "string") {
    throw new ValidationError(`${field} must be an ISO date string`);
  }
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new ValidationError(`${field} is not a valid date`);
  }
  return date;
};

/** Validate document type */
export const validateDocumentType = (value: unknown): string => {
  const valid = ["COI", "LICENSE", "SAFETY_CERT"];
  if (typeof value !== "string" || !valid.includes(value)) {
    throw new ValidationError(`type must be one of: ${valid.join(", ")}`);
  }
  return value;
};

/** Validate document status */
export const validateDocumentStatus = (value: unknown): string => {
  const valid = ["pending", "verified", "expired", "rejected"];
  if (typeof value !== "string" || !valid.includes(value)) {
    throw new ValidationError(`status must be one of: ${valid.join(", ")}`);
  }
  return value;
};

/** Data consistency check: verify document dates are logical */
export const validateDocumentDates = (
  issueDate: Date | null,
  expirationDate: Date | null
): void => {
  if (issueDate && expirationDate && expirationDate <= issueDate) {
    throw new ValidationError("expirationDate must be after issueDate");
  }
};
