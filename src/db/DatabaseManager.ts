import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import { MicroKorgPatch } from "../shared/types";
import fs from "fs";

export class DatabaseManager {
  private db: SqlJsDatabase | null = null;
  private dbPath: string;
  private initialized: boolean = false;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  /**
   * Initialize database (async for sql.js)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const SQL = await initSqlJs();

    // Try to load existing database
    try {
      if (fs.existsSync(this.dbPath)) {
        const buffer = fs.readFileSync(this.dbPath);
        this.db = new SQL.Database(buffer);
      } else {
        this.db = new SQL.Database();
      }
    } catch (err) {
      this.db = new SQL.Database();
    }

    this.initializeSchema();
    this.save();
    this.initialized = true;
  }

  /**
   * Initialize database schema
   */
  private initializeSchema(): void {
    if (!this.db) return;

    // Create patches table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS patches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        program_number INTEGER,
        category TEXT,
        favorite INTEGER DEFAULT 0,
        rating INTEGER DEFAULT 0,
        sysex_data BLOB NOT NULL,
        parameters_json TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Create tags table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        color TEXT
      )
    `);

    // Create patch_tags junction table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS patch_tags (
        patch_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (patch_id, tag_id),
        FOREIGN KEY (patch_id) REFERENCES patches(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      )
    `);

    // Create categories table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        icon TEXT
      )
    `);

    // Create indexes
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_patches_name ON patches(name)`);
    this.db.run(
      `CREATE INDEX IF NOT EXISTS idx_patches_category ON patches(category)`,
    );
    this.db.run(
      `CREATE INDEX IF NOT EXISTS idx_patches_favorite ON patches(favorite)`,
    );
    this.db.run(
      `CREATE INDEX IF NOT EXISTS idx_patches_rating ON patches(rating)`,
    );

    console.log("Database initialized successfully");
  }

  /**
   * Save database to disk
   */
  private save(): void {
    if (!this.db) return;
    const data = this.db.export();
    fs.writeFileSync(this.dbPath, data);
  }

  /**
   * Get all patches
   */
  getAllPatches(): MicroKorgPatch[] {
    if (!this.db) return [];

    const results = this.db.exec(`
      SELECT
        p.*,
        GROUP_CONCAT(t.name) as tags
      FROM patches p
      LEFT JOIN patch_tags pt ON p.id = pt.patch_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      GROUP BY p.id
      ORDER BY p.updated_at DESC
    `);

    if (!results[0]) return [];

    return results[0].values.map((row: any) =>
      this.rowToPatch(results[0].columns, row),
    );
  }

  /**
   * Get patch by ID
   */
  getPatchById(id: number): MicroKorgPatch | null {
    if (!this.db) return null;

    const results = this.db.exec(
      `
      SELECT
        p.*,
        GROUP_CONCAT(t.name) as tags
      FROM patches p
      LEFT JOIN patch_tags pt ON p.id = pt.patch_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.id = ?
      GROUP BY p.id
    `,
      [id],
    );

    if (!results[0] || !results[0].values[0]) return null;

    return this.rowToPatch(results[0].columns, results[0].values[0]);
  }

  /**
   * Save a new patch or update existing one
   */
  savePatch(patch: Partial<MicroKorgPatch>): number {
    if (!this.db) throw new Error("Database not initialized");

    const now = new Date().toISOString();

    if (patch.id) {
      // Update existing patch
      this.db.run(
        `
        UPDATE patches
        SET name = ?,
            program_number = ?,
            category = ?,
            favorite = ?,
            rating = ?,
            sysex_data = ?,
            parameters_json = ?,
            updated_at = ?
        WHERE id = ?
      `,
        [
          patch.name || "Untitled",
          patch.programNumber ?? null,
          patch.category ?? null,
          patch.favorite ? 1 : 0,
          patch.rating || 0,
          patch.sysexData ? new Uint8Array(patch.sysexData) : new Uint8Array(),
          JSON.stringify(patch.parameters),
          now,
          patch.id,
        ],
      );

      // Update tags
      if (patch.tags) {
        this.updatePatchTags(patch.id, patch.tags);
      }

      this.save();
      return patch.id;
    } else {
      // Insert new patch
      this.db.run(
        `
        INSERT INTO patches (
          name, program_number, category, favorite, rating,
          sysex_data, parameters_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          patch.name || "Untitled",
          patch.programNumber ?? null,
          patch.category ?? null,
          patch.favorite ? 1 : 0,
          patch.rating || 0,
          patch.sysexData ? new Uint8Array(patch.sysexData) : new Uint8Array(),
          JSON.stringify(patch.parameters),
          patch.createdAt || now,
          now,
        ],
      );

      const results = this.db.exec("SELECT last_insert_rowid() as id");
      const patchId = results[0].values[0][0] as number;

      // Add tags
      if (patch.tags) {
        this.updatePatchTags(patchId, patch.tags);
      }

      this.save();
      return patchId;
    }
  }

  /**
   * Delete a patch
   */
  deletePatch(id: number): void {
    if (!this.db) return;
    this.db.run("DELETE FROM patches WHERE id = ?", [id]);
    this.save();
  }

  /**
   * Search patches by name or tags
   */
  searchPatches(query: string): MicroKorgPatch[] {
    if (!this.db) return [];

    const searchPattern = `%${query}%`;

    const results = this.db.exec(
      `
      SELECT DISTINCT
        p.*,
        GROUP_CONCAT(t.name) as tags
      FROM patches p
      LEFT JOIN patch_tags pt ON p.id = pt.patch_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.name LIKE ? OR t.name LIKE ?
      GROUP BY p.id
      ORDER BY p.updated_at DESC
    `,
      [searchPattern, searchPattern],
    );

    if (!results[0]) return [];

    return results[0].values.map((row) =>
      this.rowToPatch(results[0].columns, row),
    );
  }

  /**
   * Get patches by tag
   */
  getPatchesByTag(tagName: string): MicroKorgPatch[] {
    if (!this.db) return [];

    const results = this.db.exec(
      `
      SELECT
        p.*,
        GROUP_CONCAT(t2.name) as tags
      FROM patches p
      INNER JOIN patch_tags pt ON p.id = pt.patch_id
      INNER JOIN tags t ON pt.tag_id = t.id
      LEFT JOIN patch_tags pt2 ON p.id = pt2.patch_id
      LEFT JOIN tags t2 ON pt2.tag_id = t2.id
      WHERE t.name = ?
      GROUP BY p.id
      ORDER BY p.updated_at DESC
    `,
      [tagName],
    );

    if (!results[0]) return [];

    return results[0].values.map((row: any) =>
      this.rowToPatch(results[0].columns, row),
    );
  }

  /**
   * Add a tag to a patch
   */
  addTag(patchId: number, tagName: string): void {
    if (!this.db) return;

    const tagId = this.getOrCreateTag(tagName);

    this.db.run(
      `
      INSERT OR IGNORE INTO patch_tags (patch_id, tag_id)
      VALUES (?, ?)
    `,
      [patchId, tagId],
    );

    this.save();
  }

  /**
   * Remove a tag from a patch
   */
  removeTag(patchId: number, tagName: string): void {
    if (!this.db) return;

    this.db.run(
      `
      DELETE FROM patch_tags
      WHERE patch_id = ? AND tag_id = (
        SELECT id FROM tags WHERE name = ?
      )
    `,
      [patchId, tagName],
    );

    this.save();
  }

  /**
   * Get or create a tag
   */
  private getOrCreateTag(tagName: string): number {
    if (!this.db) throw new Error("Database not initialized");

    // Try to get existing tag
    const results = this.db.exec("SELECT id FROM tags WHERE name = ?", [
      tagName,
    ]);

    if (results[0] && results[0].values[0]) {
      return results[0].values[0][0] as number;
    }

    // Create new tag
    this.db.run("INSERT INTO tags (name) VALUES (?)", [tagName]);
    const newResults = this.db.exec("SELECT last_insert_rowid() as id");
    return newResults[0].values[0][0] as number;
  }

  /**
   * Update tags for a patch
   */
  private updatePatchTags(patchId: number, tags: string[]): void {
    if (!this.db) return;

    // Remove existing tags
    this.db.run("DELETE FROM patch_tags WHERE patch_id = ?", [patchId]);

    // Add new tags
    for (const tag of tags) {
      this.addTag(patchId, tag);
    }
  }

  /**
   * Convert database row to MicroKorgPatch object
   */
  private rowToPatch(columns: string[], row: any[]): MicroKorgPatch {
    const obj: any = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });

    return {
      id: obj.id,
      name: obj.name,
      programNumber: obj.program_number,
      category: obj.category,
      favorite: obj.favorite === 1,
      rating: obj.rating,
      tags: obj.tags ? obj.tags.split(",") : [],
      sysexData: new Uint8Array(obj.sysex_data || []),
      parameters: JSON.parse(obj.parameters_json),
      createdAt: obj.created_at,
      updatedAt: obj.updated_at,
    };
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.save();
      this.db.close();
      this.db = null;
    }
  }
}
