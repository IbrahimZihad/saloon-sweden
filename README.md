# Salong Sweden — Premium Salon Website & Booking System

A complete, production-ready website for a Swedish salon with integrated online
appointment booking and a full admin management dashboard. This is a fully
functional, database-driven commercial application — not a static site or UI
prototype.

- **Public site:** homepage, services & pricing, 6-step booking wizard, contact,
  gallery, testimonials, opening hours, map, privacy policy and terms.
- **Booking engine:** opening-hours-, duration-, staff-schedule-, break-, holiday-
  and time-off-aware availability; concurrency-safe double-booking prevention;
  backend revalidation of every booking; DST-correct `Europe/Stockholm` time.
- **Admin:** dashboard with statistics and charts, appointment table + calendar,
  manual/phone bookings, confirm/reschedule/cancel/complete/no-show, services,
  categories, staff, customers, testimonials, gallery, messages and business
  settings. New online bookings raise a live toast in the admin panel and are
  read aloud in Swedish ("Ny bokning med {stylist}") through browser speech
  synthesis; sound can be muted per browser.
- **Auth:** `ADMIN` / `STAFF` roles, bcrypt password hashing, JWT in HTTP-only
  cookies, RBAC, password reset and global rate limiting. Customers book **without**
  an account.
- **Email:** configurable SMTP with confirmation, cancellation, reschedule and
  reminder messages. **Bookings never fail because email is unavailable** — sends
  are queued, logged, retried and de-duplicated in the database.
- **Localization & GDPR:** Swedish default, English secondary, SEK, 24-hour clock,
  cookie consent, privacy/terms pages, and admin data export / erasure.

> No Docker, Docker Compose or Dockerfiles are used anywhere. MySQL runs locally
> and the frontend and backend are separate applications communicating over REST.

---

## 1. Tech stack

| Layer     | Technology                                                            |
| --------- | --------------------------------------------------------------------- |
| Frontend  | Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Lucide React · React Hook Form · Zod · Recharts |
| Backend   | Node.js · Express 5 · TypeScript · REST · JWT (HTTP-only cookie) · Swagger UI |
| Database  | **MySQL 8.0+** · Sequelize ORM 6 (`sequelize-typescript`) · model-driven schema sync |
| Email     | Nodemailer (SMTP) · database-backed queue with retries                  |
| Testing   | Jest + Supertest (backend, isolated test DB) · Vitest + Testing Library (frontend) · Playwright (browser e2e) |

---

## 2. Repository layout

```
saloon-sweden/
├── backend/                 # Express REST API (port 3001, prefix /api)
│   ├── src/
│   │   ├── main.ts          # Node.js process bootstrap and graceful shutdown
│   │   ├── app.ts           # Express middleware, API routes, validation and error handling
│   │   ├── database/        # Sequelize connection, 18 models, seeders, sync/seed scripts
│   │   └── <domains>/       # auth, appointments, availability, services, categories, staff,
│   │                        # customers, dashboard, settings, business-hours, content,
│   │                        # notifications, uploads, users, config, common
│   ├── test/                # integration + seeder-idempotency specs (isolated test DB)
│   └── certs/               # optional CA certificate for managed MySQL (git-ignored)
├── frontend/                # Next.js App Router (port 3000)
│   ├── src/
│   │   ├── app/             # (public) route group + admin/(dashboard) route group
│   │   ├── components/      # booking wizard, admin views, UI, providers, layout
│   │   └── lib/             # api client, types, i18n (sv/en), format, zod schemas
│   ├── e2e/                 # Playwright browser tests
│   ├── playwright.config.ts
│   └── .env.example
├── package.json             # root orchestration scripts
└── README.md
```

The frontend proxies `/api/*` and `/uploads/*` to the backend via Next.js rewrites
(`next.config.ts`), so the browser only ever talks to the frontend origin.

---

## 3. Prerequisites

- **Node.js ≥ 20.19.0** and npm
- **MySQL 8.0+** running locally (no Docker)
- A free port for the backend (default **3001**) and frontend (default **3000**)

---

## 4. Quick start

### 4.1 Create the MySQL database

Connect to your local MySQL server and create a database with the correct charset:

```sql
CREATE DATABASE salon_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- Optional: a separate database for automated tests (never use production data)
CREATE DATABASE salon_booking_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4.2 Configure environment

```bash
# Backend
cp backend/.env.example backend/.env
# Frontend
cp frontend/.env.example frontend/.env.local
```

Edit `backend/.env` and set at least:

- `DATABASE_URL` — your MySQL connection string, e.g.
  `mysql://root:your_password@localhost:3306/salon_booking`
- `TEST_DATABASE_URL` — a **separate** database for tests, e.g.
  `mysql://root:your_password@localhost:3306/salon_booking_test`
- `JWT_SECRET` — generate a strong secret:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` — the initial admin account
  (created by the seeder **only if it does not already exist**).

> Never commit `.env` or `.env.local`. Only the `.env.example` templates are tracked.

### 4.3 Install dependencies

```bash
npm --prefix backend install
npm --prefix frontend install
```

### 4.4 Create the schema and seed

```bash
npm --prefix backend run db:sync   # create any missing tables from the Sequelize models
npm --prefix backend run db:seed   # idempotent seed (safe to re-run)
```

### 4.5 Run both apps (development)

From the repository root, in two terminals:

```bash
npm run dev:backend     # Express API watch mode → http://localhost:3001/api
npm run dev:frontend    # Next.js dev      → http://localhost:3000
```

Open **http://localhost:3000**. API docs: **http://localhost:3001/api/docs**.

---

## 5. Environment variables

### Backend (`backend/.env`)

| Variable | Purpose | Default / example |
| --- | --- | --- |
| `NODE_ENV` | `development` / `production` / `test` | `development` |
| `PORT` | API listen port | `3001` |
| `DATABASE_URL` | MySQL connection string (Sequelize) | `mysql://root:pass@localhost:3306/salon_booking` |
| `TEST_DATABASE_URL` | Isolated database for automated tests | `mysql://root:pass@localhost:3306/salon_booking_test` |
| `JWT_SECRET` | Secret for signing JWTs | random 48-byte hex |
| `JWT_EXPIRES_IN` | Token lifetime | `1d` |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Initial admin (seeder) | — |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:3000` |
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_SECURE` | SMTP server (optional) | empty / `587` / `false` |
| `EMAIL_USER` / `EMAIL_PASSWORD` | SMTP credentials (optional) | empty |
| `EMAIL_FROM` | From header | `Salon <no-reply@example.com>` |
| `UPLOAD_DIRECTORY` | Image upload dir (relative to `backend/` or absolute) | `uploads` |
| `DATABASE_CA_CERT` | Inline PEM of the MySQL CA (optional; alternative to `ssl-ca`) | — |
| `SEED_DEMO` | Seed fictional customers/appointments | `false` |
| `STAFF_DEMO_PASSWORD` | Password for fictional staff logins | `StaffDemo123!` |

### Frontend (`frontend/.env.local`)

| Variable | Purpose | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Browser-facing API base | `/api` (proxied) |
| `API_INTERNAL_URL` | Server-side proxy target (Next rewrites + SSR) | `http://localhost:3001` |

---

## 6. Database, migrations & seeding

### Schema (model-driven sync)

The schema lives in `backend/src/database/models/` as Sequelize model classes
(`sequelize-typescript`). `npm --prefix backend run db:sync` calls
`sequelize.sync()`, which creates any missing tables and foreign keys. Existing
tables are left untouched, so it is safe on every deploy.

```bash
npm --prefix backend run db:sync                    # create missing tables/indexes
DB_SYNC_ALTER=true npm --prefix backend run db:sync # also reconcile column changes (dev/staging)
```

Table and column names (`User`, `Customer`, `Appointment`, … camelCase columns)
are unchanged from the previous ORM, so an existing database can be reused as-is.

### Seeding (idempotent)

`npm --prefix backend run db:seed` runs `src/database/seed.ts`. Every seeder
checks for existing records and **never overwrites** them, so it is safe to re-run
at any time:

- **Admin** — created from `ADMIN_EMAIL` / `ADMIN_PASSWORD` only if absent. An
  existing admin's password is **never** overwritten by re-seeding.
- **Business settings** — singleton with demo contact details, `Europe/Stockholm`,
  `SEK`, Swedish default language, booking interval/notice/advance window.
- **Business hours** — Mon–Fri 09–18, Thu 09–20, Sat 10–16, Sun closed.
- **Categories & services** — 5 categories, 10 sample services (SEK prices).
- **Staff** — 3 stylists with qualified services, working hours and lunch breaks.
- **Testimonials** — 3 fictional samples.

Demo mode (fictional customers and appointments):

```bash
npm --prefix backend run db:seed:demo       # sets SEED_DEMO=true
```

Demo staff logins (password = `STAFF_DEMO_PASSWORD`): `anna@example.com`,
`emma@example.com`, `sofia@example.com`. The admin login is whatever you set in
`ADMIN_EMAIL` / `ADMIN_PASSWORD`.

### Fresh-database demonstration (verified)

The complete create → sync → seed → run cycle was verified against a brand-new
database. To reproduce (substitute your own credentials/port):

```bash
# 1. Create a fresh database
mysql -u root -p -e "CREATE DATABASE salon_booking_fresh CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Create the schema + seed against it (inline DATABASE_URL overrides .env)
cd backend
DATABASE_URL="mysql://root:pass@localhost:3306/salon_booking_fresh" npx tsx src/database/sync.ts
DATABASE_URL="mysql://root:pass@localhost:3306/salon_booking_fresh" npx tsx src/database/seed.ts

# 3. Run the API against the fresh database
DATABASE_URL="mysql://root:pass@localhost:3306/salon_booking_fresh" PORT=3002 node dist/main.js
#   → GET http://localhost:3002/api/health      => {"status":"ok","database":"connected"}
#   → GET http://localhost:3002/api/public/settings  => seeded salon settings
```

---

## 7. Running in production (local build)

```bash
npm run build                              # builds backend (dist/) and frontend (.next/)
npm --prefix backend run start:prod        # node dist/main.js  → :3001
npm --prefix frontend run start            # next start         → :3000
```

Set `NODE_ENV=production`, a strong `JWT_SECRET`, the real `DATABASE_URL`, and
`FRONTEND_URL=https://your-domain` before going live. See §11 for process managers,
reverse proxy and TLS.

---

## 8. Testing

All backend tests run against the **separate** `TEST_DATABASE_URL` database — never
production data. The test harness creates the test database and recreates the
schema from the Sequelize models (`sync({ force: true })`) before each suite, then
seeds it automatically.

```bash
# Backend: unit + integration (auth, RBAC, availability, booking, 5-way concurrency,
# cancel/reschedule, status transitions, reference lookup, schema sync, seeder idempotency)
npm run test:backend            # = jest --runInBand  (backend/)
npm --prefix backend run test:cov

# Frontend: unit + component tests (Vitest + Testing Library)
npm run test:frontend           # = vitest run  (frontend/)

# Browser end-to-end (Playwright): public booking flow, admin login + dashboard,
# and unauthenticated redirect. Requires both apps running.
cd frontend
npx playwright install chromium   # one-time browser download
npm run test:e2e
```

The Playwright config reuses already-running servers on `:3000` / `:3001` (or starts
them). Admin e2e credentials are read from `backend/.env` **inside the test process**
and are never logged.

> The booking e2e creates a real appointment against the running stack (customer
> “E2E Testkund”). It picks the first available slot, so it is re-runnable.

---

## 9. Email / SMTP configuration

Email is **optional**. If SMTP is not configured, bookings still succeed and the
notification is recorded as skipped/failed in the database.

Set `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASSWORD` and
`EMAIL_FROM` in `backend/.env`. The notifications module:

- queues confirmation / cancellation / reschedule messages per appointment,
- sends a daily reminder at **08:00 `Europe/Stockholm`** for the next day's visits,
- retries pending sends every **5 minutes** up to a maximum attempt count,
- de-duplicates by appointment + type and records status, attempts, `sentAt` and
  `lastError` in the `EmailNotification` table.

---

## 10. Booking engine, time & security

### Availability & concurrency

- Availability is computed from business hours, per-staff working hours, breaks,
  time-off, service duration, existing appointments, the configured slot interval,
  minimum booking notice and maximum advance window.
- Every booking is **revalidated server-side** inside a Sequelize transaction
  (`READ COMMITTED`). A per-staff/per-day `StaffScheduleLock` row is created and
  locked with `SELECT ... FOR UPDATE` (MySQL row-level locking) before the overlap
  check, so concurrent requests cannot double-book. Unique constraints provide a
  final safety net; conflicts return HTTP `409`.
- Statuses: `PENDING → CONFIRMED → COMPLETED`, plus `CANCELLED` and `NO_SHOW`.
  Cancelling frees the time slot; completed/no-show are terminal.
- Money is stored as `DECIMAL` and serialized to strings. Appointments keep
  historical service snapshots (`AppointmentService`), so later price/name changes
  never alter past bookings.

### Time zones

All instants are stored in **UTC** and rendered in `Europe/Stockholm` with correct
DST handling (`date-fns-tz`). The UI uses a 24-hour clock. Weekdays are indexed
`0 = Monday … 6 = Sunday`; business hours are minutes-since-midnight.

### Auth & security

- bcrypt password hashing; JWT stored in the `salon_token` **HTTP-only** cookie
  (`sameSite=lax`, `secure` in production, 24 h). **Production must be served over
  HTTPS** because the cookie is `secure`.
- RBAC with `ADMIN` / `STAFF` roles; admin-only routes (e.g. user management,
  customer export/erasure) reject `STAFF`.
- Global and endpoint-specific rate limiting (`express-rate-limit`), `helmet`,
  strict CORS (`FRONTEND_URL`, credentials), and DTO validation
  (`whitelist`, `forbidNonWhitelisted`, `transform`).
- Password reset via `POST /api/auth/forgot-password` and `POST /api/auth/reset-password`.

### GDPR

Cookie-consent banner, privacy policy and terms pages. Admin-only customer data
export (`GET /api/admin/customers/:id/export`) and erasure
(`DELETE /api/admin/customers/:id`, anonymizes personal data).

---

## 11. Production deployment without Docker

The two apps run as ordinary Node processes behind a reverse proxy.

### 11.1 Build & migrate

```bash
npm ci --prefix backend && npm ci --prefix frontend
npm run build
npm --prefix backend run db:sync
npm --prefix backend run db:seed        # idempotent; creates admin only if absent
```

### 11.2 Process manager (PM2 example)

```bash
npm install -g pm2
pm2 start dist/main.js --name salon-api --cwd backend   # env from backend/.env
pm2 start npm --name salon-web --cwd frontend -- start
pm2 save && pm2 startup
```

Or use `systemd` services running `node dist/main.js` (backend) and `next start`
(frontend) with the appropriate working directories and environment files.

### 11.3 Reverse proxy + TLS (Nginx example)

The Next.js app already rewrites `/api/*` and `/uploads/*` to the backend
(`API_INTERNAL_URL`), so a single upstream works:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.se;
    # ssl_certificate / ssl_certificate_key ... (e.g. Let's Encrypt)

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Optionally route `/api/` and `/uploads/` directly to `127.0.0.1:3001` for efficiency.
Set `FRONTEND_URL=https://your-domain.se` and `NODE_ENV=production` so CORS and the
`secure` cookie are correct. Caddy is a simple alternative that automates TLS.

### 11.4 Uploads & persistence

Uploaded images live in `backend/uploads/` (served at `/uploads/`). Persist this
directory across deploys (it is git-ignored) and include it in backups.

### 11.5 Managed hosting (Aiven + Render + Vercel)

- **Database (Aiven MySQL):** set `DATABASE_URL` to the service URI. For TLS,
  download the provider CA to `backend/certs/ca.pem` and add `sslcert=./certs/ca.pem`
  (relative to `backend/`) plus `sslaccept=strict` to the URL, for example:
  `mysql://avnadmin:PASSWORD@host:PORT/defaultdb?ssl-mode=REQUIRED&sslcert=./certs/ca.pem&sslaccept=strict`.
  `backend/certs/` is git-ignored — upload the certificate through your host's
  secret/file mechanism instead of committing it.
- **Backend (Render):** set **Root Directory** to `backend`, **Build Command** to
  `npm ci --include=dev && npm run build`, and **Start Command** to
  `npm run start:render` (runs `db:sync`, `db:seed`, then `node dist/main.js`).
  `--include=dev` is required because `NODE_ENV=production` makes npm skip
  TypeScript build and database-script tools. `start:render` uses the compiled
  `dist/database/*.js` scripts, so it does not need `tsx` at runtime.
  Set `NODE_ENV=production`, `FRONTEND_URL=https://your-vercel-domain`, a strong
  `JWT_SECRET`, and SMTP variables if email is enabled. Use a persistent disk (for
  example mounted at `/var/data`) and set `UPLOAD_DIRECTORY=/var/data/uploads`
  (absolute paths are supported), otherwise uploaded images disappear on redeploy.
  Because `backend/certs/` is git-ignored, supply Aiven's CA to the running app via
  `DATABASE_CA_CERT` (paste the PEM contents, using `\n` for newlines) and connect
  with `ssl-mode=VERIFY_CA`; `ssl-mode=REQUIRED` alone encrypts without verifying.
- **Frontend (Vercel):** keep `NEXT_PUBLIC_API_URL=/api` and point
  `API_INTERNAL_URL` at the public Render backend URL. Set
  `NEXT_PUBLIC_SITE_URL` to the canonical production website URL (for example,
  `https://your-domain.se`) so Open Graph image URLs use the correct origin;
  Vercel's `VERCEL_URL` is used as a fallback for previews. The existing Next.js
  rewrites proxy `/api/*` and `/uploads/*`, so no separate CORS setup is needed in
  the browser.
- **Scheduled work:** reminder and retry crons run in-process. Render free
  instances spin down when idle, which pauses them; use an always-on instance for
  reliable email reminders.

---

## 12. Backup & restore

```bash
# Backup (schema + data)
mysqldump -u root -p --databases salon_booking > salon_booking_$(date +%F).sql

# Restore
mysql -u root -p < salon_booking_2026-11-07.sql
```

Also back up `backend/uploads/`. Because the schema is defined in code, a fresh
server can be rebuilt with `db:sync` + `db:seed`, then restored data loaded on top.

---

## 13. API documentation

- **Swagger UI:** `http://localhost:3001/api/docs`
- **Health / liveness:** `GET /api/health` → `{ status: "ok", database: "connected" }`
- Public endpoints are prefixed `public/` (settings, services, categories, staff,
  availability, appointments, contact, content). Admin endpoints are prefixed
  `admin/` and guarded by JWT + RBAC. Auth endpoints live under `auth/`.

---

## 14. Verification status

This workspace was previously verified end-to-end:

- **Backend:** 73 Jest tests across 5 suites pass against the isolated
  `salon_booking_test` database (time/DST utils, booking reference, auth/RBAC,
  availability, booking, 5-way concurrency, cancel/reschedule, status transitions,
  reference lookup, search, schema sync and seeder idempotency, admin-password
  preservation).
- **Frontend:** 41 Vitest unit/component tests pass; 3 Playwright browser e2e tests
  pass (booking flow → confirmation reference, admin login → dashboard,
  unauthenticated redirect).
- **Builds:** backend `tsc -p tsconfig.build.json` and frontend `next build` succeed.
- **Live:** both apps run; a browser booking was created and confirmed persisted in
  MySQL with a DST-correct UTC instant (`10:00 Stockholm` → `09:00Z` in winter).
- **Fresh DB:** create → sync → seed → run verified on a brand-new database.

---

## 15. Notes & troubleshooting

- **Local MySQL in this workspace:** a local MySQL 8.0 instance runs on port **3307**
  with `utf8mb4` / `utf8mb4_unicode_ci` and UTC default time zone (see `.mysql.cnf`).
  Adjust `DATABASE_URL` / `TEST_DATABASE_URL` accordingly. The `mysqldata/`
  directory is git-ignored.
- **Table-name casing:** Windows MySQL commonly uses `lower_case_table_names=1`;
  Aiven (Linux) preserves the PascalCase names. The test schema check therefore
  compares table names case-insensitively.
- **Schema changes:** `db:sync` only creates missing tables. Use
  `DB_SYNC_ALTER=true npm run db:sync` in development/staging to add new columns
  and indexes to existing tables; review the generated DDL before production.
- **Demo contact details:** the seeded address/phone/email are realistic demo values.
  Replace them in **Admin → Settings** before going live.