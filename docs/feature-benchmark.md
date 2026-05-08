# EduReport NG – Feature Benchmark (School Owner Premium)

This benchmark compares the current implemented feature set in this repo against common capabilities found in international school management systems (SIS/gradebook/reporting tools).

## What EduReport NG Already Covers Well

- Report cards / report sheets (per student + per class) with export links
- Score entry and score sheet storage
- Student management (create, list, bulk import, delete)
- School setup basics (subjects, grading bands, CA/exam maxima)
- Admin portal surface area (schools, plans, payments, access, settings)
- RBAC foundations (ADMIN/SCHOOL/STAFF/TEACHER) and permissions
- 2FA controls (implemented in PHP backend)
- Audit logging (backend persistence for sensitive operations)
- AI-assisted workflows (remarks + exam generator) with graceful fallback

## Benchmark Matrix

Legend: ✅ implemented, 🟡 partial, ❌ missing

| Category | International competitors | EduReport NG today |
|---|---|---|
| SIS core (student profiles, enrollment) | Rich student profile, enrollment history, guardians | 🟡 (basic student profile only) |
| Gradebook | Flexible assessment structures, weighting, rubrics | 🟡 (CA1/CA2/Exam model) |
| Report cards | PDF, comments, signatures, branding, transcripts | ✅ (PDF exports + remarks; transcripts partial) |
| Attendance | Daily attendance, lateness, analytics, parent alerts | ❌ |
| Behavior & discipline | Incidents, demerits, counseling notes | ❌ |
| Timetable | Timetable builder, clashes, rooms, staff load | ❌ |
| Teacher portal | Class lists, score entry, attendance, messaging | 🟡 (teacher endpoints exist; UX depth TBD) |
| Parent/student portal | View reports, attendance, fees, messages | ❌ |
| Billing/fees | Invoicing, receipts, payment plans, reconciliation | 🟡 (platform plans/payments exist; school fees not) |
| Messaging | Email/SMS/in-app, templates, logs | 🟡 (SMS support exists; broader comms missing) |
| Analytics | KPI dashboards, cohort comparisons, exports | 🟡 (some admin reports/export; depth TBD) |
| Integrations | SSO, Google/Microsoft, LMS, APIs, webhooks | ❌ |
| Multi-campus | Multiple campuses under one org | ❌ |
| Security | RBAC, 2FA, audit logs, session controls | ✅ (strong foundation) |
| Reliability | Backups, monitoring, incident tooling | 🟡 (health endpoints exist; ops tooling TBD) |

## Competitive Positioning (Realistic)

- Best-fit wedge: schools that primarily need fast, clean reporting + exports, with an admin-grade control plane.
- To match top-tier “international” suites, the biggest gaps are attendance, portals, timetabling, and integrations.

