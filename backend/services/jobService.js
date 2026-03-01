import { withTransaction, pool } from '../db/pool.js';
import {
  buildUrlHash,
  canonicalJobUrl,
  detectRemote,
  normalizeLocation,
} from './normalizationService.js';
import { extractSkills } from './skillExtractorService.js';

async function upsertSkill(client, skillName) {
  const normalized = skillName.trim().toLowerCase();
  const skillResult = await client.query(
    `
    INSERT INTO skills (name, normalized_name)
    VALUES ($1, $2)
    ON CONFLICT (normalized_name)
    DO UPDATE SET name = EXCLUDED.name
    RETURNING id
    `,
    [skillName, normalized]
  );

  return skillResult.rows[0].id;
}

export async function upsertJobsFromSource(sourceId, jobs) {
  return withTransaction(async (client) => {
    let inserted = 0;
    let updated = 0;

    for (const job of jobs) {
      const jobUrl = canonicalJobUrl(job.jobUrl);
      const urlHash = buildUrlHash(jobUrl);
      const normalizedLocation = normalizeLocation(job.location);
      const isRemote = detectRemote(job.location, job.description);
      const skills = extractSkills({
        title: job.title,
        description: job.description,
        explicitSkills: job.skills ?? [],
      });

      const result = await client.query(
        `
        INSERT INTO jobs (
          source_id, title, company, location, salary, description, job_url, url_hash, is_remote, normalized_location, scraped_at, updated_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())
        ON CONFLICT (url_hash)
        DO UPDATE SET
          title = EXCLUDED.title,
          company = EXCLUDED.company,
          location = EXCLUDED.location,
          salary = EXCLUDED.salary,
          description = EXCLUDED.description,
          is_remote = EXCLUDED.is_remote,
          normalized_location = EXCLUDED.normalized_location,
          updated_at = NOW(),
          scraped_at = NOW()
        RETURNING id, (xmax = 0) AS inserted
        `,
        [
          sourceId,
          job.title,
          job.company || null,
          job.location || null,
          job.salary || null,
          job.description || null,
          jobUrl,
          urlHash,
          isRemote,
          normalizedLocation || null,
        ]
      );

      const jobRow = result.rows[0];
      if (jobRow.inserted) inserted += 1;
      else updated += 1;

      const jobId = jobRow.id;
      await client.query('DELETE FROM job_skills WHERE job_id = $1', [jobId]);

      for (const skill of skills) {
        const skillId = await upsertSkill(client, skill);
        await client.query(
          `
          INSERT INTO job_skills (job_id, skill_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
          `,
          [jobId, skillId]
        );
      }
    }

    return { inserted, updated };
  });
}

export async function getJobs({ page = 1, limit = 20, source, location, remote }) {
  const offset = (page - 1) * limit;
  const values = [];
  const where = [];

  if (source) {
    values.push(source);
    where.push(`s.name = $${values.length}`);
  }
  if (location) {
    values.push(`%${location.toLowerCase()}%`);
    where.push(`j.normalized_location LIKE $${values.length}`);
  }
  if (typeof remote === 'boolean') {
    values.push(remote);
    where.push(`j.is_remote = $${values.length}`);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  values.push(limit);
  values.push(offset);

  const query = `
    SELECT
      j.id,
      j.title,
      j.company,
      j.location,
      j.salary,
      j.job_url,
      j.scraped_at,
      j.is_remote,
      s.name AS source,
      COALESCE(array_agg(DISTINCT sk.name) FILTER (WHERE sk.name IS NOT NULL), '{}') AS skills
    FROM jobs j
    JOIN sources s ON s.id = j.source_id
    LEFT JOIN job_skills js ON js.job_id = j.id
    LEFT JOIN skills sk ON sk.id = js.skill_id
    ${whereClause}
    GROUP BY j.id, s.name
    ORDER BY j.scraped_at DESC
    LIMIT $${values.length - 1} OFFSET $${values.length}
  `;

  try {
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    // Compatibility fallback for legacy DBs where job_skills schema differs.
    if (error.code === '42703' || error.code === '42P01') {
      const fallbackQuery = `
        SELECT
          j.id,
          j.title,
          j.company,
          j.location,
          j.salary,
          j.job_url,
          j.scraped_at,
          j.is_remote,
          s.name AS source,
          '{}'::text[] AS skills
        FROM jobs j
        JOIN sources s ON s.id = j.source_id
        ${whereClause}
        ORDER BY j.scraped_at DESC
        LIMIT $${values.length - 1} OFFSET $${values.length}
      `;
      const fallback = await pool.query(fallbackQuery, values);
      return fallback.rows;
    }
    throw error;
  }
}

export async function getRecentJobs(limit = 20) {
  return getJobs({ page: 1, limit });
}

export async function searchJobs(query, limit = 20) {
  const result = await pool.query(
    `
    SELECT
      j.id, j.title, j.company, j.location, j.salary, j.job_url, j.scraped_at, s.name AS source
    FROM jobs j
    JOIN sources s ON s.id = j.source_id
    WHERE
      j.title ILIKE $1 OR
      j.company ILIKE $1 OR
      j.description ILIKE $1
    ORDER BY j.scraped_at DESC
    LIMIT $2
    `,
    [`%${query}%`, limit]
  );
  return result.rows;
}

export async function resetJobsData() {
  // Keep source definitions and logs, clear only scraped job records.
  const result = await pool.query('DELETE FROM jobs');
  return {
    deletedJobs: result.rowCount ?? 0,
  };
}
