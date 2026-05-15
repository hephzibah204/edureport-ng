# ReportSheet – Premium UX & Reliability Punchlist

This is a practical punchlist focused on school owners: trust, speed, clarity, and “no surprises.”

## Premium UX

- Onboarding wizard for new schools (session/term, subjects, grading, templates)
- Role-based navigation (hide inaccessible sections; fewer “dead” clicks)
- Bulk import experience (CSV template download, validation preview, error row download)
- Report workflow polish (autosave, progress feedback, “last updated” stamps)
- Branding controls (logo, colors, signatures, watermark, footer)
- Parent-facing sharing (secure link + optional PIN + expiry controls)

## Reliability & Ops

- Background jobs for heavy tasks (PDF exports, bulk imports) with status polling
- Stronger export security (optional PIN required to download, access logs)
- Rate limits tuned per endpoint (login/register/report exports already exist; refine)
- Centralized error tracking hooks (server-side) and admin incident page
- Automatic DB backups + restore verification (especially for shared hosting)
- Maintenance mode UX (clear status page, graceful read-only mode)

## Security Baseline (Enterprise-ready)

- Session hardening (SameSite/secure cookie settings aligned to deployment)
- Audit log viewer in admin UI (filter by actor/school/action/date)
- API key management UI for AI/SMS/payment gateways with rotation
- Default password policy and forced reset flows (already partly implemented)

## International Parity (Largest Gaps)

- Attendance module (daily attendance + late tracking + term summaries)
- Parent/student portal (reports, attendance, messages)
- Billing/fees (invoices, receipts, reconciliation)
- Integrations (SSO, Google Workspace/Microsoft 365, CSV/REST exports)

