import { z } from "zod";

// Schemas
export const UuidSchema = z.string().uuid();
export const ColorSchema = z.string().regex(/^[0-9a-fA-F]{6}$/, "Invalid hex color");
export const FilenameSchema = z.string().min(1).max(255).refine(
  (n) => !n.includes("/") && !n.includes("\\") && !n.includes(".."),
  { message: "Invalid filename" }
);

export const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const CreateDocumentSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  content: z.string().default(""),
  color: ColorSchema.optional(),
  pinned: z.boolean().optional(),
});

export const UpdateDocumentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().optional(),
  color: ColorSchema.optional(),
  pinned: z.boolean().optional(),
});

// Types
export type Document = {
  id: string;
  title: string;
  color: string;
  pinned: number;
  created_at: string;
  updated_at: string;
};

export type DocumentWithContent = Document & {
  content: string;
  attachments: string[];
};

export type AttachmentInfo = {
  filename: string;
  size: number;
  type: string;
};

export type Pagination = { limit: number; offset: number; total: number };
