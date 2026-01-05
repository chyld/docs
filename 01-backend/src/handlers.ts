import type { BunRequest } from "bun";
import { randomUUID } from "crypto";
import { err, toResponse, toResponseCreated } from "./result";
import { createDoc, getAllDocs, getDocById, getDocNeighbors, updateDoc } from "./db";
import { createDocDir, getAttachmentFile, listAttachments, readContent, saveAttachment, writeContent } from "./storage";
import { CreateDocumentSchema, FilenameSchema, PaginationSchema, UpdateDocumentSchema, UuidSchema } from "./types";

const parseJson = async (req: Request) => {
  try {
    return { ok: true as const, data: await req.json() };
  } catch {
    return err("Invalid JSON body", 400);
  }
};

const parseFormData = async (req: Request) => {
  try {
    return { ok: true as const, data: await req.formData() };
  } catch {
    return err("Invalid form data", 400);
  }
};

export function getAllDocuments(req: Request): Response {
  const url = new URL(req.url);
  const params = { limit: url.searchParams.get("limit") ?? undefined, offset: url.searchParams.get("offset") ?? undefined };
  const parsed = PaginationSchema.safeParse(params);
  if (!parsed.success) return toResponse(err("Invalid pagination parameters", 400));

  const result = getAllDocs(parsed.data.limit, parsed.data.offset);
  if (!result.ok) return toResponse(result);
  return Response.json({ data: result.data.docs, pagination: { ...parsed.data, total: result.data.total } });
}

export async function getDocument(req: BunRequest<"/api/documents/:id">): Promise<Response> {
  const id = UuidSchema.safeParse(req.params.id);
  if (!id.success) return toResponse(err("Invalid document ID", 400));

  const doc = getDocById(id.data);
  if (!doc.ok) return toResponse(doc);

  const content = await readContent(id.data);
  const attachments = await listAttachments(id.data);
  if (!content.ok || !attachments.ok) return toResponse(err("Failed to read document", 500));

  const neighbors = getDocNeighbors(id.data);
  const { prev_id, next_id } = neighbors.ok ? neighbors.data : { prev_id: null, next_id: null };

  return Response.json({ ...doc.data, content: content.data, attachments: attachments.data, prev_id, next_id });
}

export async function createDocument(req: Request): Promise<Response> {
  const body = await parseJson(req);
  if (!body.ok) return toResponse(body);

  const parsed = CreateDocumentSchema.safeParse(body.data);
  if (!parsed.success) return toResponse(err(parsed.error.issues[0]?.message ?? "Invalid input", 400));

  const id = randomUUID();
  await createDocDir(id);
  await writeContent(id, parsed.data.content);
  const doc = createDoc(id, parsed.data.title, parsed.data.color);

  return toResponseCreated(doc);
}

export async function updateDocument(req: BunRequest<"/api/documents/:id">): Promise<Response> {
  const id = UuidSchema.safeParse(req.params.id);
  if (!id.success) return toResponse(err("Invalid document ID", 400));

  const exists = getDocById(id.data);
  if (!exists.ok) return toResponse(exists);

  const body = await parseJson(req);
  if (!body.ok) return toResponse(body);

  const parsed = UpdateDocumentSchema.safeParse(body.data);
  if (!parsed.success) return toResponse(err(parsed.error.issues[0]?.message ?? "Invalid input", 400));

  if (parsed.data.content !== undefined) {
    await writeContent(id.data, parsed.data.content);
  }

  const doc = updateDoc(id.data, {
    title: parsed.data.title,
    color: parsed.data.color,
    touch: parsed.data.content !== undefined,
  });

  return toResponse(doc);
}

export async function uploadAttachment(req: BunRequest<"/api/documents/:id/attachments">): Promise<Response> {
  const id = UuidSchema.safeParse(req.params.id);
  if (!id.success) return toResponse(err("Invalid document ID", 400));

  const exists = getDocById(id.data);
  if (!exists.ok) return toResponse(exists);

  const formData = await parseFormData(req);
  if (!formData.ok) return toResponse(formData);

  const file = formData.data.get("file");
  if (!file || !(file instanceof File)) return toResponse(err("No file provided", 400));
  if (!file.name) return toResponse(err("File must have a name", 400));

  const filenameValid = FilenameSchema.safeParse(file.name);
  if (!filenameValid.success) return toResponse(err("Invalid filename", 400));

  const result = await saveAttachment(id.data, file);
  return toResponseCreated(result);
}

export async function getAttachment(req: BunRequest<"/api/documents/:id/attachments/:filename">): Promise<Response> {
  const id = UuidSchema.safeParse(req.params.id);
  if (!id.success) return toResponse(err("Invalid document ID", 400));

  const filenameValid = FilenameSchema.safeParse(req.params.filename);
  if (!filenameValid.success) return toResponse(err("Invalid filename", 400));

  const exists = getDocById(id.data);
  if (!exists.ok) return toResponse(exists);

  const file = getAttachmentFile(id.data, req.params.filename);
  if (!file.ok) return toResponse(file);

  if (!(await file.data.exists())) return toResponse(err("Attachment not found", 404));
  return new Response(file.data);
}
