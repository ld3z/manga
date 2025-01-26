import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { FeedMapping } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '../../feed-mappings.db');

const db = new Database(dbPath);

// Initialize the database with the required table
db.exec(`
  CREATE TABLE IF NOT EXISTS feed_mappings (
    feed_id TEXT PRIMARY KEY,
    slugs TEXT NOT NULL,
    lang TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export function storeFeedMapping(feedId: string, slugs: string[], lang: string): void {
  const stmt = db.prepare('INSERT OR REPLACE INTO feed_mappings (feed_id, slugs, lang) VALUES (?, ?, ?)');
  stmt.run(feedId, JSON.stringify(slugs), lang);
}

export function getFeedMapping(feedId: string): FeedMapping | null {
  const stmt = db.prepare('SELECT slugs, lang FROM feed_mappings WHERE feed_id = ?');
  const result = stmt.get(feedId);
  
  if (!result) return null;
  
  return {
    slugs: JSON.parse(result.slugs),
    lang: result.lang
  };
}

// Optional: Clean up old mappings (older than 30 days)
export function cleanupOldMappings(): void {
  const stmt = db.prepare(`
    DELETE FROM feed_mappings 
    WHERE created_at < datetime('now', '-30 days')
  `);
  stmt.run();
}

// Run cleanup periodically (every 24 hours)
setInterval(cleanupOldMappings, 24 * 60 * 60 * 1000); 