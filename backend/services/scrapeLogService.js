import { pool } from '../db/pool.js';

export async function startScrapeLog({ sourceId }) {
  const result = await pool.query(
    `
    INSERT INTO scrape_logs (source_id, status, started_at)
    VALUES ($1, 'running', NOW())
    RETURNING id, started_at
    `,
    [sourceId]
  );
  return result.rows[0];
}

export async function finishScrapeLog({
  logId,
  status,
  jobsFound = 0,
  jobsInserted = 0,
  jobsUpdated = 0,
  message = null,
  startedAt,
}) {
  const durationMs = Math.max(0, Date.now() - new Date(startedAt).getTime());
  await pool.query(
    `
    UPDATE scrape_logs
    SET
      status = $2,
      jobs_found = $3,
      jobs_inserted = $4,
      jobs_updated = $5,
      duration_ms = $6,
      message = $7,
      finished_at = NOW()
    WHERE id = $1
    `,
    [logId, status, jobsFound, jobsInserted, jobsUpdated, durationMs, message]
  );
}

export async function getLatestScrapeLog() {
  const result = await pool.query(
    `
    SELECT sl.*, s.name AS source
    FROM scrape_logs sl
    LEFT JOIN sources s ON s.id = sl.source_id
    ORDER BY sl.started_at DESC
    LIMIT 1
    `
  );
  return result.rows[0] ?? null;
}
