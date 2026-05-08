# Page Design Spec (Desktop-first)

## Global Styles (applies to all pages)
- Layout system: CSS Grid for page shells; Flexbox inside components.
- Max content width: 1200–1280px; 24px gutters; 8px spacing scale.
- Color: neutral background (light) + 1 primary brand color + semantic status colors (success/warn/danger).
- Typography: 14–16px base; clear H1/H2/H3 scale; tabular numerals for metrics.
- Buttons: primary (filled), secondary (outline), tertiary (text). Hover = subtle lift + color shift; disabled = reduced contrast.
- Links: underlined on hover; always keyboard-focus visible.
- Premium UX requirements (global):
  - Skeleton loaders for dashboard cards/tables; never blank screens.
  - Clear empty states with next-step CTA.
  - Inline validation + helpful error copy; toast for save/submit outcomes.
  - Sticky headers for long tables; fast search + filters.
  - Accessibility: logical heading order, visible focus ring, sufficient contrast.

---

## 1) Login
### Layout
- Centered auth card on a calm neutral background; responsive scales down to single column.

### Meta Information
- Title: Login
- Description: Sign in to access your dashboard.

### Page Structure
- Single card: logo/brand → title/subtitle → form → help text.

### Sections & Components
- Auth Card
  - Inputs: Email/Phone, Password (with show/hide)
  - Primary button: Sign in (loading state)
  - Error region: inline above button (ARIA-live)

---

## 2) Dashboard (Teacher)
### Layout
- Page shell: left sidebar (fixed) + top bar + main content grid.
- Main grid: 12-column; KPI cards in a 3–4 card row; content panels below.

### Meta Information
- Title: Teacher Dashboard
- Description: Today’s overview, classes, and quick actions.

### Page Structure
- Top Bar: page title, school context, user menu.
- Main:
  1) KPI Card Row
  2) Today’s Classes panel
  3) Student search panel

### Sections & Components
- Sidebar
  - Nav items: Dashboard, Attendance
- KPI Cards
  - Cards: Today’s classes, Present/Absent (today), Completion status
  - State: skeleton → loaded; empty shows “No classes today”
- Today’s Classes
  - Table/list with class name, time (if available), CTA “Take attendance”
- Student Lookup
  - Search input + results dropdown/list; click opens Student Profile

---

## 3) Dashboard (Parent/Student)
### Layout
- Same shell as teacher for consistency.
- Main grid: KPI row + summary panels.

### Meta Information
- Title: Dashboard
- Description: Attendance snapshot and quick links.

### Page Structure
- KPI cards: Attendance rate (period), Recent absences count.
- Panels: Attendance snapshot + quick links.

### Sections & Components
- Attendance Snapshot
  - Mini trend chart or sparkline + period selector (e.g., month)
  - Empty state if no records: explain and link to Attendance
- Quick Links
  - Buttons: View Attendance History, Open Student Profile

---

## 4) Attendance
### Layout
- Desktop-optimized table experience.
- Filters row above; roster table with sticky header.

### Meta Information
- Title: Attendance
- Description: Take attendance and review history.

### Page Structure
1) Filter/Context Bar (class + date)
2) Roster Marking Table (teacher) OR History view (parent/student)
3) Save/Submit controls

### Sections & Components
- Context Bar
  - Class selector; date picker (default today); status chip (Draft/Submitted)
- Roster Table (Teacher)
  - Columns: Student, Mark (segmented control), Note (optional)
  - Bulk actions: mark all present; filter “Unmarked”
  - Sticky header; row hover; keyboard navigation support
- Actions
  - Secondary: Save draft
  - Primary: Submit (confirmation modal)
  - Feedback: toast + “Last saved” timestamp
- History (All)
  - Date range filter; list of sessions; open to review

---

## 5) Student Profile (Improved)
### Layout
- Header + 2-column content (left: profile details; right: summaries) on desktop.
- Uses section anchors for quick navigation.

### Meta Information
- Title: Student Profile
- Description: Student record and attendance summary.

### Page Structure
1) Profile Header
2) Section Tabs/Anchors
3) Details sections (cards)
4) Right rail summaries

### Sections & Components
- Profile Header
  - Avatar/photo, name, student ID, class; quick actions: Print
- Anchors
  - Overview, Details, Contacts/Guardians (role-based visibility), Attendance
- Details Cards
  - Personal info (read-only display)
  - School info (class, status)
  - Contacts/Guardians: visible to teacher/parent
- Attendance Summary
  - Rate + recent absence list; CTA “View full attendance history”
- Empty/Unknown fields
  - Display “Not provided” with consistent styling; never collapse layout unexpectedly
