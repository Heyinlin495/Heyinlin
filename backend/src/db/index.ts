// Database wrapper — sql.js with better-sqlite3-compatible API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import initSqlJs from 'sql.js';
import path from 'path';
import fs from 'fs';
import { CREATE_TABLES, CREATE_INDEXES } from './schema';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/personal-space.db');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sqlJs: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any = null;
let inTransaction = false;

// Initialize database
export async function initDB(): Promise<void> {
  if (db) return;

  if (!sqlJs) {
    sqlJs = await initSqlJs({
      locateFile: (file: string) => require.resolve(`sql.js/dist/${file}`),
    });
  }

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new sqlJs.Database(buffer);
  } else {
    db = new sqlJs.Database();
  }

  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');
  db.run('PRAGMA cache_size = -64000');

  // Execute each CREATE TABLE / INDEX statement individually (sql.js only runs one statement at a time)
  const createStatements = CREATE_TABLES.split(';').map(s => s.trim()).filter(Boolean);
  for (const sql of createStatements) {
    try {
      db.run(sql);
    } catch (err) {
      // Table already exists, skip
    }
  }

  const indexStatements = CREATE_INDEXES.split(';').map(s => s.trim()).filter(Boolean);
  for (const sql of indexStatements) {
    try {
      db.run(sql);
    } catch (err) {
      // Index already exists, skip
    }
  }

  // Migration: add missing columns to existing tables
  runMigrations(db);

  saveDB();
}

// Migration: add missing columns to existing tables
function runMigrations(database: any): void {
  // Add tags column to posts table if missing
  const columns = database.exec('PRAGMA table_info(posts)');
  if (columns.length > 0 && columns[0].columns.includes('name')) {
    const existingCols = columns[0].values.map((row: unknown[]) => row[1]);
    if (!existingCols.includes('tags')) {
      console.log('Migration: adding tags column to posts table');
      database.run('ALTER TABLE posts ADD COLUMN tags TEXT');
    }
  }
}

// Save database to disk
function saveDB(): void {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// Sync database to disk (call after writes)
export function syncDB(): void {
  if (!inTransaction) {
    saveDB();
  }
}

// Statement wrapper mimicking better-sqlite3 Statement API
class Statement {
  private sql: string;

  constructor(private readonly database: any, sql: string) {
    this.sql = sql;
  }

  private exec(params?: unknown[]): any[] {
    const result = this.database.exec(this.sql, (params || []) as any[]);
    return result;
  }

  // Get a single row
  get(...params: unknown[]): Record<string, unknown> | undefined {
    const result = this.exec(params);
    if (result.length > 0 && result[0].values.length > 0) {
      const row: Record<string, unknown> = {};
      const columns = result[0].columns;
      const values = result[0].values[0];
      for (let i = 0; i < columns.length; i++) {
        row[columns[i]] = values[i];
      }
      return row;
    }
    return undefined;
  }

  // Get all rows
  all(...params: unknown[]): Record<string, unknown>[] {
    const result = this.exec(params);
    if (result.length === 0) return [];
    const columns = result[0].columns;
    return result[0].values.map((values: unknown[]) => {
      const row: Record<string, unknown> = {};
      for (let i = 0; i < columns.length; i++) {
        row[columns[i]] = values[i];
      }
      return row;
    });
  }

  // Execute (INSERT, UPDATE, DELETE)
  run(...params: unknown[]): { changes: number } {
    this.database.run(this.sql, params as any[]);
    syncDB();
    return { changes: this.database.getRowsModified() };
  }
}

export function getDB(): {
  prepare: (sql: string) => Statement;
  run: (sql: string, params?: unknown[]) => { changes: number };
  exec: (sql: string) => void;
  transaction: (fn: (...args: unknown[]) => unknown) => (...args: unknown[]) => unknown;
  close: () => void;
} {
  if (!db) {
    throw new Error('Database not initialized. Call initDB() first.');
  }

  return {
    prepare: (sql: string) => new Statement(db, sql),
    run: (sql: string, params?: unknown[]) => {
      db.run(sql, (params || []) as any[]);
      syncDB();
      return { changes: db.getRowsModified() };
    },
    exec: (sql: string) => {
      db.run(sql);
      syncDB();
    },
    transaction: (fn: (...args: unknown[]) => unknown) => {
      return (...args: unknown[]) => {
        try {
          db.run('BEGIN TRANSACTION', []);
          inTransaction = true;
          const result = fn(...args);
          inTransaction = false;
          db.run('COMMIT', []);
          syncDB();
          return result;
        } catch (err) {
          inTransaction = false;
          try { db.run('ROLLBACK', []); } catch {}
          throw err;
        }
      };
    },
    close: () => {
      if (db) {
        db.close();
        db = null;
      }
    },
  };
}

export function closeDB(): void {
  if (db) {
    saveDB();
    db.close();
    db = null;
  }
}

// Auto-save periodically
let saveInterval: NodeJS.Timeout | null = null;

export function startAutoSave(intervalMs: number = 30000): void {
  if (saveInterval) clearInterval(saveInterval);
  saveInterval = setInterval(() => {
    if (db) saveDB();
  }, intervalMs);
}

export function stopAutoSave(): void {
  if (saveInterval) {
    clearInterval(saveInterval);
    saveInterval = null;
  }
}
