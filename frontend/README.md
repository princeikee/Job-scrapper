# JobScraper Platform

This project contains a React frontend (`frontend/`) and a Node.js backend (`backend/`) for scraping, storing, and analyzing tech job postings.

## Structural Architecture

The system is organized in layers to keep responsibilities clear:

1. Frontend Layer (`frontend/src`)
- Landing page + dashboard UI
- Calls backend REST endpoints
- Renders jobs, analytics, health, and scraper status

2. API Layer (`backend/routes`, `backend/controllers`)
- Defines endpoint contracts (`/jobs`, `/analytics`, `/system`, `/scraper`)
- Validates input and returns structured responses

3. Business Layer (`backend/services`, `backend/analytics`)
- Normalization, deduplication, upsert logic
- Analytics calculations (skills, salary buckets, locations, remote/onsite)
- Scraper orchestration and runtime state

4. Ingestion Layer (`backend/scrapers`, `backend/scheduler`)
- Playwright scraper collects job data from sources
- `node-cron` runs scheduled scraping every 6 hours

5. Data Layer (`backend/db`)
- PostgreSQL schema + migrations
- Tables: `jobs`, `skills`, `job_skills`, `scrape_logs`, `sources`
- Indexes and constraints for performance and integrity

Data flow:

`Frontend -> REST API -> Services -> Scrapers/Scheduler -> PostgreSQL -> Analytics endpoints -> Frontend`

## Run Locally

Backend:

```bash
cd backend
npm install
npm run migrate
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run start
```

## Key Endpoints

- `GET /jobs`
- `GET /jobs/recent`
- `GET /jobs/search`
- `GET /analytics/top-skills`
- `GET /analytics/salary-distribution`
- `GET /analytics/top-locations`
- `GET /analytics/remote-vs-onsite`
- `GET /system/status`
- `POST /scraper/run`
