import { Database } from "bun:sqlite";
import { ok, err, type Result } from "./result";
import type { Document } from "./types";

const db = new Database("db/docs.db", { strict: true });

export function getAllDocs(limit: number, offset: number): Result<{ docs: Document[]; total: number }> {
  const docs = db
    .query<Document, [number, number]>(
      "SELECT id, title, color, created_at, updated_at FROM documents ORDER BY updated_at DESC LIMIT ? OFFSET ?"
    )
    .all(limit, offset);
  const total = db.query<{ count: number }, []>("SELECT COUNT(*) as count FROM documents").get()?.count ?? 0;
  return ok({ docs, total });
}

export function getDocById(id: string): Result<Document> {
  const doc = db
    .query<Document, [string]>("SELECT id, title, color, created_at, updated_at FROM documents WHERE id = ?")
    .get(id);
  return doc ? ok(doc) : err("Document not found", 404);
}

export function createDoc(id: string, title: string, color?: string): Result<Document> {
  const query = color
    ? "INSERT INTO documents (id, title, color, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))"
    : "INSERT INTO documents (id, title, created_at, updated_at) VALUES (?, ?, datetime('now'), datetime('now'))";
  db.query(query).run(...(color ? [id, title, color] : [id, title]));
  return getDocById(id);
}

export function updateDoc(id: string, updates: { title?: string; color?: string; touch?: boolean }): Result<Document> {
  if (updates.title !== undefined) {
    db.query("UPDATE documents SET title = ?, updated_at = datetime('now') WHERE id = ?").run(updates.title, id);
  }
  if (updates.color !== undefined) {
    db.query("UPDATE documents SET color = ?, updated_at = datetime('now') WHERE id = ?").run(updates.color, id);
  }
  if (updates.touch) {
    db.query("UPDATE documents SET updated_at = datetime('now') WHERE id = ?").run(id);
  }
  return getDocById(id);
}
