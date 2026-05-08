# Page Design Spec — School Landing Pages + Teacher Class Portal (Desktop-first)

## Global Design (applies to all pages)
### Layout
- Desktop-first grid: max-width 1200px content container, centered.
- Use CSS Grid for page scaffolding (header/main/footer) and card layouts; Flexbox for row alignment inside components.
- Breakpoints: desktop (≥1024px) default; tablet (768–1023px) collapses multi-column to single; mobile (<768px) stacks and increases tap targets.

### Meta Information (default)
- Title pattern: "{School Name} | {Page}" (fallback "Teacher Portal")
- Description: concise summary per page; avoid indexing teacher portal pages.
- Open Graph: og:title, og:description, og:image (school logo), og:type="website".

### Global Styles / Tokens
- Background: #0B1220 (app shell) with white/near-white content surfaces for readability.
- Surface: #FFFFFF; Elevated surface: #F7F8FA.
- Text: #0F172A primary, #475569 secondary.
- Primary brand color: from school theme if available; otherwise #2563EB.
- Accent: #22C55E for success, #F59E0B warning, #EF4444 error.
- Typography scale: H1 32/40, H2 24/32, H3 20/28, Body 16/24, Small 14/20.
- Buttons: primary (solid), secondary (outline), tertiary (text). Hover: +6% darken; Focus: 2px ring in primary.
- Links: underline on hover; visited optional.
- Transitions: 150–200ms ease-out for hover/focus; 250ms for drawers/modals.

---

## Page 1 — School Landing Page (Public)
### Meta Information
- Title: "{School Name} | Home"
- Description: "Public landing page for {School Name}."
- Indexable: Yes.

### Page Structure
- Stacked sections with a hero + information blocks.
- Header is minimal and school-branded.

### Sections & Components
1. **Top Header (School brand bar)**
   - Left: school logo (image) + school name.
   - Right: primary CTA button “Teacher Sign In”.
   - Behavior: sticky on scroll (desktop), collapses to single row on small screens.

2. **Hero Section**
   - Left column: school name (H1), short description, optional public contact line.
   - Right column: school image/logo card.
   - CTA: “Teacher Sign In” (primary) + optional “Contact” (secondary) if public_contact exists.

3. **Public Info Cards**
   - Grid (3 columns desktop, 1 column mobile) with concise public info blocks (only fields provided in school public profile).
   - Each card: title + 2–4 lines.

4. **Footer**
   - Minimal: copyright, school name, optional contact.

### Interaction States
- Loading state: skeleton for logo/title/cards.
- Error state: “School not found” with link back to a safe default route.

---

## Page 2 — Teacher Login
### Meta Information
- Title: "Teacher Sign In"
- Description: "Secure access for teachers."
- Indexable: No (set robots noindex).

### Page Structure
- Centered authentication card on a neutral background.

### Sections & Components
1. **Auth Card**
   - Header: “Teacher Sign In” + school context (e.g., “for {School Name}” when coming from /s/:slug).
   - Form: email, password.
   - Primary action: “Sign In”.
   - Secondary: “Forgot password?” (password reset flow).
   - Inline validation: required fields, invalid credentials.

2. **Context Footer**
   - Text link: “Back to School Page”.

### Interaction States
- Submit loading: disable inputs, show spinner in button.
- Error banner: concise error with retry.

---

## Page 3 — Teacher Classes Portal
### Meta Information
- Title: "{School Name} | My Classes"
- Description: "Teacher portal for managing assigned classes."
- Indexable: No.

### Page Structure
- Dashboard layout with top app bar and main content area.
- Primary content: assigned classes list; secondary content: class workspace panel.

### Sections & Components
1. **Top App Bar**
   - Left: school name + “Teacher Portal”.
   - Middle (optional): search input (filters within assigned classes only).
   - Right: teacher display name (menu) + “Sign out”.

2. **Assigned Classes List**
   - Layout: card grid (3 columns desktop, 1–2 columns smaller screens).
   - Each class card:
     - Class name, grade level (if present), status badge (active/inactive).
     - Action: “Open”.
   - Empty state: “No assigned classes” + guidance text.

3. **Class Workspace (in-page panel)**
   - Opened from a selected class card.
   - Desktop: right-side drawer or split-pane (list left, workspace right).
   - Mobile: full-screen page section.
   - Content:
     - Class header: class name + breadcrumb “My Classes / {Class}”.
     - Permission guard: if class not assigned, show “Access denied” and hide data.
     - Class management area: show editable fields/actions that the system supports for class-level management, but only for this class.

### Interaction States
- Loading:
  - Initial: skeleton grid.
  - Workspace load: spinner/skeleton in panel.
- Authorization failure:
  - “Access denied” message when attempting to deep link to an unassigned class.
- Save feedback (if edits exist): inline success/error toasts.
