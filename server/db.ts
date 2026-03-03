/**
 * db.ts — SQLite database layer for OpenRevision / EnergiRevision.
 *
 * Tables:
 *   leads          – all prospecting leads (soft-delete via deleted_at)
 *   engine_runs    – log of every engine/sync execution
 *   case_files     – uploaded files linked to leads
 *   activity_log   – timestamped system events
 *   hfd_rulings    – Högsta Förvaltningsdomstolen rulings
 *   agents         – AI agent definitions
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'openrevision.db');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

// Ensure data directories exist
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
    if (_db) return _db;

    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');

    // ── Schema creation ──────────────────────────────────────────────

    _db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id             TEXT PRIMARY KEY,
      name           TEXT NOT NULL,
      sni            TEXT DEFAULT '',
      industry       TEXT DEFAULT '',
      personnel_cost TEXT DEFAULT '',
      rd_deduction   TEXT DEFAULT '',
      score          INTEGER DEFAULT 0,
      status         TEXT DEFAULT 'New',
      tags           TEXT DEFAULT '[]',       -- JSON array
      potential      TEXT DEFAULT '',
      notes          TEXT DEFAULT '',
      source         TEXT DEFAULT 'manual',   -- 'manual' | 'engine' | 'seed'
      energy_consumption_kwh  REAL DEFAULT 0,
      tax_rate_current        REAL DEFAULT 0,        -- öre/kWh currently paid
      tax_rate_eligible       REAL DEFAULT 0,        -- öre/kWh they should pay
      recovery_window_years   INTEGER DEFAULT 0,
      confidence_level        TEXT DEFAULT 'low',     -- 'low' | 'medium' | 'high'
      employee_count          INTEGER DEFAULT 0,
      revenues_msek           REAL DEFAULT 0,
      detected_patterns       TEXT DEFAULT '[]',      -- JSON array of pattern IDs
      recommended_agents      TEXT DEFAULT '[]',      -- JSON array of agent IDs
      scoring_breakdown       TEXT DEFAULT '[]',      -- JSON array of scoring details
      created_at     TEXT DEFAULT (datetime('now')),
      updated_at     TEXT DEFAULT (datetime('now')),
      deleted_at     TEXT DEFAULT NULL        -- soft-delete timestamp
    );

    CREATE TABLE IF NOT EXISTS engine_runs (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at      TEXT NOT NULL DEFAULT (datetime('now')),
      finished_at     TEXT,
      status          TEXT DEFAULT 'running',  -- 'running' | 'success' | 'error'
      leads_processed INTEGER DEFAULT 0,
      leads_added     INTEGER DEFAULT 0,
      leads_updated   INTEGER DEFAULT 0,
      duration_ms     INTEGER DEFAULT 0,
      error_message   TEXT DEFAULT NULL,
      log_output      TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS case_files (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id     TEXT NOT NULL,
      filename    TEXT NOT NULL,
      mimetype    TEXT DEFAULT '',
      size_bytes  INTEGER DEFAULT 0,
      disk_path   TEXT NOT NULL,             -- relative path in data/uploads/
      uploaded_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (lead_id) REFERENCES leads(id)
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp  TEXT DEFAULT (datetime('now')),
      level      TEXT DEFAULT 'INFO',        -- 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR'
      message    TEXT NOT NULL,
      source     TEXT DEFAULT 'system'       -- 'system' | 'engine' | 'user' | 'api'
    );

    CREATE TABLE IF NOT EXISTS hfd_rulings (
      id    TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      desc  TEXT NOT NULL,
      tag   TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS agents (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      emoji       TEXT DEFAULT '',
      focus       TEXT DEFAULT '',
      color       TEXT DEFAULT '',
      bg          TEXT DEFAULT '',
      category    TEXT DEFAULT '',
      data_sources TEXT DEFAULT '[]',     -- JSON array of data source names
      triggers    TEXT DEFAULT '[]',      -- JSON array of trigger conditions
      workflow_steps TEXT DEFAULT '[]',   -- JSON array of workflow step descriptions
      escalation_criteria TEXT DEFAULT '',
      output_format TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS detection_patterns (
      id                    TEXT PRIMARY KEY,
      name                  TEXT NOT NULL,
      description           TEXT DEFAULT '',
      category              TEXT DEFAULT '',
      applicable_hfd_rulings TEXT DEFAULT '[]',  -- JSON array
      sni_prefixes          TEXT DEFAULT '[]',   -- JSON array
      agent_id              TEXT DEFAULT '',
      estimated_recovery_range TEXT DEFAULT '',
      retroactive_years     INTEGER DEFAULT 0
    );
  `);

    return _db;
}

// ── Lead operations ──────────────────────────────────────────────────

export interface Lead {
    id: string;
    name: string;
    sni: string;
    industry: string;
    personnel_cost: string;
    rd_deduction: string;
    score: number;
    status: string;
    tags: string[];
    potential: string;
    notes: string;
    source: string;
    energy_consumption_kwh: number;
    tax_rate_current: number;
    tax_rate_eligible: number;
    recovery_window_years: number;
    confidence_level: string;
    employee_count: number;
    revenues_msek: number;
    detected_patterns: string[];
    recommended_agents: string[];
    scoring_breakdown: Record<string, unknown>[];
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

/** Get all non-deleted leads. */
export function getAllLeads(): Lead[] {
    const db = getDb();
    const rows = db.prepare(
        `SELECT * FROM leads WHERE deleted_at IS NULL ORDER BY score DESC, name ASC`
    ).all() as any[];
    return rows.map(r => ({
        ...r,
        tags: JSON.parse(r.tags || '[]'),
        detected_patterns: JSON.parse(r.detected_patterns || '[]'),
        recommended_agents: JSON.parse(r.recommended_agents || '[]'),
        scoring_breakdown: JSON.parse(r.scoring_breakdown || '[]'),
    }));
}

/** Get a single lead by ID. */
export function getLeadById(id: string): Lead | null {
    const db = getDb();
    const row = db.prepare(`SELECT * FROM leads WHERE id = ?`).get(id) as any;
    if (!row) return null;
    return {
        ...row,
        tags: JSON.parse(row.tags || '[]'),
        detected_patterns: JSON.parse(row.detected_patterns || '[]'),
        recommended_agents: JSON.parse(row.recommended_agents || '[]'),
        scoring_breakdown: JSON.parse(row.scoring_breakdown || '[]'),
    };
}

/**
 * Upsert a lead (append-only logic).
 * - If the lead doesn't exist: INSERT.
 * - If the lead exists: UPDATE only fields that are empty/default, never lower a score.
 */
export function upsertLead(lead: Partial<Lead> & { id: string; name: string }): void {
    const db = getDb();
    const existing = db.prepare(`SELECT * FROM leads WHERE id = ?`).get(lead.id) as any;

    if (!existing) {
        db.prepare(`
      INSERT INTO leads (id, name, sni, industry, personnel_cost, rd_deduction, score, status, tags, potential, notes, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            lead.id,
            lead.name,
            lead.sni || '',
            lead.industry || '',
            lead.personnel_cost || '',
            lead.rd_deduction || '',
            lead.score || 0,
            lead.status || 'New',
            JSON.stringify(lead.tags || []),
            lead.potential || '',
            lead.notes || '',
            lead.source || 'manual'
        );
    } else {
        // Merge: never lower score, only fill empty fields
        const newScore = Math.max(existing.score || 0, lead.score || 0);
        const mergedTags = Array.from(new Set([
            ...JSON.parse(existing.tags || '[]'),
            ...(lead.tags || [])
        ]));

        db.prepare(`
      UPDATE leads SET
        name = COALESCE(NULLIF(?, ''), name),
        sni = COALESCE(NULLIF(?, ''), sni),
        industry = COALESCE(NULLIF(?, ''), industry),
        personnel_cost = COALESCE(NULLIF(?, ''), personnel_cost),
        rd_deduction = COALESCE(NULLIF(?, ''), rd_deduction),
        score = ?,
        status = CASE WHEN ? != '' AND ? != 'New' THEN ? ELSE status END,
        tags = ?,
        potential = COALESCE(NULLIF(?, ''), potential),
        notes = COALESCE(NULLIF(?, ''), notes),
        updated_at = datetime('now')
      WHERE id = ? AND deleted_at IS NULL
    `).run(
            lead.name,
            lead.sni || '',
            lead.industry || '',
            lead.personnel_cost || '',
            lead.rd_deduction || '',
            newScore,
            lead.status || '', lead.status || '', lead.status || '',
            JSON.stringify(mergedTags),
            lead.potential || '',
            lead.notes || '',
            lead.id
        );
    }
}

/** Soft-delete a lead (user-initiated only). */
export function softDeleteLead(id: string): boolean {
    const db = getDb();
    const result = db.prepare(
        `UPDATE leads SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND deleted_at IS NULL`
    ).run(id);
    return result.changes > 0;
}

// ── Engine runs ──────────────────────────────────────────────────────

export function startEngineRun(): number {
    const db = getDb();
    const result = db.prepare(
        `INSERT INTO engine_runs (status) VALUES ('running')`
    ).run();
    return Number(result.lastInsertRowid);
}

export function finishEngineRun(
    runId: number,
    status: 'success' | 'error',
    stats: { leads_processed: number; leads_added: number; leads_updated: number; duration_ms: number; error_message?: string; log_output?: string }
) {
    const db = getDb();
    db.prepare(`
    UPDATE engine_runs SET
      finished_at = datetime('now'),
      status = ?,
      leads_processed = ?,
      leads_added = ?,
      leads_updated = ?,
      duration_ms = ?,
      error_message = ?,
      log_output = ?
    WHERE id = ?
  `).run(
        status,
        stats.leads_processed,
        stats.leads_added,
        stats.leads_updated,
        stats.duration_ms,
        stats.error_message || null,
        stats.log_output || '',
        runId
    );
}

export function getLastEngineRun() {
    const db = getDb();
    return db.prepare(
        `SELECT * FROM engine_runs ORDER BY id DESC LIMIT 1`
    ).get() ?? null;
}

// ── Case files ───────────────────────────────────────────────────────

export function addCaseFile(leadId: string, filename: string, mimetype: string, sizeBytes: number, diskPath: string) {
    const db = getDb();
    db.prepare(`
    INSERT INTO case_files (lead_id, filename, mimetype, size_bytes, disk_path)
    VALUES (?, ?, ?, ?, ?)
  `).run(leadId, filename, mimetype, sizeBytes, diskPath);
}

export function getFilesForLead(leadId: string) {
    const db = getDb();
    return db.prepare(
        `SELECT * FROM case_files WHERE lead_id = ? ORDER BY uploaded_at DESC`
    ).all(leadId);
}

export function getTotalFileCount(): number {
    const db = getDb();
    const row = db.prepare(`SELECT COUNT(*) as count FROM case_files`).get() as any;
    return row?.count ?? 0;
}

// ── Activity log ─────────────────────────────────────────────────────

export function logActivity(level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR', message: string, source = 'system') {
    const db = getDb();
    db.prepare(
        `INSERT INTO activity_log (level, message, source) VALUES (?, ?, ?)`
    ).run(level, message, source);
}

export function getRecentActivity(limit = 20) {
    const db = getDb();
    return db.prepare(
        `SELECT * FROM activity_log ORDER BY id DESC LIMIT ?`
    ).all(limit);
}

// ── HFD Rulings ──────────────────────────────────────────────────────

export function getAllHfdRulings() {
    const db = getDb();
    return db.prepare(`SELECT * FROM hfd_rulings`).all();
}

// ── Agents ───────────────────────────────────────────────────────────

export function getAllAgents() {
    const db = getDb();
    const rows = db.prepare(`SELECT * FROM agents`).all() as any[];
    return rows.map(r => ({
        ...r,
        data_sources: JSON.parse(r.data_sources || '[]'),
        triggers: JSON.parse(r.triggers || '[]'),
        workflow_steps: JSON.parse(r.workflow_steps || '[]'),
    }));
}

// ── Detection Patterns ───────────────────────────────────────────────

export function getAllDetectionPatterns() {
    const db = getDb();
    const rows = db.prepare(`SELECT * FROM detection_patterns`).all() as any[];
    return rows.map(r => ({
        ...r,
        applicable_hfd_rulings: JSON.parse(r.applicable_hfd_rulings || '[]'),
        sni_prefixes: JSON.parse(r.sni_prefixes || '[]'),
    }));
}

// ── Stats ────────────────────────────────────────────────────────────

export function getDashboardStats() {
    const db = getDb();

    const totalLeads = (db.prepare(`SELECT COUNT(*) as c FROM leads WHERE deleted_at IS NULL`).get() as any)?.c ?? 0;
    const topScoreLeads = (db.prepare(`SELECT COUNT(*) as c FROM leads WHERE deleted_at IS NULL AND score >= 9`).get() as any)?.c ?? 0;
    const readyForAudit = (db.prepare(`SELECT COUNT(*) as c FROM leads WHERE deleted_at IS NULL AND status = 'Ready for Audit'`).get() as any)?.c ?? 0;
    const totalFiles = getTotalFileCount();
    const lastRun = getLastEngineRun();

    // Sum estimated potential (parse numbers from strings like '2.4 - 3.8 MSEK')
    const leads = db.prepare(`SELECT potential FROM leads WHERE deleted_at IS NULL`).all() as any[];
    let totalPotential = 0;
    for (const l of leads) {
        const match = l.potential?.match(/([\d.]+)/);
        if (match) totalPotential += parseFloat(match[1]);
    }

    const highConfidence = (db.prepare(`SELECT COUNT(*) as c FROM leads WHERE deleted_at IS NULL AND confidence_level = 'high'`).get() as any)?.c ?? 0;
    const detectionPatternCount = (db.prepare(`SELECT COUNT(*) as c FROM detection_patterns`).get() as any)?.c ?? 0;
    const agentCount = (db.prepare(`SELECT COUNT(*) as c FROM agents`).get() as any)?.c ?? 0;

    return {
        totalLeads,
        topScoreLeads,
        readyForAudit,
        totalFiles,
        totalPotentialMSEK: Math.round(totalPotential * 10) / 10,
        lastEngineRun: lastRun,
        highConfidenceLeads: highConfidence,
        detectionPatternCount,
        agentCount,
    };
}

export { DATA_DIR, UPLOADS_DIR, DB_PATH };
