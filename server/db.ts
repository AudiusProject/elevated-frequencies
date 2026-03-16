import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '..', 'submissions.db')

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    track_id TEXT NOT NULL,
    track_title TEXT NOT NULL,
    audius_user_id TEXT NOT NULL,
    audius_handle TEXT NOT NULL DEFAULT '',
    artist_name TEXT NOT NULL,
    genre TEXT NOT NULL DEFAULT '',
    bpm TEXT DEFAULT '',
    moods TEXT DEFAULT '',
    description TEXT DEFAULT '',
    release_status TEXT DEFAULT '',
    location TEXT DEFAULT '',
    instagram TEXT DEFAULT '',
    tiktok TEXT DEFAULT '',
    spotify_url TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'queued',
    artist_note TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(audius_user_id);
  CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
`)

export default db
