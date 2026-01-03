-- Enable WAL mode for better concurrent performance
PRAGMA journal_mode = WAL;

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Create index for sorting by updated_at
CREATE INDEX IF NOT EXISTS idx_documents_updated_at
ON documents(updated_at DESC);
