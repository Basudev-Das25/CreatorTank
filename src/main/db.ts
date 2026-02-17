import initSqlJs from "sql.js";
import { app } from "electron";
import { join } from "path";
import fs from "fs";

let db: any = null;
const dbPath = join(app.getPath("userData"), "database.sqlite");

// Resolve the path to sql-wasm.wasm for both development and packaged builds
function getWasmPath(): string {
  // In production (packaged app), the WASM file is in extraResources
  if (app.isPackaged) {
    return join(process.resourcesPath, "sql-wasm.wasm");
  }
  // In development, sql.js resolves it from node_modules automatically
  return join(
    __dirname,
    "..",
    "..",
    "node_modules",
    "sql.js",
    "dist",
    "sql-wasm.wasm"
  );
}

function saveDB() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (e) {
    console.error("Failed to save DB:", e);
  }
}

export async function initDB(): Promise<void> {
  if (db) return;

  try {
    const wasmPath = getWasmPath();
    console.log("Loading sql.js WASM from:", wasmPath);
    const wasmFile = fs.readFileSync(wasmPath);
    const wasmBinary = wasmFile.buffer.slice(
      wasmFile.byteOffset,
      wasmFile.byteOffset + wasmFile.byteLength
    ) as ArrayBuffer;
    const SQL = await initSqlJs({ wasmBinary });

    if (fs.existsSync(dbPath)) {
      const filebuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(filebuffer);
      console.log("Database loaded from file:", dbPath);
    } else {
      db = new SQL.Database();
      console.log("Created new database in memory.");
    }

    // Schema Migrations/updates
    db.run("PRAGMA foreign_keys = ON;");

    // Projects Table
    db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        platform TEXT DEFAULT 'Custom',
        scheduled_date TEXT,
        scheduled_time TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Check if platform column exists (simple migration for dev)
    try {
      db.exec("SELECT platform FROM projects LIMIT 1");
    } catch (e) {
      console.log("Migrating projects table: adding platform column");
      db.run("ALTER TABLE projects ADD COLUMN platform TEXT DEFAULT 'Custom'");
    }

    // New migration for project scheduling
    try {
      db.exec("SELECT scheduled_date FROM projects LIMIT 1");
    } catch (e) {
      console.log("Migrating projects table: adding scheduling columns");
      db.run("ALTER TABLE projects ADD COLUMN scheduled_date TEXT");
      db.run("ALTER TABLE projects ADD COLUMN scheduled_time TEXT");
    }

    // Ideas Table
    db.run(`
      CREATE TABLE IF NOT EXISTS ideas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'idea',
        priority TEXT DEFAULT 'medium',
        workflow_stage TEXT DEFAULT 'idea',
        scheduled_date TEXT,
        scheduled_time TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      );
    `);

    // Migration for ideas table
    try {
      db.exec("SELECT workflow_stage FROM ideas LIMIT 1");
    } catch (e) {
      console.log("Migrating ideas table: adding workflow and scheduling columns");
      db.run("ALTER TABLE ideas ADD COLUMN workflow_stage TEXT DEFAULT 'idea'");
      db.run("ALTER TABLE ideas ADD COLUMN scheduled_date TEXT");
      db.run("ALTER TABLE ideas ADD COLUMN scheduled_time TEXT");
      db.run("ALTER TABLE ideas ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP");
    }

    // New migration: output_path
    try {
      db.exec("SELECT output_path FROM ideas LIMIT 1");
    } catch (e) {
      console.log("Migrating ideas table: adding output_path column");
      db.run("ALTER TABLE ideas ADD COLUMN output_path TEXT");
    }

    // Scripts Table
    db.run(`
      CREATE TABLE IF NOT EXISTS scripts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idea_id INTEGER NOT NULL UNIQUE,
        content TEXT,
        notes TEXT,
        word_count INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (idea_id) REFERENCES ideas (id) ON DELETE CASCADE
      );
    `);

    // Migration for scripts table: add notes column
    try {
      db.exec("SELECT notes FROM scripts LIMIT 1");
    } catch (e) {
      console.log("Migrating scripts table: adding notes column");
      db.run("ALTER TABLE scripts ADD COLUMN notes TEXT");
    }

    // Assets Table
    db.run(`
      CREATE TABLE IF NOT EXISTS assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idea_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('image', 'file', 'link')),
        label TEXT,
        path_or_url TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (idea_id) REFERENCES ideas (id) ON DELETE CASCADE
      );
    `);

    // Settings Table
    db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // Initialize Default Settings
    const defaultSettings = [
      { key: 'shortcut_search', value: 'Ctrl+K' },
      { key: 'shortcut_sidebar', value: 'Ctrl+B' },
      { key: 'shortcut_schedule', value: 'Alt+S' },
      { key: 'theme_mode', value: 'system' }
    ];

    defaultSettings.forEach(s => {
      const existing = runGet("SELECT key FROM settings WHERE key = ?", [s.key]);
      if (!existing) {
        runRun("INSERT INTO settings (key, value) VALUES (?, ?)", [s.key, s.value]);
      }
    });

    // --- FULL TEXT SEARCH (FTS5) ---
    try {
      db.run(`
          CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
            item_type UNINDEXED, 
            item_id UNINDEXED,
            project_id UNINDEXED,
            idea_id UNINDEXED,
            title,
            content
          );
        `);

      // Triggers to sync FTS (Simple approach: delete and re-insert)
      // Projects sync
      db.run(`
          CREATE TRIGGER IF NOT EXISTS projects_ai AFTER INSERT ON projects BEGIN
            INSERT INTO search_index(item_type, item_id, project_id, title, content) 
            VALUES ('project', new.id, new.id, new.name, new.platform);
          END;
          CREATE TRIGGER IF NOT EXISTS projects_au AFTER UPDATE ON projects BEGIN
            DELETE FROM search_index WHERE item_type = 'project' AND item_id = old.id;
            INSERT INTO search_index(item_type, item_id, project_id, title, content) 
            VALUES ('project', new.id, new.id, new.name, new.platform);
          END;
          CREATE TRIGGER IF NOT EXISTS projects_ad AFTER DELETE ON projects BEGIN
            DELETE FROM search_index WHERE item_type = 'project' AND item_id = old.id;
          END;
        `);

      // Ideas sync
      db.run(`
          CREATE TRIGGER IF NOT EXISTS ideas_ai AFTER INSERT ON ideas BEGIN
            INSERT INTO search_index(item_type, item_id, project_id, idea_id, title, content) 
            VALUES ('idea', new.id, new.project_id, new.id, new.title, new.description);
          END;
          CREATE TRIGGER IF NOT EXISTS ideas_au AFTER UPDATE ON ideas BEGIN
            DELETE FROM search_index WHERE item_type = 'idea' AND item_id = old.id;
            INSERT INTO search_index(item_type, item_id, project_id, idea_id, title, content) 
            VALUES ('idea', new.id, new.project_id, new.id, new.title, new.description);
          END;
          CREATE TRIGGER IF NOT EXISTS ideas_ad AFTER DELETE ON ideas BEGIN
            DELETE FROM search_index WHERE item_type = 'idea' AND item_id = old.id;
          END;
        `);

      // Scripts sync
      db.run(`
          CREATE TRIGGER IF NOT EXISTS scripts_ai AFTER INSERT ON scripts BEGIN
            INSERT INTO search_index(item_type, item_id, project_id, idea_id, title, content) 
            SELECT 'script', new.id, i.project_id, new.idea_id, i.title, (new.content || ' ' || COALESCE(new.notes, ''))
            FROM ideas i WHERE i.id = new.idea_id;
          END;
          CREATE TRIGGER IF NOT EXISTS scripts_au AFTER UPDATE ON scripts BEGIN
            DELETE FROM search_index WHERE item_type = 'script' AND item_id = old.id;
            INSERT INTO search_index(item_type, item_id, project_id, idea_id, title, content) 
            SELECT 'script', new.id, i.project_id, new.idea_id, i.title, (new.content || ' ' || COALESCE(new.notes, ''))
            FROM ideas i WHERE i.id = new.idea_id;
          END;
          CREATE TRIGGER IF NOT EXISTS scripts_ad AFTER DELETE ON scripts BEGIN
            DELETE FROM search_index WHERE item_type = 'script' AND item_id = old.id;
          END;
        `);

      // Build initial search index if empty
      const searchCount = runGet("SELECT count(*) as count FROM search_index");
      if (searchCount && (searchCount.count === 0)) {
        console.log("Populating initial search index...");
        rebuildSearchIndex();
      }
    } catch (ftsError) {
      console.warn("FTS5 Search Index error (might not be supported):", ftsError);
    }

    saveDB();
    console.log("Database initialized and schema updated.");

  } catch (e) {
    console.error("Failed to initialize database:", e);
    throw e;
  }
}

// Helper to run INSERT/UPDATE/DELETE (returns lastID and changes)
export function runRun(sql: string, params: any[] = []): { id: number; changes: number } {
  if (!db) throw new Error("Database not initialized");

  db.run(sql, params);

  // Get last insert ID
  const res = db.exec("SELECT last_insert_rowid()");
  const id = res[0]?.values[0]?.[0];

  saveDB(); // Persist changes

  return { id: Number(id), changes: 1 };
}

// Helper to run SELECT (returns all rows as objects)
export function runAll(sql: string, params: any[] = []): any[] {
  if (!db) throw new Error("Database not initialized");

  const stmt = db.prepare(sql, params);
  const rows: any[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();

  return rows;
}

// Helper to run SELECT (returns single row)
export function runGet(sql: string, params: any[] = []): any {
  const rows = runAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export function getScript(ideaId: number): any {
  return runGet("SELECT * FROM scripts WHERE idea_id = ?", [ideaId]);
}

export function saveScript(ideaId: number, content: string, notes: string): { id: number; changes: number } {
  const wordCount = content ? content.trim().split(/\s+/).length : 0;
  // Using INSERT OR REPLACE due to UNIQUE constraint on idea_id
  return runRun(`
    INSERT OR REPLACE INTO scripts (idea_id, content, notes, word_count, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `, [ideaId, content, notes, wordCount]);
}

export function getAssets(ideaId: number): any[] {
  return runAll("SELECT * FROM assets WHERE idea_id = ? ORDER BY created_at DESC", [ideaId]);
}

// Global search using FTS5
export function searchContent(query: string): any[] {
  if (!db) return [];
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  try {
    // Attempt FTS5 MATCH first
    // Use asterisk for prefix matching, and escape double quotes
    const escapedQuery = cleanQuery.replace(/"/g, '""');
    const ftsQuery = escapedQuery.split(/\s+/).map(word => `${word}*`).join(' AND ');

    return runAll(`
            SELECT item_type, item_id, project_id, idea_id, title, content
            FROM search_index 
            WHERE search_index MATCH ?
            ORDER BY rank
            LIMIT 50
        `, [ftsQuery]);
  } catch (e) {
    console.warn("FTS Search error, falling back to LIKE:", e);
    // Fallback to LIKE if MATCH fails or is not supported
    return runAll(`
            SELECT item_type, item_id, project_id, idea_id, title, content
            FROM search_index 
            WHERE title LIKE ? OR content LIKE ?
            LIMIT 50
        `, [`%${cleanQuery}%`, `%${cleanQuery}%`]);
  }
}

export function rebuildSearchIndex() {
  if (!db) return;
  console.log("Rebuilding search index...");
  db.run("DELETE FROM search_index");

  // Repopulate Projects
  db.run(`
    INSERT INTO search_index(item_type, item_id, project_id, title, content)
    SELECT 'project', id, id, name, platform FROM projects
  `);

  // Repopulate Ideas
  db.run(`
    INSERT INTO search_index(item_type, item_id, project_id, idea_id, title, content)
    SELECT 'idea', id, project_id, id, title, description FROM ideas
  `);

  // Repopulate Scripts
  db.run(`
    INSERT INTO search_index(item_type, item_id, project_id, idea_id, title, content)
    SELECT 'script', s.id, i.project_id, s.idea_id, i.title, (COALESCE(s.content, '') || ' ' || COALESCE(s.notes, ''))
    FROM scripts s JOIN ideas i ON s.idea_id = i.id
  `);

  saveDB();
}
