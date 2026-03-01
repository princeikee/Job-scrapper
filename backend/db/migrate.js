import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';
import { logger } from '../server/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = await fs.readFile(schemaPath, 'utf8');
  await pool.query(sql);

  // Seed known sources once to keep scraper/source joins stable.
  await pool.query(
    `
    INSERT INTO sources (name, base_url)
    VALUES ($1, $2)
    ON CONFLICT (name) DO NOTHING
    `,
    ['RemoteOK', 'https://remoteok.com']
  );

  logger.info('Database migration completed');
  await pool.end();
}

run().catch(async (error) => {
  logger.error({ err: error }, 'Database migration failed');
  await pool.end();
  process.exit(1);
});
