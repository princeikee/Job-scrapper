# JobScraper Platform

Full-stack job scraping and analytics platform.

## Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express
- Database: PostgreSQL
- Scraper: Playwright
- Scheduler: node-cron

## Project Layout

```text
projectv3/
├─ README.md
├─ frontend/
└─ backend/
```

## Features

- Scrape jobs from supported source(s)
- Normalize and store records in PostgreSQL
- Deduplicate jobs by URL hash
- Skill extraction and analytics
- REST API for dashboard
- Dashboard with:
  - Jobs list/search
  - Skills, salary, locations analytics
  - Remote vs onsite stats
  - System status
  - Run Scraper + Reset Jobs

## API Endpoints

- `GET /healthz`
- `GET /jobs`
- `GET /jobs/recent`
- `GET /jobs/search?q=...`
- `POST /jobs/reset`
- `GET /analytics/top-skills`
- `GET /analytics/salary-distribution`
- `GET /analytics/top-locations`
- `GET /analytics/remote-vs-onsite`
- `GET /system/status`
- `POST /scraper/run`

## Database Tables

- `jobs`
- `skills`
- `job_skills`
- `scrape_logs`
- `sources`

## Setup

### 1. Backend

```powershell
cd C:\Users\Princewill\Desktop\projectv3\backend
npm install
Copy-Item .env.example .env
```

Set `DATABASE_URL` in `backend/.env` to your real DB credentials:

```env
DATABASE_URL=postgres://<db_user>:<db_password>@localhost:5432/<db_name>
```

Run migration:

```powershell
npm run migrate
```

Install Playwright browser (required):

```powershell
npx playwright install chromium
```

Start backend:

```powershell
npm run dev
```

### 2. Frontend

```powershell
cd C:\Users\Princewill\Desktop\projectv3\frontend
npm install
npm run start
```

Open:

- Landing page: `http://localhost:5173/`
- Dashboard: `http://localhost:5173/job`

## Notes

- Use the Dashboard `Reset` button to clear jobs after testing (global data).
- If backend is not on port 4000, set `VITE_API_BASE_URL` for frontend.

## Common Errors

- `password authentication failed`: wrong DB credentials in `backend/.env`.
- `EADDRINUSE`: port already in use; stop old process or change backend `PORT`.
- Playwright executable missing: run `npx playwright install chromium`.
