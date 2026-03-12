import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z.string().min(1).max(255),
});

export const createSubcontractorSchema = z.object({
  name: z.string().min(1).max(255),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(20).optional(),
  organizationId: z.string().min(1),
});

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/tiff",
] as const;

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
