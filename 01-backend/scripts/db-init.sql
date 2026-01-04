-- Use DELETE journal mode (simpler, no extra files)
PRAGMA journal_mode = DELETE;

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  color TEXT DEFAULT 'ffffff',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Create index for sorting by updated_at
CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON documents(updated_at DESC);
