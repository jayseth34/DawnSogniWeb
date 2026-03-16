# Dawn Sogni (React + Node + Postgres)

MVP for a Dawn Sogni clothing brand site:
- Customer-facing: brand home, drops catalog, custom design request, COD checkout (no customer login).
- Admin-only: `/admin` portal for managing drops, viewing custom requests, and managing orders + status history.
- Image uploads via ImageKit (signed uploads).

## Prereqs
- Node.js 20+
- Postgres (running locally)

## 1) Configure env\nCopy `.env.example` → `.env` and fill values.

## 2) Apply DB schema
Run the SQL schema into your local DB (example matches your env values):

```bash
psql -h localhost -p 5432 -U postgres -d rapido_delivery -f apps/api/schema.sql
```

## 3) Install deps
```bash
npm install
```

## 4) Run dev
```bash
npm run dev
```
- API: http://localhost:4000
- Web: http://localhost:5173
- Admin: http://localhost:5173/admin

## Admin login
Use the passcode from `.env` (`ADMIN_PASSCODE`).

