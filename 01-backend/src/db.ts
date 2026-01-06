import { Database } from "bun:sqlite";
import { ok, err, type Result } from "./result";
import type { Document } from "./types";

const db = new Database("db/docs.db", { strict: true });

export function getAllDocs(limit: number, offset: number): Result<{ docs: Document[]; total: number }> {
  const docs = db
    .query<Document, [number, number]>(
      "SELECT id, title, color, pinned, created_at, updated_at FROM documents ORDER BY pinned DESC, updated_at DESC LIMIT ? OFFSET ?"
    )
    .all(limit, offset);
  const total = db.query<{ count: number }, []>("SELECT COUNT(*) as count FROM documents").get()?.count ?? 0;
  return ok({ docs, total });
}

export function getDocById(id: string): Result<Document> {
  const doc = db
    .query<Document, [string]>("SELECT id, title, color, pinned, created_at, updated_at FROM documents WHERE id = ?")
    .get(id);
  return doc ? ok(doc) : err("Document not found", 404);
}

export function createDoc(id: string, title: string, color?: string, pinned?: boolean): Result<Document> {
  const pinnedVal = pinned ? 1 : 0;
  const query = color
    ? "INSERT INTO documents (id, title, color, pinned, created_at, updated_at) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))"
    : "INSERT INTO documents (id, title, pinned, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))";
  db.query(query).run(...(color ? [id, title, color, pinnedVal] : [id, title, pinnedVal]));
  return getDocById(id);
}

export function updateDoc(id: string, updates: { title?: string; color?: string; pinned?: boolean; touch?: boolean }): Result<Document> {
  if (updates.title !== undefined) {
    db.query("UPDATE documents SET title = ?, updated_at = datetime('now') WHERE id = ?").run(updates.title, id);
  }
  if (updates.color !== undefined) {
    db.query("UPDATE documents SET color = ?, updated_at = datetime('now') WHERE id = ?").run(updates.color, id);
  }
  if (updates.pinned !== undefined) {
    db.query("UPDATE documents SET pinned = ? WHERE id = ?").run(updates.pinned ? 1 : 0, id);
  }
  if (updates.touch) {
    db.query("UPDATE documents SET updated_at = datetime('now') WHERE id = ?").run(id);
  }
  return getDocById(id);
}

export function getDocNeighbors(id: string): Result<{ prev_id: string | null; next_id: string | null }> {
  const doc = db
    .query<{ pinned: number; updated_at: string }, [string]>("SELECT pinned, updated_at FROM documents WHERE id = ?")
    .get(id);
  if (!doc) return err("Document not found", 404);

  // List is sorted by: pinned DESC, updated_at DESC, id DESC
  // Previous = document that appears before this one in the list (higher in sort order)
  const prev = db
    .query<{ id: string }, [number, number, string, number, string, string]>(
      `SELECT id FROM documents 
       WHERE (pinned > ?1) 
          OR (pinned = ?2 AND updated_at > ?3) 
          OR (pinned = ?4 AND updated_at = ?5 AND id > ?6)
       ORDER BY pinned ASC, updated_at ASC, id ASC 
       LIMIT 1`
    )
    .get(doc.pinned, doc.pinned, doc.updated_at, doc.pinned, doc.updated_at, id);

  // Next = document that appears after this one in the list (lower in sort order)
  const next = db
    .query<{ id: string }, [number, number, string, number, string, string]>(
      `SELECT id FROM documents 
       WHERE (pinned < ?1) 
          OR (pinned = ?2 AND updated_at < ?3) 
          OR (pinned = ?4 AND updated_at = ?5 AND id < ?6)
       ORDER BY pinned DESC, updated_at DESC, id DESC 
       LIMIT 1`
    )
    .get(doc.pinned, doc.pinned, doc.updated_at, doc.pinned, doc.updated_at, id);

  return ok({ prev_id: prev?.id ?? null, next_id: next?.id ?? null });
}

export function deleteDoc(id: string): Result<void> {
  const doc = db
    .query<{ created_at: string; updated_at: string }, [string]>(
      "SELECT created_at, updated_at FROM documents WHERE id = ?"
    )
    .get(id);

  if (!doc) return err("Document not found", 404);
  if (doc.created_at !== doc.updated_at) return err("Cannot delete edited document", 409);

  db.query("DELETE FROM documents WHERE id = ?").run(id);
  return ok(undefined);
}
