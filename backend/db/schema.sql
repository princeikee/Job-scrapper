-- Drop everything first
DROP TABLE IF EXISTS job_skills;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS sources;
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS scrape_logs;

-- Create sources table
CREATE TABLE sources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  base_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create jobs table
CREATE TABLE jobs (
  id BIGSERIAL PRIMARY KEY,
  source_id INTEGER NOT NULL REFERENCES sources(id),
  title TEXT NOT NULL,
  company TEXT,
  location TEXT,
  salary TEXT,
  description TEXT,
  job_url TEXT NOT NULL UNIQUE,
  url_hash VARCHAR(64) NOT NULL UNIQUE,
  is_remote BOOLEAN NOT NULL DEFAULT FALSE,
  normalized_location TEXT,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for jobs
CREATE INDEX idx_jobs_source_id ON jobs(source_id);
CREATE INDEX idx_jobs_scraped_at ON jobs(scraped_at DESC);
CREATE INDEX idx_jobs_location ON jobs(normalized_location);
CREATE INDEX idx_jobs_remote ON jobs(is_remote);

-- Create skills table
CREATE TABLE skills (
  id SERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  normalized_name VARCHAR(80) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create job_skills table
CREATE TABLE job_skills (
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (job_id, skill_id)
);

-- Create scrape_logs table
CREATE TABLE scrape_logs (
  id BIGSERIAL PRIMARY KEY,
  source_id INTEGER REFERENCES sources(id),
  status VARCHAR(20) NOT NULL,
  jobs_found INTEGER NOT NULL DEFAULT 0,
  jobs_inserted INTEGER NOT NULL DEFAULT 0,
  jobs_updated INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  message TEXT
);

GRANT USAGE ON SCHEMA public TO jobs_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO jobs_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO jobs_app;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO jobs_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO jobs_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO jobs_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO jobs_app;
