-- Use DELETE journal mode (simpler, no extra files)
PRAGMA journal_mode = DELETE;

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  color TEXT DEFAULT 'ffffff',
  pinned INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Create index for sorting by pinned status and updated_at
CREATE INDEX IF NOT EXISTS idx_documents_pinned_updated ON documents(pinned DESC, updated_at DESC);
