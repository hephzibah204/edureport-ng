# EduReport NG — cPanel Deployment Guide

This guide walks you through deploying EduReport NG on a cPanel shared hosting server.

## Prerequisites

- cPanel account with **PHP 8.0+** (8.2+ recommended)
- **MySQL/MariaDB** database (created via cPanel MySQL Database Wizard)
- **PHP Extensions** required:
  - `pdo_mysql` (for MySQL) or `pdo_sqlite` (for SQLite)
  - `sodium` (for encryption — enabled by default on PHP 7.2+)
  - `mbstring`
  - `json`
  - `curl`
- **Optional**: `proc_open` enabled in `php.ini` (for PDF generation via headless browser)

## Directory Structure on cPanel

After deployment, your `public_html/` should look like this:

```
public_html/
├── .htaccess              ← Combined rewrite rules (from .htaccess)
├── index.html             ← Landing page
├── login.html
├── register.html
├── app.html
├── admin.html
├── teacher.html
├── portal.html
├── exammaker.html
├── shared.css
├── auth.js
├── config.js
├── adminpanel/
│   ├── bootstrap.html
│   └── login/
│       └── index.html
├── api/                   ← API entry point
│   ├── .htaccess          ← Backend router (from deploy/cpanel/api/.htaccess)
│   └── index.php          ← Modified API entry (from deploy/cpanel/api/index.php)
└── backend/               ← Backend source (protected by .htaccess)
    ├── .htaccess          ← Deny from all (from deploy/cpanel/backend/.htaccess)
    ├── .env               ← Your configuration (NEVER commit this)
    ├── src/               ← All PHP source files
    ├── storage/           ← Writable: SQLite, logs, reports, rate limits
    ├── migrations/        ← SQL migration files
    └── scripts/           ← Init scripts
```

## Step-by-Step Deployment

### 1. Upload Files

Upload the following to your cPanel `public_html/` directory:

| Source | Destination |
|---|---|
| `index.html`, `login.html`, `register.html`, `app.html`, `admin.html`, `teacher.html`, `portal.html`, `exammaker.html` | `public_html/` |
| `shared.css`, `auth.js`, `config.js` | `public_html/` |
| `adminpanel/` | `public_html/adminpanel/` |
| `deploy/cpanel/api/index.php` | `public_html/api/index.php` |
| `deploy/cpanel/api/.htaccess` | `public_html/api/.htaccess` |
| `php-backend/src/` | `public_html/backend/src/` |
| `php-backend/storage/` (empty dirs) | `public_html/backend/storage/` |
| `php-backend/migrations/` | `public_html/backend/migrations/` |
| `php-backend/scripts/` | `public_html/backend/scripts/` |
| `.htaccess` (root) | `public_html/.htaccess` |
| `deploy/cpanel/backend/.htaccess` | `public_html/backend/.htaccess` |

**Do NOT upload:**
- `php-backend/.env` (create it fresh on the server)
- `php-backend/storage/*.sqlite` (will be created or use MySQL)
- `php-backend/storage/ratelimit/` contents
- `php-backend/storage/reports/` contents
- `backend/` (TypeScript backend — already removed)

### 2. Create MySQL Database

1. In cPanel, go to **MySQL Database Wizard**
2. Create a new database (e.g., `username_edureport`)
3. Create a database user with a strong password
4. Grant **ALL PRIVILEGES** to the user on the database
5. Note the database name, username, and password

### 3. Configure `.env`

Create `public_html/backend/.env` with your production values:

```env
# Database (MySQL)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=your_cpanel_db_name
DB_USER=your_cpanel_db_user
DB_PASS=your_cpanel_db_password

# Super Admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YourStrongPassword123+

# Encryption (generate a new key!)
# Run: php -r "echo base64_encode(random_bytes(32));"
ENCRYPTION_KEY=your_generated_base64_key_here

# UI Redirects (relative paths for same-origin)
ADMIN_UI_URL=/adminpanel/bootstrap.html
SCHOOL_UI_URL=/app.html

# CORS
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# Public API URL (leave empty for same-origin)
PUBLIC_API_URL=

# AI (optional)
AI_ENABLED=false

# PDF (disable on shared hosting if Chrome/Edge not available)
PDF_RENDERER=edge
PDF_BROWSER_BIN=msedge

# SMS (optional)
SMS_PROVIDER=
TERMII_API_KEY=

# Support
SUPPORT_WHATSAPP=2348037000456
SUPPORT_EMAIL=support@yourdomain.com

# Production
DEBUG=false
REPORT_EXPORT_TTL_DAYS=30
```

### 4. Set Directory Permissions

Via SSH or cPanel File Manager, set these permissions:

```bash
chmod 755 backend/storage/
chmod 755 backend/storage/ratelimit/
chmod 755 backend/storage/reports/
chmod 755 backend/storage/tmp/
chmod 640 backend/.env
```

### 5. Run Database Migrations

Run these SQL files in order via **phpMyAdmin** or SSH:

1. `backend/migrations/001_init.sql`
2. `backend/migrations/002_audit_logs.sql`
3. `backend/migrations/003_superadmin_powerups.sql`
4. `backend/migrations/004_superadmin_dashboard.sql`
5. `backend/migrations/005_roles_2fa_subscriptions_reports.sql`
6. `backend/migrations/006_more_gateways.sql`
7. `backend/migrations/006_portal_attendance_students.sql`
8. `backend/migrations/007_payvessel_gateway.sql`
9. `backend/migrations/008_exam_maker.sql`
10. `backend/migrations/009_plans_and_keys.sql`
11. `backend/migrations/010_school_level.sql`
12. `backend/migrations/011_report_extras.sql`
13. `backend/migrations/012_report_exports.sql`
14. `backend/migrations/013_class_templates.sql`
15. `backend/migrations/014_teachers.sql`
16. `backend/migrations/015_teacher_role_and_school_id.sql`
17. `backend/migrations/016_school_subdomain.sql`
18. `backend/migrations/017_background_jobs.sql`
19. `backend/migrations/018_school_admin_role.sql`

**Via phpMyAdmin:**
1. Open phpMyAdmin → select your database
2. Click **SQL** tab
3. Copy-paste each file's contents and click **Go**
4. Repeat for all 19 files in order

**Via SSH (if available):**
```bash
cd ~/public_html/backend
mysql -u your_cpanel_db_user -p your_cpanel_db_name < migrations/001_init.sql
mysql -u your_cpanel_db_user -p your_cpanel_db_name < migrations/002_audit_logs.sql
# ... repeat for all files
```

### 6. Verify PHP Version & Extensions

In cPanel, go to **Select PHP Version** or **MultiPHP Manager**:

- Set PHP version to **8.2** or higher
- Ensure these extensions are enabled:
  - ✅ `pdo_mysql`
  - ✅ `sodium`
  - ✅ `mbstring`
  - ✅ `json`
  - ✅ `curl`
  - ✅ `fileinfo`
  - ✅ `openssl`

### 7. Test the Deployment

1. **API Health Check**: Visit `https://yourdomain.com/api/healthz`
   - Expected: `{"ok":true}`

2. **Landing Page**: Visit `https://yourdomain.com/`
   - Should show the EduReport NG landing page

3. **Admin Login**: Visit `https://yourdomain.com/adminpanel/login/`
   - Should show the admin login form

4. **Register a School**: Visit `https://yourdomain.com/register`
   - Create a test school account

5. **Login**: Visit `https://yourdomain.com/login`
   - Login with the school account

## Troubleshooting

### "500 Internal Server Error"

1. Check `backend/storage/error.log` for PHP errors
2. Verify PHP version is 8.0+
3. Verify `.env` file exists and has correct MySQL credentials
4. Verify `sodium` extension is enabled: create a `phpinfo.php` file with `<?php phpinfo(); ?>` and check for sodium

### "Database connection failed"

1. Verify MySQL credentials in `.env`
2. Verify the database user has ALL PRIVILEGES
3. Check if MySQL is running in cPanel

### "API routes return 404"

1. Verify `public_html/api/.htaccess` exists and contains:
   ```apache
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^ index.php [QSA,L]
   ```

2. Verify `public_html/.htaccess` has the API rewrite rule:
   ```apache
   RewriteRule ^api/(.*)$ api/index.php [QSA,L]
   ```

### "PDF generation fails"

On shared cPanel hosting, headless Chrome/Edge is usually not available. Options:

1. **Disable PDF generation**: Remove or comment out `PDF_RENDERER` in `.env`
2. **Use a VPS**: Deploy on a VPS where you can install Chrome/Edge
3. **Replace with pure-PHP library**: Use Dompdf or TCPDF (requires code changes)

### "CORS errors"

For same-origin deployment, CORS should not be an issue. If you see CORS errors:

1. Verify `CORS_ORIGIN` in `.env` includes your domain
2. Verify the frontend `config.js` has the correct `apiBaseUrl`

## Security Checklist

- [ ] `.env` file is NOT publicly accessible (test by visiting `https://yourdomain.com/backend/.env` — should return 403)
- [ ] `backend/` directory is blocked (test by visiting `https://yourdomain.com/backend/src/` — should return 403)
- [ ] `DEBUG=false` in `.env`
- [ ] Strong `ADMIN_PASSWORD` (12+ characters)
- [ ] Strong `ENCRYPTION_KEY` (generated with `random_bytes(32)`)
- [ ] MySQL user has only the privileges needed (ALL on the specific database)
- [ ] SSL/HTTPS is enabled (via cPanel Let's Encrypt or AutoSSL)
- [ ] Directory permissions are set correctly (755 for dirs, 640 for `.env`)

## Post-Deployment

1. **Set up AutoSSL** in cPanel for HTTPS
2. **Configure email** (SMTP) if you want to send notifications
3. **Configure SMS** (Termii/Twilio) if you want to send report cards via SMS
4. **Configure AI** (Gemini/OpenRouter/OpenAI) if you want AI-generated remarks
5. **Set up backups** for your MySQL database (cPanel has backup tools)
6. **Monitor error logs** at `backend/storage/error.log`
