import { Database } from "bun:sqlite";
import type { Document } from "./types";

const DB_PATH = "db/docs.db";

let db: Database | null = null;

export function getDb(): Database {
  if (!db) {
    db = new Database(DB_PATH, { strict: true });
  }
  return db;
}

// ============================================================
// Query Functions
// ============================================================

export function getAllDocs(limit: number, offset: number): { docs: Document[]; total: number } {
  const database = getDb();

  const docs = database
    .query<Document, [number, number]>(
      "SELECT id, title, created_at, updated_at FROM documents ORDER BY updated_at DESC LIMIT ? OFFSET ?"
    )
    .all(limit, offset);

  const countResult = database.query<{ count: number }, []>("SELECT COUNT(*) as count FROM documents").get();
  const total = countResult?.count ?? 0;

  return { docs, total };
}

export function getDocById(id: string): Document | null {
  const database = getDb();

  const doc = database
    .query<Document, [string]>("SELECT id, title, created_at, updated_at FROM documents WHERE id = ?")
    .get(id);

  return doc ?? null;
}

export function createDoc(id: string, title: string): Document {
  const database = getDb();

  database
    .query("INSERT INTO documents (id, title, created_at, updated_at) VALUES (?, ?, datetime('now'), datetime('now'))")
    .run(id, title);

  const doc = getDocById(id);
  if (!doc) {
    throw new Error("Failed to create document");
  }

  return doc;
}

export function updateDocTitle(id: string, title: string): void {
  const database = getDb();

  database.query("UPDATE documents SET title = ?, updated_at = datetime('now') WHERE id = ?").run(title, id);
}

export function updateDocTimestamp(id: string): void {
  const database = getDb();

  database.query("UPDATE documents SET updated_at = datetime('now') WHERE id = ?").run(id);
}
