# Backend (Production-Style Job Scraper API)

This backend is intentionally structured as modular services so each concern is isolated and easy to scale.

## Folder map and why it exists

- `server/`: app bootstrap, config, middleware, logging.  
  Why: startup and framework wiring should not be mixed with business logic.
- `routes/`: URL contracts.  
  Why: route definitions stay thin and map endpoints to controllers.
- `controllers/`: request/response handling.  
  Why: translate HTTP inputs into service calls and return API-safe outputs.
- `services/`: business logic and orchestration.  
  Why: reusable logic for jobs, scraping workflow, normalization, and logs.
- `scrapers/`: Playwright website collectors.  
  Why: scraping selectors and browser-specific behavior are isolated from APIs.
- `db/`: PostgreSQL connection and schema/migration scripts.  
  Why: schema evolution and DB setup remain explicit and repeatable.
- `analytics/`: analytics queries and skill dictionary logic.  
  Why: reporting logic is independent from CRUD endpoints.
- `scheduler/`: cron setup (`every 6 hours`).  
  Why: scheduled automation is separate from request-driven execution.

## Tech stack

- Node.js + Express
- PostgreSQL (`pg`)
- Playwright
- node-cron
- REST API

## Required environment variables

Copy `.env.example` to `.env` and update values:

```bash
NODE_ENV=development
PORT=4000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/job_scraper
SCRAPER_HEADLESS=true
SCRAPER_TIMEOUT_MS=45000
```

## Setup

```bash
cd backend
npm install
npm run migrate
npm run dev
```

## API endpoints

- `GET /jobs`
- `GET /jobs/recent`
- `GET /jobs/search?q=react`
- `GET /analytics/top-skills`
- `GET /analytics/salary-distribution`
- `GET /analytics/top-locations`
- `GET /analytics/remote-vs-onsite`
- `GET /system/status`
- `POST /scraper/run`

## Scraper behavior

- Source implemented: RemoteOK
- Normalization:
  - canonical URL cleaning
  - URL hash for duplicate prevention
  - location normalization
  - remote detection from text
- Upsert strategy:
  - dedupe by `url_hash` (`UNIQUE`)
  - update existing jobs on re-scrape
- Skills:
  - extracted from title/description/tag signals using dictionary matching
  - persisted in many-to-many (`job_skills`)

## Notes for junior engineers

- Keep controllers thin. Business logic belongs in `services/`.
- Avoid putting SQL in routes; keep data access centralized.
- Always log scrape runs (`scrape_logs`) so operations are observable.
- Build idempotent scrapers: rerunning should update records, not duplicate them.
- Use explicit schema constraints (`UNIQUE`, foreign keys) as your last safety net.
