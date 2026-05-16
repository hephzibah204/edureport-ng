# ReportSheet

ReportSheet is a school report-card system.

This repo contains:

- Frontend (static): [edureport/](edureport/)
- PHP Backend (primary, cPanel-friendly): [php-backend/](php-backend/)

## Run (Docker)

1. Copy `.env.example` to `.env` and set strong secrets.
2. Start (SQLite/local):

```bash
docker compose up --build
```

3. Open:

- Web: `http://localhost:8080/`
- API (PHP): `http://localhost:3010/`
- API Health: `http://localhost:3010/healthz`

## Notes

- Local: SQLite is used by default for speed and simplicity.
- The frontend keeps a local cache in browser storage for responsiveness, but persistence is backed by the API.
- The UI targets `ReportSheet_CONFIG.apiBaseUrl` (default points to the PHP API).

## PHP Backend (cPanel)

- Document root should point to `php-backend/public/`.
- Copy `php-backend/.env.example` to `php-backend/.env`.
- For local testing, use SQLite:
  - Set `DB_DSN=sqlite:storage/ReportSheet.sqlite`
  - Initialize once: `php php-backend/scripts/init_sqlite.php`
    - If `php-backend/.env` is not set yet, you can also run: `php php-backend/scripts/init_sqlite.php sqlite:storage/ReportSheet.sqlite`
- For production (cPanel), use MySQL/MariaDB:
  - Remove `DB_DSN` and set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`
  - Run migrations in order:
    - `php-backend/migrations/001_init.sql`
    - `php-backend/migrations/002_audit_logs.sql`
    - `php-backend/migrations/003_superadmin_powerups.sql`
    - `php-backend/migrations/004_superadmin_dashboard.sql`
    - `php-backend/migrations/005_roles_2fa_subscriptions_reports.sql`
- Set frontend `ReportSheet_CONFIG.apiBaseUrl` to your PHP API base URL.

### Admin API Docs

- Swagger UI: `/admin/docs` (requires an ADMIN session or Bearer token)
- OpenAPI JSON: `/admin/openapi.json`
- Postman collection: [docs/postman/ReportSheet-admin.postman_collection.json](docs/postman/ReportSheet-admin.postman_collection.json)
