/**
 * server/index.ts — Express API server for OpenRevision.
 *
 * Endpoints:
 *   GET    /api/leads              – all non-deleted leads
 *   DELETE /api/leads/:id          – soft-delete a lead
 *   GET    /api/activity           – recent activity log
 *   GET    /api/engine-status      – last engine run info
 *   POST   /api/refresh            – trigger engine sync
 *   POST   /api/files/upload       – upload case file for a lead
 *   GET    /api/files/:leadId      – list files for a lead
 *   GET    /api/stats              – dashboard summary stats
 *   GET    /api/hfd-rulings        – all HFD rulings
 *   GET    /api/agents             – all agent definitions
 *
 * Run: npx tsx server/index.ts
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import {
    getAllLeads,
    getLeadById,
    softDeleteLead,
    getRecentActivity,
    getLastEngineRun,
    startEngineRun,
    finishEngineRun,
    addCaseFile,
    getFilesForLead,
    getDashboardStats,
    getAllHfdRulings,
    getAllAgents,
    getAllDetectionPatterns,
    logActivity,
    UPLOADS_DIR,
} from './db';

const app = express();
const PORT = parseInt(process.env.API_PORT || '3001', 10);

app.use(express.json());

// ── CORS (dev) ───────────────────────────────────────────────────────
app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (_req.method === 'OPTIONS') { res.sendStatus(204); return; }
    next();
});

// ── Leads ────────────────────────────────────────────────────────────

app.get('/api/leads', (_req, res) => {
    try {
        const leads = getAllLeads();
        res.json({ leads });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/leads/:id', (req, res) => {
    try {
        const success = softDeleteLead(req.params.id);
        if (success) {
            logActivity('INFO', `Lead ${req.params.id} deleted by user.`, 'user');
            res.json({ ok: true });
        } else {
            res.status(404).json({ error: 'Lead not found or already deleted' });
        }
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── Activity Log ─────────────────────────────────────────────────────

app.get('/api/activity', (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 30;
        const entries = getRecentActivity(limit);
        res.json({ entries });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── Engine Status ────────────────────────────────────────────────────

app.get('/api/engine-status', (_req, res) => {
    try {
        const lastRun = getLastEngineRun();
        res.json({ lastRun });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── Refresh (trigger engine sync) ────────────────────────────────────

let _refreshInProgress = false;

app.post('/api/refresh', (_req, res) => {
    if (_refreshInProgress) {
        res.status(409).json({ error: 'Refresh already in progress' });
        return;
    }

    _refreshInProgress = true;
    const runId = startEngineRun();
    logActivity('INFO', 'Engine sync triggered via dashboard refresh button.', 'api');
    const startTime = Date.now();

    // Run the Python sync script
    const syncScript = path.resolve(__dirname, '..', '..', 'sync_to_db.py');
    const dbPath = path.resolve(__dirname, '..', 'data', 'openrevision.db');

    execFile('python3', [syncScript, '--db', dbPath], {
        cwd: path.resolve(__dirname, '..', '..'),
        timeout: 120_000, // 2 minute timeout
    }, (error, stdout, stderr) => {
        const durationMs = Date.now() - startTime;
        const logOutput = (stdout || '') + (stderr || '');

        if (error) {
            finishEngineRun(runId, 'error', {
                leads_processed: 0,
                leads_added: 0,
                leads_updated: 0,
                duration_ms: durationMs,
                error_message: error.message,
                log_output: logOutput,
            });
            logActivity('ERROR', `Engine sync failed: ${error.message}`, 'engine');
        } else {
            // Parse output for stats
            let stats = { leads_processed: 0, leads_added: 0, leads_updated: 0 };
            try {
                const parsed = JSON.parse(stdout.trim().split('\n').pop() || '{}');
                stats = {
                    leads_processed: parsed.leads_processed || 0,
                    leads_added: parsed.leads_added || 0,
                    leads_updated: parsed.leads_updated || 0,
                };
            } catch { /* stdout wasn't JSON, that's fine */ }

            finishEngineRun(runId, 'success', {
                ...stats,
                duration_ms: durationMs,
                log_output: logOutput,
            });
            logActivity('SUCCESS', `Engine sync completed: ${stats.leads_processed} leads processed, ${stats.leads_added} added, ${stats.leads_updated} updated.`, 'engine');
        }

        _refreshInProgress = false;
    });

    // Respond immediately — the sync runs in background
    res.json({ ok: true, runId, message: 'Sync started in background' });
});

// ── File Upload ──────────────────────────────────────────────────────

// Simple multipart parser using built-in Node capabilities
// We handle the raw body to support any file type
app.post('/api/files/upload', (req, res) => {
    const contentType = req.headers['content-type'] || '';

    // Expect multipart/form-data
    if (!contentType.includes('multipart/form-data')) {
        res.status(400).json({ error: 'Expected multipart/form-data' });
        return;
    }

    // Use a simple approach: raw body collection
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
        try {
            const body = Buffer.concat(chunks);
            const boundary = contentType.split('boundary=')[1];
            if (!boundary) {
                res.status(400).json({ error: 'No boundary found' });
                return;
            }

            const parts = parseMultipart(body, boundary);
            const leadIdPart = parts.find(p => p.name === 'leadId');
            const filePart = parts.find(p => p.filename);

            if (!leadIdPart || !filePart) {
                res.status(400).json({ error: 'Missing leadId or file' });
                return;
            }

            const leadId = leadIdPart.data.toString('utf-8').trim();
            const lead = getLeadById(leadId);
            if (!lead) {
                res.status(404).json({ error: `Lead ${leadId} not found` });
                return;
            }

            // Save file to disk
            const safeFilename = `${Date.now()}_${filePart.filename!.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
            const leadDir = path.join(UPLOADS_DIR, leadId);
            fs.mkdirSync(leadDir, { recursive: true });
            const filePath = path.join(leadDir, safeFilename);
            fs.writeFileSync(filePath, filePart.data);

            // Record in DB
            const relativePath = path.relative(UPLOADS_DIR, filePath);
            addCaseFile(leadId, filePart.filename!, filePart.contentType || '', filePart.data.length, relativePath);
            logActivity('SUCCESS', `File "${filePart.filename}" uploaded for lead ${leadId}.`, 'user');

            res.json({ ok: true, filename: filePart.filename, size: filePart.data.length });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });
});

app.get('/api/files/:leadId', (req, res) => {
    try {
        const files = getFilesForLead(req.params.leadId);
        res.json({ files });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── Dashboard Stats ──────────────────────────────────────────────────

app.get('/api/stats', (_req, res) => {
    try {
        const stats = getDashboardStats();
        res.json(stats);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── HFD Rulings ──────────────────────────────────────────────────────

app.get('/api/hfd-rulings', (_req, res) => {
    try {
        const rulings = getAllHfdRulings();
        res.json({ rulings });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── Agents ───────────────────────────────────────────────────────────

app.get('/api/agents', (_req, res) => {
    try {
        const agents = getAllAgents();
        res.json({ agents });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── Detection Patterns ───────────────────────────────────────────────

app.get('/api/detection-patterns', (_req, res) => {
    try {
        const patterns = getAllDetectionPatterns();
        res.json({ patterns });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── Health ───────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Start ────────────────────────────────────────────────────────────

app.listen(PORT, () => {
    console.log(`🚀 OpenRevision API server running on http://localhost:${PORT}`);
    logActivity('INFO', `API server started on port ${PORT}.`, 'system');
});

// ── Multipart Parser (minimal, no external deps) ─────────────────────

interface MultipartPart {
    name?: string;
    filename?: string;
    contentType?: string;
    data: Buffer;
}

function parseMultipart(body: Buffer, boundary: string): MultipartPart[] {
    const parts: MultipartPart[] = [];
    const boundaryBuffer = Buffer.from(`--${boundary}`);
    const endBuffer = Buffer.from(`--${boundary}--`);

    let pos = 0;
    // Skip preamble — find first boundary
    pos = bufferIndexOf(body, boundaryBuffer, pos);
    if (pos === -1) return parts;
    pos += boundaryBuffer.length + 2; // skip boundary + \r\n

    while (pos < body.length) {
        // Check for end boundary
        if (body.subarray(pos - 2, pos - 2 + endBuffer.length).equals(endBuffer)) break;

        // Find end of headers
        const headerEnd = bufferIndexOf(body, Buffer.from('\r\n\r\n'), pos);
        if (headerEnd === -1) break;

        const headerStr = body.subarray(pos, headerEnd).toString('utf-8');
        pos = headerEnd + 4; // skip \r\n\r\n

        // Find next boundary
        const nextBoundary = bufferIndexOf(body, boundaryBuffer, pos);
        if (nextBoundary === -1) break;

        // Data is between current pos and nextBoundary - 2 (strip trailing \r\n)
        const data = body.subarray(pos, nextBoundary - 2);
        pos = nextBoundary + boundaryBuffer.length + 2; // skip boundary + \r\n

        // Parse headers
        const part: MultipartPart = { data };
        const dispositionMatch = headerStr.match(/Content-Disposition:.*?name="([^"]+)"(?:;\s*filename="([^"]+)")?/i);
        if (dispositionMatch) {
            part.name = dispositionMatch[1];
            part.filename = dispositionMatch[2];
        }
        const ctMatch = headerStr.match(/Content-Type:\s*(.+)/i);
        if (ctMatch) part.contentType = ctMatch[1].trim();

        parts.push(part);
    }

    return parts;
}

function bufferIndexOf(buf: Buffer, search: Buffer, start = 0): number {
    for (let i = start; i <= buf.length - search.length; i++) {
        if (buf.subarray(i, i + search.length).equals(search)) return i;
    }
    return -1;
}
