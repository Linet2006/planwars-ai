import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';
import { runMigrations } from './migrations.js';

let dbInstance = null;

/**
 * Initializes and returns the SQLite database connection.
 * @param {string} [customPath] - Optional override path (e.g., ':memory:' for tests)
 * @returns {import('better-sqlite3').Database}
 */
export function getDatabase(customPath) {
  if (dbInstance && !customPath) {
    return dbInstance;
  }

  const targetPath = customPath || config.dbFilePath;

  if (targetPath !== ':memory:') {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new Database(targetPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Run migrations
  runMigrations(db);

  if (!customPath) {
    dbInstance = db;
  }

  return db;
}

/**
 * Closes current active database instance.
 */
export function closeDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
