import { mkdir, readdir, writeFile } from "fs/promises";
import { join, resolve, sep } from "path";
import { randomUUID } from "crypto";
import { ok, err, type Result } from "./result";
import type { AttachmentInfo } from "./types";

const DOCS_DIR = resolve("docs");

const isPathSafe = (base: string, path: string) =>
  resolve(base, path).startsWith(resolve(base) + sep);

export async function createDocDir(id: string): Promise<Result<void>> {
  await mkdir(join(DOCS_DIR, id, "attachments"), { recursive: true });
  return ok(undefined);
}

export async function readContent(id: string): Promise<Result<string>> {
  const file = Bun.file(join(DOCS_DIR, id, "document.md"));
  return ok((await file.exists()) ? await file.text() : "");
}

export async function writeContent(id: string, content: string): Promise<Result<void>> {
  await writeFile(join(DOCS_DIR, id, "document.md"), content);
  return ok(undefined);
}

export async function listAttachments(id: string): Promise<Result<string[]>> {
  try {
    return ok(await readdir(join(DOCS_DIR, id, "attachments")));
  } catch {
    return ok([]);
  }
}

export async function saveAttachment(id: string, file: File): Promise<Result<AttachmentInfo>> {
  const ext = file.name.includes(".") ? "." + file.name.split(".").pop() : "";
  const filename = randomUUID() + ext;
  const dir = join(DOCS_DIR, id, "attachments");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), Buffer.from(await file.arrayBuffer()));
  return ok({ filename, size: file.size, type: file.type });
}

export function getAttachmentFile(id: string, filename: string): Result<ReturnType<typeof Bun.file>> {
  const dir = join(DOCS_DIR, id, "attachments");
  if (!isPathSafe(dir, filename)) return err("Invalid path", 400);
  return ok(Bun.file(join(dir, filename)));
}
