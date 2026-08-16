import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../../data');
const dbPath = path.join(dataDir, 'carecompass.db');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin', 'volunteer')),
      preferred_language TEXT DEFAULT 'en',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      organization TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      eligibility TEXT,
      documents_needed TEXT,
      address TEXT,
      city TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'TX',
      zip TEXT,
      latitude REAL,
      longitude REAL,
      phone TEXT,
      email TEXT,
      website TEXT,
      hours TEXT,
      languages TEXT DEFAULT 'English',
      source_url TEXT,
      last_verified_at TEXT NOT NULL DEFAULT (datetime('now')),
      is_active INTEGER NOT NULL DEFAULT 1,
      created_by INTEGER REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS favorites (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, resource_id)
    );

    CREATE TABLE IF NOT EXISTS ai_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      resource_ids TEXT,
      language TEXT DEFAULT 'en',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
    CREATE INDEX IF NOT EXISTS idx_resources_city ON resources(city);
    CREATE INDEX IF NOT EXISTS idx_resources_active ON resources(is_active);
  `);
}

export default db;
