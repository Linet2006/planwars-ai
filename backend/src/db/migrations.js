/**
 * Database migrations runner and SQL schema definitions.
 */

export const MIGRATIONS = [
  {
    version: 1,
    name: 'initial_schema',
    up: (db) => {
      db.exec(`
        -- Enable foreign key constraints and WAL mode for high performance
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS schema_version (
          version INTEGER PRIMARY KEY,
          applied_at TEXT NOT NULL
        );

        -- Events Table
        CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          event_type TEXT NOT NULL,
          budget_total INTEGER NOT NULL DEFAULT 0,
          guest_count INTEGER NOT NULL DEFAULT 1,
          event_date TEXT NOT NULL,
          location TEXT DEFAULT '',
          cultural_context TEXT DEFAULT '',
          priorities TEXT DEFAULT '',
          status TEXT NOT NULL DEFAULT 'planning',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        -- Budget Items Table
        CREATE TABLE IF NOT EXISTS budget_items (
          id TEXT PRIMARY KEY,
          event_id TEXT NOT NULL,
          category TEXT NOT NULL,
          estimated_amount INTEGER NOT NULL DEFAULT 0,
          actual_amount INTEGER DEFAULT NULL,
          is_confirmed INTEGER NOT NULL DEFAULT 0,
          notes TEXT DEFAULT '',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
        );

        -- Tasks Table
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          event_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT DEFAULT '',
          due_date TEXT NOT NULL,
          priority TEXT NOT NULL DEFAULT 'medium',
          status TEXT NOT NULL DEFAULT 'pending',
          order_index INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
        );

        -- Task Dependencies Table
        CREATE TABLE IF NOT EXISTS task_dependencies (
          id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL,
          depends_on_task_id TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
          FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id) ON DELETE CASCADE
        );

        -- Vendors Table
        CREATE TABLE IF NOT EXISTS vendors (
          id TEXT PRIMARY KEY,
          event_id TEXT NOT NULL,
          category TEXT NOT NULL,
          name TEXT NOT NULL,
          contact_info TEXT DEFAULT '',
          status TEXT NOT NULL DEFAULT 'researching',
          notes TEXT DEFAULT '',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
        );

        -- Vendor Checklist Items Table
        CREATE TABLE IF NOT EXISTS vendor_checklist_items (
          id TEXT PRIMARY KEY,
          vendor_id TEXT NOT NULL,
          title TEXT NOT NULL,
          item_type TEXT NOT NULL DEFAULT 'requirement',
          is_completed INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
        );

        -- Quotes Table
        CREATE TABLE IF NOT EXISTS quotes (
          id TEXT PRIMARY KEY,
          vendor_id TEXT NOT NULL,
          vendor_name TEXT NOT NULL,
          total_amount INTEGER NOT NULL DEFAULT 0,
          guests_covered INTEGER DEFAULT 0,
          inclusions_json TEXT DEFAULT '[]',
          extra_charges_json TEXT DEFAULT '[]',
          open_questions_json TEXT DEFAULT '[]',
          is_selected INTEGER NOT NULL DEFAULT 0,
          raw_text TEXT DEFAULT '',
          created_at TEXT NOT NULL,
          FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
        );

        -- Ideas Table
        CREATE TABLE IF NOT EXISTS ideas (
          id TEXT PRIMARY KEY,
          event_id TEXT NOT NULL,
          category TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          estimated_cost_tier TEXT DEFAULT '₹₹',
          tags_json TEXT DEFAULT '[]',
          is_saved INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
        );

        -- Messages Table
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          event_id TEXT NOT NULL,
          sender TEXT NOT NULL,
          content TEXT NOT NULL,
          context_type TEXT DEFAULT 'general',
          created_at TEXT NOT NULL,
          FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
        );

        -- Bounded LLM Cache Table
        CREATE TABLE IF NOT EXISTS llm_cache (
          hash_key TEXT PRIMARY KEY,
          prompt_type TEXT NOT NULL,
          response_json TEXT NOT NULL,
          created_at TEXT NOT NULL,
          expires_at INTEGER NOT NULL
        );

        -- Indexes for high performance querying
        CREATE INDEX IF NOT EXISTS idx_budget_items_event_id ON budget_items(event_id);
        CREATE INDEX IF NOT EXISTS idx_tasks_event_id ON tasks(event_id);
        CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
        CREATE INDEX IF NOT EXISTS idx_task_deps_task_id ON task_dependencies(task_id);
        CREATE INDEX IF NOT EXISTS idx_task_deps_dep_id ON task_dependencies(depends_on_task_id);
        CREATE INDEX IF NOT EXISTS idx_vendors_event_id ON vendors(event_id);
        CREATE INDEX IF NOT EXISTS idx_vendor_checklist_vendor_id ON vendor_checklist_items(vendor_id);
        CREATE INDEX IF NOT EXISTS idx_quotes_vendor_id ON quotes(vendor_id);
        CREATE INDEX IF NOT EXISTS idx_ideas_event_id ON ideas(event_id);
        CREATE INDEX IF NOT EXISTS idx_messages_event_id ON messages(event_id);
        CREATE INDEX IF NOT EXISTS idx_llm_cache_expires ON llm_cache(expires_at);
      `);
    }
  }
];

/**
 * Runs pending database migrations.
 * @param {import('better-sqlite3').Database} db
 */
export function runMigrations(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const appliedVersions = new Set(
    db.prepare('SELECT version FROM schema_version').all().map((r) => r.version)
  );

  for (const migration of MIGRATIONS) {
    if (!appliedVersions.has(migration.version)) {
      db.transaction(() => {
        migration.up(db);
        db.prepare('INSERT INTO schema_version (version, applied_at) VALUES (?, ?)').run(
          migration.version,
          new Date().toISOString()
        );
      })();
    }
  }
}

