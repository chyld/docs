import { z } from "zod";

// ============================================================
// Zod Schemas for Input Validation
// ============================================================

export const UuidSchema = z.string().uuid();

export const CreateDocumentSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  content: z.string().optional().default(""),
});

export const UpdateDocumentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().optional(),
});

export const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// Filename must not contain path traversal characters
export const FilenameSchema = z
  .string()
  .min(1)
  .max(255)
  .refine((name) => !name.includes("/") && !name.includes("\\") && !name.includes(".."), {
    message: "Invalid filename",
  });

// ============================================================
// TypeScript Types (derived from schemas)
// ============================================================

export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof UpdateDocumentSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;

// ============================================================
// Database Row Types
// ============================================================

export interface Document {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentWithContent extends Document {
  content: string;
  attachments: string[];
}

export interface AttachmentInfo {
  filename: string;
  size: number;
  type: string;
}

// ============================================================
// API Response Types
// ============================================================

export interface ErrorResponse {
  error: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}
