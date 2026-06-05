# Keddy CRM — Node.js + PostgreSQL Backend

This is the **Node.js/Express + PostgreSQL** API for Keddy CRM. The React frontend (`frontend/`) stays unchanged and continues to call `http://localhost:8000`.

## Stack

- **Express** — HTTP API (same URL paths as Django)
- **PostgreSQL + Sequelize** — database
- **JWT** — authentication (`Authorization: Bearer <access>`)
- **Multer** — file uploads to `media/` (same folder layout as Django)

## Folder structure

```
backend/
├── src/
│   ├── config/          # env, DB connection
│   ├── models/          # Sequelize schemas + wrappers (User, Vendor, Client, …)
│   ├── middleware/      # auth, file upload
│   ├── controllers/     # route handlers by domain
│   ├── routes/          # Express routers (mirror Django url prefixes)
│   ├── services/        # resume parser, etc.
│   ├── utils/           # company scope, pagination, formatters
│   ├── app.js
│   └── server.js
├── media/               # uploaded files
├── .env
└── package.json
```

## Quick start

### 1. PostgreSQL

Create a database (example using `psql`):

```sql
CREATE DATABASE keddy_crm;
```

Copy `.env.example` to `.env` and set `DATABASE_URL`:

```
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@127.0.0.1:5432/keddy_crm
```

On first run, `DB_SYNC=true` (default) creates/updates tables automatically via Sequelize.

### 2. Install & run

```bash
cd backend
cp .env.example .env   # if .env missing
npm install
npm run dev
```

API: **http://localhost:8000**

### 3. React frontend

```bash
cd ../frontend
npm start
```

`frontend/src/services/api.jsx` already uses `API_BASE = "http://localhost:8000"`.

## API prefixes (unchanged)

| Prefix | Module |
|--------|--------|
| `/api/login/`, `/api/register/` | Auth |
| `/employee-portal/` | Vendors, clients, candidates, dashboard |
| `/sub-admin/` | Company admin |
| `/jd-mapping/` | Requirements / JDs |
| `/invoice/` | Invoicing & finance |
| `/attendance/` | Check-in, reports |
| `/calendar/` | Google Calendar (stub) |

## Notes

- **Numeric IDs**: Tables use auto-increment `id` counters (not serial UUIDs) so the React app’s `/candidates/123/` URLs keep working.
- **MongoDB data**: Existing MongoDB data is not auto-imported. Export and migrate manually if needed.
- **Google Calendar & PDF**: Calendar routes are stubs; invoice PDF writes a simple HTML file.

## Scripts

- `npm run dev` — nodemon
- `npm start` — production
