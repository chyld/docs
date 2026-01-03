import type { BunRequest } from "bun";
import { randomUUID } from "crypto";
import { mkdir, readdir, writeFile } from "fs/promises";
import { join, resolve, sep } from "path";

import {
  CreateDocumentSchema,
  FilenameSchema,
  PaginationSchema,
  UpdateDocumentSchema,
  UuidSchema,
  type AttachmentInfo,
  type DocumentWithContent,
  type ErrorResponse,
} from "./types";
import { createDoc, getAllDocs, getDocById, updateDocTimestamp, updateDocTitle } from "./db";

const DOCS_DIR = resolve("docs");

// ============================================================
// Security Utilities
// ============================================================

function isPathSafe(basePath: string, userPath: string): boolean {
  const normalizedBase = resolve(basePath);
  const normalizedFull = resolve(basePath, userPath);
  return normalizedFull.startsWith(normalizedBase + sep);
}

function errorResponse(message: string, status: number): Response {
  return Response.json({ error: message } satisfies ErrorResponse, { status });
}

// ============================================================
// Route Handlers
// ============================================================

export function getAllDocuments(req: Request): Response {
  try {
    const url = new URL(req.url);
    const params = {
      limit: url.searchParams.get("limit") ?? undefined,
      offset: url.searchParams.get("offset") ?? undefined,
    };

    const parsed = PaginationSchema.safeParse(params);
    if (!parsed.success) {
      return errorResponse("Invalid pagination parameters", 400);
    }

    const { limit, offset } = parsed.data;
    const { docs, total } = getAllDocs(limit, offset);

    return Response.json({
      data: docs,
      pagination: { limit, offset, total },
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return errorResponse("Failed to fetch documents", 500);
  }
}

export async function getDocument(req: BunRequest<"/api/documents/:id">): Promise<Response> {
  try {
    const { id } = req.params;

    const uuidResult = UuidSchema.safeParse(id);
    if (!uuidResult.success) {
      return errorResponse("Invalid document ID", 400);
    }

    const doc = getDocById(id);
    if (!doc) {
      return errorResponse("Document not found", 404);
    }

    const contentPath = join(DOCS_DIR, id, "document.md");
    const contentFile = Bun.file(contentPath);

    let content = "";
    if (await contentFile.exists()) {
      content = await contentFile.text();
    }

    let attachments: string[] = [];
    try {
      const attachmentsDir = join(DOCS_DIR, id, "attachments");
      attachments = await readdir(attachmentsDir);
    } catch {
      // No attachments directory - that's fine
    }

    const response: DocumentWithContent = {
      ...doc,
      content,
      attachments,
    };

    return Response.json(response);
  } catch (error) {
    console.error("Error fetching document:", error);
    return errorResponse("Failed to fetch document", 500);
  }
}

export async function createDocument(req: Request): Promise<Response> {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    const parsed = CreateDocumentSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid input";
      return errorResponse(message, 400);
    }

    const { title, content } = parsed.data;
    const id = randomUUID();
    const docDir = join(DOCS_DIR, id);
    const attachmentsDir = join(docDir, "attachments");

    // Create document directory and attachments subdirectory
    await mkdir(attachmentsDir, { recursive: true });

    // Write markdown content to file
    await writeFile(join(docDir, "document.md"), content);

    // Insert metadata into database
    const doc = createDoc(id, title);

    return Response.json(doc, { status: 201 });
  } catch (error) {
    console.error("Error creating document:", error);
    return errorResponse("Failed to create document", 500);
  }
}

export async function updateDocument(req: BunRequest<"/api/documents/:id">): Promise<Response> {
  try {
    const { id } = req.params;

    const uuidResult = UuidSchema.safeParse(id);
    if (!uuidResult.success) {
      return errorResponse("Invalid document ID", 400);
    }

    const doc = getDocById(id);
    if (!doc) {
      return errorResponse("Document not found", 404);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    const parsed = UpdateDocumentSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid input";
      return errorResponse(message, 400);
    }

    const { title, content } = parsed.data;

    if (title !== undefined) {
      updateDocTitle(id, title);
    }

    if (content !== undefined) {
      await writeFile(join(DOCS_DIR, id, "document.md"), content);
      updateDocTimestamp(id);
    }

    const updatedDoc = getDocById(id);
    return Response.json(updatedDoc);
  } catch (error) {
    console.error("Error updating document:", error);
    return errorResponse("Failed to update document", 500);
  }
}

export async function uploadAttachment(req: BunRequest<"/api/documents/:id/attachments">): Promise<Response> {
  try {
    const { id } = req.params;

    const uuidResult = UuidSchema.safeParse(id);
    if (!uuidResult.success) {
      return errorResponse("Invalid document ID", 400);
    }

    const doc = getDocById(id);
    if (!doc) {
      return errorResponse("Document not found", 404);
    }

    let formData;
    try {
      formData = await req.formData();
    } catch {
      return errorResponse("Invalid form data", 400);
    }

    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return errorResponse("No file provided", 400);
    }

    const originalName = file.name;
    if (!originalName) {
      return errorResponse("File must have a name", 400);
    }

    // Validate original filename doesn't contain path traversal
    const filenameResult = FilenameSchema.safeParse(originalName);
    if (!filenameResult.success) {
      return errorResponse("Invalid filename", 400);
    }

    // Generate safe UUID-based filename with original extension
    const ext = originalName.includes(".") ? "." + originalName.split(".").pop() : "";
    const filename = randomUUID() + ext;

    const attachmentsDir = join(DOCS_DIR, id, "attachments");
    await mkdir(attachmentsDir, { recursive: true });

    const filePath = join(attachmentsDir, filename);
    const buffer = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(buffer));

    const response: AttachmentInfo = {
      filename,
      size: file.size,
      type: file.type,
    };

    return Response.json(response, { status: 201 });
  } catch (error) {
    console.error("Error uploading attachment:", error);
    return errorResponse("Failed to upload attachment", 500);
  }
}

export async function getAttachment(req: BunRequest<"/api/documents/:id/attachments/:filename">): Promise<Response> {
  try {
    const { id, filename } = req.params;

    const uuidResult = UuidSchema.safeParse(id);
    if (!uuidResult.success) {
      return errorResponse("Invalid document ID", 400);
    }

    const filenameResult = FilenameSchema.safeParse(filename);
    if (!filenameResult.success) {
      return errorResponse("Invalid filename", 400);
    }

    const doc = getDocById(id);
    if (!doc) {
      return errorResponse("Document not found", 404);
    }

    // Security: Verify path doesn't escape attachments directory
    const attachmentsDir = join(DOCS_DIR, id, "attachments");
    if (!isPathSafe(attachmentsDir, filename)) {
      return errorResponse("Invalid path", 400);
    }

    const filePath = join(attachmentsDir, filename);
    const file = Bun.file(filePath);

    if (!(await file.exists())) {
      return errorResponse("Attachment not found", 404);
    }

    return new Response(file);
  } catch (error) {
    console.error("Error fetching attachment:", error);
    return errorResponse("Failed to fetch attachment", 500);
  }
}
