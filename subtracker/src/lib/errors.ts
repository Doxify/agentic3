/** Base error for SubTracker domain errors */
export class SubTrackerError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = "SubTrackerError";
  }
}

export class NotFoundError extends SubTrackerError {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends SubTrackerError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
  }
}

export class ConflictError extends SubTrackerError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
    this.name = "ConflictError";
  }
}

/** Format error for API response */
export const formatErrorResponse = (error: unknown) => {
  if (error instanceof SubTrackerError) {
    return {
      error: { code: error.code, message: error.message },
      status: error.statusCode,
    };
  }

  console.error("Unhandled error:", error);
  return {
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
    status: 500,
  };
};
