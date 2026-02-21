import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import path from 'path';
import { logger } from './logger.js';

const DB_PATH = path.join(process.cwd(), 'data', 'memory.db');

let db: Database.Database;

export function initMemory(): void {
  mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_key TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
    CREATE INDEX IF NOT EXISTS idx_thread_key ON messages(thread_key);
  `);
  logger.info('Memory database initialized');
}

export function loadHistory(threadKey: string, limit = 10): { role: 'user' | 'assistant'; content: string }[] {
  const rows = db.prepare(
    'SELECT role, content FROM messages WHERE thread_key = ? ORDER BY id DESC LIMIT ?'
  ).all(threadKey, limit) as { role: string; content: string }[];
  return rows.reverse().map((r) => ({ role: r.role as 'user' | 'assistant', content: r.content }));
}

export function saveMessage(threadKey: string, role: 'user' | 'assistant', content: string): void {
  db.prepare('INSERT INTO messages (thread_key, role, content) VALUES (?, ?, ?)').run(threadKey, role, content);
  db.prepare(`
    DELETE FROM messages WHERE thread_key = ? AND id NOT IN (
      SELECT id FROM messages WHERE thread_key = ? ORDER BY id DESC LIMIT 20
    )
  `).run(threadKey, threadKey);
}
