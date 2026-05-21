import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import crypto from 'crypto'
import * as schema from '../../drizzle/schema'

let db: ReturnType<typeof drizzle<typeof schema>> | null = null
let sqliteDb: Database.Database | null = null

export function initDb(): void {
  const dbPath = join(app.getPath('userData'), 'diary.db')
  sqliteDb = new Database(dbPath)

  sqliteDb.pragma('journal_mode = WAL')
  sqliteDb.pragma('foreign_keys = ON')

  runMigrations(sqliteDb)

  db = drizzle(sqliteDb, { schema })
}

function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      content_preview TEXT,
      mood INTEGER CHECK(mood BETWEEN 1 AND 5),
      is_pinned INTEGER DEFAULT 0,
      is_locked INTEGER DEFAULT 0,
      word_count INTEGER DEFAULT 0,
      last_edited_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT UNIQUE NOT NULL,
      color TEXT DEFAULT '#7F77DD'
    );

    CREATE TABLE IF NOT EXISTS entry_tags (
      entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (entry_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY NOT NULL,
      entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER,
      path TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS entry_versions (
      id TEXT PRIMARY KEY NOT NULL,
      entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      content_preview TEXT,
      word_count INTEGER DEFAULT 0,
      version INTEGER NOT NULL,
      change_desc TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_entry_versions_entry_id ON entry_versions(entry_id);
    CREATE INDEX IF NOT EXISTS idx_entry_tags_entry_id ON entry_tags(entry_id);
    CREATE INDEX IF NOT EXISTS idx_entry_tags_tag_id ON entry_tags(tag_id);
    CREATE INDEX IF NOT EXISTS idx_entries_deleted_at ON entries(deleted_at);
    CREATE INDEX IF NOT EXISTS idx_entries_pinned ON entries(is_pinned);

    CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(
      title, content_preview,
      content='entries',
      content_rowid='rowid'
    );

    CREATE TRIGGER IF NOT EXISTS entries_ai AFTER INSERT ON entries BEGIN
      INSERT INTO entries_fts(rowid, title, content_preview)
      VALUES (new.rowid, new.title, new.content_preview);
    END;

    CREATE TRIGGER IF NOT EXISTS entries_ad AFTER DELETE ON entries BEGIN
      INSERT INTO entries_fts(entries_fts, rowid, title, content_preview)
      VALUES ('delete', old.rowid, old.title, old.content_preview);
    END;

    CREATE TRIGGER IF NOT EXISTS entries_au AFTER UPDATE ON entries BEGIN
      INSERT INTO entries_fts(entries_fts, rowid, title, content_preview)
      VALUES ('delete', old.rowid, old.title, old.content_preview);
      INSERT INTO entries_fts(rowid, title, content_preview)
      VALUES (new.rowid, new.title, new.content_preview);
    END;
  `)

  const defaultSettings: Record<string, string> = {
    theme: 'system',
    accent_color: '#7F77DD',
    editor_font: 'Inter',
    editor_font_size: '16',
    auto_save_delay: '1000',
    auto_lock_timeout: '15',
    spell_check: 'true',
    markdown_shortcuts: 'true',
    auto_backup: 'false',
    auto_backup_path: '',
    start_on_login: 'false',
    show_in_menubar: 'false',
    export_format: 'md',
    first_day_of_week: '1'
  }

  const insertSetting = db.prepare(
    'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
  )

  for (const [key, value] of Object.entries(defaultSettings)) {
    insertSetting.run(key, value)
  }
}

export function getDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (!db) throw new Error('Database not initialized')
  return db
}

export function getSqliteDb(): Database.Database {
  if (!sqliteDb) throw new Error('Database not initialized')
  return sqliteDb
}

export function generateId(): string {
  return crypto.randomBytes(16).toString('hex')
}

export function nowISO(): string {
  return new Date().toISOString()
}
