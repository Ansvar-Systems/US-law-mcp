-- US Law MCP — Database Schema
-- Supports multi-jurisdiction (US-FED, US-CA, US-NY, etc.) with cross-state comparison

CREATE TABLE IF NOT EXISTS legal_documents (
  id INTEGER PRIMARY KEY,
  jurisdiction TEXT NOT NULL,
  title TEXT NOT NULL,
  identifier TEXT,
  short_name TEXT,
  document_type TEXT DEFAULT 'statute',
  status TEXT DEFAULT 'in_force',
  publication_date TEXT,
  effective_date TEXT,
  last_amended TEXT,
  source_url TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS legal_provisions (
  id INTEGER PRIMARY KEY,
  document_id INTEGER REFERENCES legal_documents(id),
  jurisdiction TEXT NOT NULL,
  section_number TEXT,
  title TEXT,
  text TEXT NOT NULL,
  order_index INTEGER
);

CREATE VIRTUAL TABLE IF NOT EXISTS provisions_fts USING fts5(
  section_number, title, text,
  content='legal_provisions',
  content_rowid='id',
  tokenize='unicode61'
);

-- FTS sync triggers
CREATE TRIGGER provisions_ai AFTER INSERT ON legal_provisions BEGIN
  INSERT INTO provisions_fts(rowid, section_number, title, text)
  VALUES (new.id, new.section_number, new.title, new.text);
END;

CREATE TRIGGER provisions_ad AFTER DELETE ON legal_provisions BEGIN
  INSERT INTO provisions_fts(provisions_fts, rowid, section_number, title, text)
  VALUES ('delete', old.id, old.section_number, old.title, old.text);
END;

CREATE TRIGGER provisions_au AFTER UPDATE ON legal_provisions BEGIN
  INSERT INTO provisions_fts(provisions_fts, rowid, section_number, title, text)
  VALUES ('delete', old.id, old.section_number, old.title, old.text);
  INSERT INTO provisions_fts(rowid, section_number, title, text)
  VALUES (new.id, new.section_number, new.title, new.text);
END;

CREATE TABLE IF NOT EXISTS requirement_categories (
  id INTEGER PRIMARY KEY,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS state_requirements (
  id INTEGER PRIMARY KEY,
  jurisdiction TEXT NOT NULL,
  category_id INTEGER REFERENCES requirement_categories(id),
  document_id INTEGER REFERENCES legal_documents(id),
  provision_id INTEGER REFERENCES legal_provisions(id),
  summary_text TEXT NOT NULL,
  notification_days INTEGER,
  notification_target TEXT,
  applies_to TEXT,
  threshold TEXT,
  penalty_max TEXT,
  private_right_of_action INTEGER,
  effective_date TEXT,
  last_amended TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS db_metadata (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_docs_jurisdiction ON legal_documents(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_docs_short_name ON legal_documents(short_name);
CREATE INDEX IF NOT EXISTS idx_provs_jurisdiction ON legal_provisions(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_provs_document_id ON legal_provisions(document_id);
CREATE INDEX IF NOT EXISTS idx_requirements_jurisdiction ON state_requirements(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_requirements_category ON state_requirements(category_id);
CREATE INDEX IF NOT EXISTS idx_docs_identifier ON legal_documents(identifier);
CREATE INDEX IF NOT EXISTS idx_docs_status ON legal_documents(status);
CREATE INDEX IF NOT EXISTS idx_provs_section_number ON legal_provisions(section_number);
CREATE INDEX IF NOT EXISTS idx_requirements_document ON state_requirements(document_id);
CREATE INDEX IF NOT EXISTS idx_requirements_provision ON state_requirements(provision_id);
