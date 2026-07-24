import Database from "better-sqlite3";
import type { D1Database, D1PreparedStatement, D1Result } from "../knowledge-graph/types";

/**
 * Minimal D1Database mock backed by better-sqlite3 (real SQL execution).
 * Implements the prepare/bind/first/all/run/raw surface KnowledgeGraph uses.
 * Catches SQL bugs a Map-based mock would miss.
 *
 * Uses better-sqlite3 rather than node:sqlite because node:sqlite is only
 * built into Node 22.5+; this repo is pinned to Node 20 on both bird and
 * CT105 (and Cloudflare Pages' build image), so node:sqlite doesn't exist
 * at all here — every test importing this file failed to load as a result.
 *
 * Ported from /tmp/opencode/d1-mock.mjs (session 1 of ai-ecosystem-scaffold)
 * for permanent residency under src/lib/ecosystem/testing/ — component 10.
 *
 * Usage:
 *   const db = new MockD1();
 *   db.applyMigration(readFileSync("migrations/0001_...sql", "utf8"));
 *   const graph = new KnowledgeGraph(db, spConfig);
 */
export class MockD1 implements D1Database {
  private db: Database.Database;

  constructor() {
    this.db = new Database(":memory:");
    // FK enforcement is OFF by default in SQLite — required for the composite
    // FK in 0001 to actually reject cross-business edges.
    this.db.exec("PRAGMA foreign_keys = ON;");
  }

  applyMigration(sql: string): void {
    this.db.exec(sql);
  }

  prepare(sqlString: string): D1PreparedStatement {
    return new MockPreparedStatement(this.db, sqlString);
  }

  // Helpers for direct inspection in tests (not on the D1 surface).
  exec(sql: string): void {
    this.db.exec(sql);
  }
}

class MockPreparedStatement implements D1PreparedStatement {
  constructor(
    private readonly db: Database.Database,
    private readonly sql: string,
    private readonly params: unknown[] = [],
  ) {}

  bind(...values: unknown[]): D1PreparedStatement {
    return new MockPreparedStatement(this.db, this.sql, [...this.params, ...values]);
  }

  async first<T = unknown>(): Promise<T | null> {
    try {
      const stmt = this.db.prepare(this.sql);
      const row = stmt.get(...this.params) as T | undefined;
      return row ?? null;
    } catch (e) {
      const err = e as Error;
      err.message = `MockD1.first failed: ${err.message}\nSQL: ${this.sql}\nParams: ${JSON.stringify(this.params)}`;
      throw err;
    }
  }

  async all<T = unknown>(): Promise<D1Result<T>> {
    try {
      const stmt = this.db.prepare(this.sql);
      const results = stmt.all(...this.params) as T[];
      return { results, success: true, meta: { changes: results.length } };
    } catch (e) {
      const err = e as Error;
      err.message = `MockD1.all failed: ${err.message}\nSQL: ${this.sql}\nParams: ${JSON.stringify(this.params)}`;
      throw err;
    }
  }

  async run<T = unknown>(): Promise<D1Result<T>> {
    try {
      const stmt = this.db.prepare(this.sql);
      const info = stmt.run(...this.params);
      return { results: [], success: true, meta: info as unknown as D1Result["meta"] };
    } catch (e) {
      const err = e as Error;
      err.message = `MockD1.run failed: ${err.message}\nSQL: ${this.sql}\nParams: ${JSON.stringify(this.params)}`;
      throw err;
    }
  }

  async raw<T = unknown>(): Promise<T[][]> {
    try {
      const stmt = this.db.prepare(this.sql);
      const rows = stmt.all(...this.params) as T[];
      return rows.map((r) => Object.values(r as Record<string, unknown>)) as unknown as T[][];
    } catch (e) {
      const err = e as Error;
      err.message = `MockD1.raw failed: ${err.message}\nSQL: ${this.sql}\nParams: ${JSON.stringify(this.params)}`;
      throw err;
    }
  }
}
