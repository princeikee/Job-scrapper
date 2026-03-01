import { pool } from '../db/pool.js';

export async function getTopSkills(limit = 10) {
  const result = await pool.query(
    `
    SELECT sk.name AS skill, COUNT(*)::int AS demand
    FROM job_skills js
    JOIN skills sk ON sk.id = js.skill_id
    GROUP BY sk.name
    ORDER BY demand DESC
    LIMIT $1
    `,
    [limit]
  );
  return result.rows;
}

export async function getSalaryDistribution() {
  // Salary strings are often inconsistent; we keep a pragmatic text bucket.
  const result = await pool.query(
    `
    SELECT
      CASE
        WHEN salary IS NULL OR trim(salary) = '' THEN 'Not specified'
        WHEN salary ~* '(\\$|usd|k)' THEN 'Has numeric range'
        ELSE 'Other format'
      END AS range_bucket,
      COUNT(*)::int AS count
    FROM jobs
    GROUP BY range_bucket
    ORDER BY count DESC
    `
  );
  return result.rows;
}

export async function getTopLocations(limit = 10) {
  const result = await pool.query(
    `
    SELECT
      COALESCE(NULLIF(location, ''), 'Unknown') AS location,
      COUNT(*)::int AS jobs
    FROM jobs
    GROUP BY location
    ORDER BY jobs DESC
    LIMIT $1
    `,
    [limit]
  );
  return result.rows;
}

export async function getRemoteVsOnsiteStats() {
  const result = await pool.query(
    `
    SELECT
      SUM(CASE WHEN is_remote THEN 1 ELSE 0 END)::int AS remote_jobs,
      SUM(CASE WHEN NOT is_remote THEN 1 ELSE 0 END)::int AS onsite_jobs,
      COUNT(*)::int AS total_jobs
    FROM jobs
    `
  );
  return result.rows[0];
}
