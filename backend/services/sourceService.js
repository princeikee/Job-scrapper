import { pool } from '../db/pool.js';

const sourceCache = new Map();

export async function getSourceByName(name) {
  if (sourceCache.has(name)) {
    return sourceCache.get(name);
  }

  const result = await pool.query('SELECT id, name, base_url FROM sources WHERE name = $1 LIMIT 1', [
    name,
  ]);

  if (result.rowCount === 0) {
    return null;
  }

  sourceCache.set(name, result.rows[0]);
  return result.rows[0];
}

export async function getOrCreateSource({ name, baseUrl = null }) {
  const existing = await getSourceByName(name);
  if (existing) return existing;

  const created = await pool.query(
    `
    INSERT INTO sources (name, base_url)
    VALUES ($1, $2)
    ON CONFLICT (name)
    DO UPDATE SET base_url = COALESCE(sources.base_url, EXCLUDED.base_url)
    RETURNING id, name, base_url
    `,
    [name, baseUrl]
  );

  sourceCache.set(name, created.rows[0]);
  return created.rows[0];
}
