# ELPEKAS CMS — Live Execution Plan

> This file is the source of truth for all agents. Update task status as work completes.
> Status: `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked

---

## Project Overview

**ELPEKAS** — property management platform for a single construction company.
- Admin CMS: company staff manage estates, units, defects, documents, invite owners
- Owner portal: home owners view unit data, track defects, manage documents

**Figma:** https://www.figma.com/design/ytADSxw2OrY2k4nCXi8uo5/P.idea-Orbers---Rycka?node-id=948-2789&m=dev
**Components:** https://www.figma.com/design/ytADSxw2OrY2k4nCXi8uo5/P.idea-Orbers---Rycka?node-id=948-8093&m=dev

---

## Stack

- **Framework:** Next.js 15.x App Router, TypeScript strict
- **UI:** shadcn/ui 3.5.0 (oklch theming) + Tailwind CSS v4
- **Backend:** Supabase (Postgres, Auth, Storage) via `@supabase/ssr`
- **Email:** Resend + React Email
- **Deployment:** Vercel

---

## Design Tokens

```css
--sidebar:             oklch(0.22 0.03 255)   /* dark navy #2D3348 */
--sidebar-foreground:  oklch(0.92 0 0)
--sidebar-accent:      oklch(0.30 0.03 255)
--primary:             oklch(0.68 0.10 60)    /* gold #b5935a */
--background:          oklch(0.97 0.005 90)   /* off-white #F8F7F5 */
--status-pateikta:     oklch(0.65 0 0)        /* muted grey */
--status-sprendziama:  oklch(0.75 0.15 75)    /* amber */
--status-atlikta:      oklch(0.65 0.15 145)   /* green */
```

**Rules (enforced on every file):**
- No inline `style={{}}` — Tailwind classes only
- No hardcoded hex/px values — use design tokens
- No raw divs when a shadcn component fits — use `Card`, `Button`, `Badge`, `Table`, `Dialog`, etc.
- No i18n hardcoded strings beyond Lithuanian labels already in Figma

---

## Data Model

```sql
estates (id uuid PK, name text, address text, description text, created_at)
units   (id uuid PK, estate_id uuid FK, unit_number text, floor int, area_sqm numeric,
         technical_data jsonb, financial_data jsonb, created_at)
unit_owners (id uuid PK, unit_id uuid FK, user_id uuid FK, invited_at, accepted_at)
defects (id uuid PK, unit_id uuid FK, submitted_by uuid FK,
         title text, description text,
         status text CHECK IN ('pateikta','sprendziama','atlikta'), created_at)
defect_attachments (id uuid PK, defect_id uuid FK, storage_path text, uploaded_by uuid, created_at)
defect_replies (id uuid PK, defect_id uuid FK, author_id uuid FK, body text, created_at)
defect_reply_attachments (id uuid PK, reply_id uuid FK, storage_path text, created_at)
documents (id uuid PK, unit_id uuid FK, category text, name text, storage_path text, uploaded_by uuid, created_at)
```

---

## Route Structure

```
/login                              shared login
/invite/[token]                     owner sets password
/auth/callback                      Supabase callback

/admin/estates                      admin: estate list
/admin/estates/[id]                 admin: estate detail + units
/admin/estates/[id]/units/[unitId]  admin: unit editor (tabs)
/admin/defects                      admin: all defects
/admin/defects/[id]                 admin: defect thread

/portal/pagrindinis                 owner: home
/portal/defektai                    owner: submit + track defects
/portal/nuotraukos                  owner: photos
/portal/sutartys                    owner: documents
/portal/kontaktai                   owner: contacts
```

---

## File Structure

```
app/
  (auth)/login/page.tsx
  (auth)/invite/[token]/page.tsx
  auth/callback/route.ts
  admin/layout.tsx
  admin/estates/page.tsx
  admin/estates/[id]/page.tsx
  admin/estates/[id]/units/[unitId]/page.tsx
  admin/defects/page.tsx
  admin/defects/[id]/page.tsx
  portal/layout.tsx
  portal/pagrindinis/page.tsx
  portal/defektai/page.tsx
  portal/nuotraukos/page.tsx
  portal/sutartys/page.tsx
  portal/kontaktai/page.tsx
components/
  ui/                    shadcn primitives
  admin/                 EstateTable, UnitEditor, DefectList, DefectThread, InviteOwnerDialog
  portal/                DefectForm, DefectTimeline, DefectCard, DocumentList, PhotoGallery
  email/                 InviteEmail.tsx, DefectStatusEmail.tsx
lib/
  supabase/client.ts     createBrowserClient
  supabase/server.ts     createServerClient
  supabase/admin.ts      createAdminClient (service role)
  actions/estates.ts
  actions/units.ts
  actions/defects.ts
  actions/invitations.ts
  types.ts               all shared TypeScript types
middleware.ts
supabase/migrations/
  001_initial_schema.sql
  002_rls_policies.sql
  003_storage_buckets.sql
```

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
RESEND_FROM_EMAIL
NEXT_PUBLIC_APP_URL
```

---

## Tasks

### Task 1 — Project Scaffold + Design System
**Status:** `[ ]`

Scaffold the Next.js 15 project with full ELPEKAS design system:

1. Run `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=no --import-alias="@/*" --yes` inside `/Users/rysardgvozdovic/Desktop/projects/elpeka`
2. Install packages: `@supabase/ssr @supabase/supabase-js resend react-email @react-email/components react-dropzone`
3. Initialize shadcn: `npx shadcn@latest init` — choose "New York" style, default color "neutral"
4. Install shadcn components: `npx shadcn@latest add sidebar button input select badge table dialog tabs card sheet dropdown-menu avatar separator form label textarea`
5. Replace `globals.css` with ELPEKAS design tokens (see Design Tokens section above). Use oklch format. Add `--status-pateikta`, `--status-sprendziama`, `--status-atlikta`. Override `--sidebar`, `--sidebar-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-primary`, `--sidebar-border`, `--primary`, `--background`.
6. Create `lib/types.ts` with all TypeScript types derived from the data model above.
7. Create `.env.local.example` with all required env vars (empty values).
8. Create `next.config.ts` — enable `images.domains` for Supabase storage.
9. Update `app/layout.tsx` with correct font (Inter or similar), meta title "ELPEKAS CMS".
10. Commit: `chore: scaffold project + design system`

**Acceptance criteria:**
- `npm run dev` starts without errors
- Tailwind + shadcn components render
- Design tokens visible in browser dev tools
- TypeScript strict mode passes (`npm run build` or `tsc --noEmit`)
- No inline styles anywhere

---

### Task 2 — Supabase Client Helpers + Migrations
**Status:** `[ ]`
**Depends on:** Task 1

1. Create `lib/supabase/client.ts` — `createBrowserClient` from `@supabase/ssr`
2. Create `lib/supabase/server.ts` — `createServerClient` using `await cookies()` (Next.js 15 async cookies)
3. Create `lib/supabase/admin.ts` — admin client using `SUPABASE_SERVICE_ROLE_KEY` (never exported to client)
4. Create `supabase/migrations/001_initial_schema.sql` — all tables from Data Model section (use `uuid_generate_v4()` or `gen_random_uuid()` for PKs, all foreign keys with ON DELETE CASCADE where appropriate)
5. Create `supabase/migrations/002_rls_policies.sql` — RLS on every table:
   - `estates`: admins full access, owners SELECT only where they have a unit
   - `units`: admins full access, owners SELECT only their unit via `unit_owners`
   - `unit_owners`: admins full access, owners SELECT only their own row
   - `defects`: admins full access, owners SELECT/INSERT only their unit's defects
   - `defect_attachments`: same as defects
   - `defect_replies`: admins full access, owners SELECT all replies for their defects
   - `defect_reply_attachments`: same as defect_replies
   - `documents`: admins full access, owners SELECT only their unit's documents
6. Create `supabase/migrations/003_storage.sql` — create `property-files` bucket (public=false), add RLS policies on `storage.objects`
7. Commit: `feat: supabase client helpers + db migrations`

**Acceptance criteria:**
- All three client files export correct functions
- Migrations are valid SQL (no syntax errors)
- RLS policies cover all tables with correct `auth.uid()` checks
- No `SUPABASE_SERVICE_ROLE_KEY` referenced in any client-side file

---

### Task 3 — Auth + Middleware
**Status:** `[ ]`
**Depends on:** Task 2

1. Create `middleware.ts` at project root:
   - Use `createServerClient` from `lib/supabase/server` pattern but adapted for middleware (read cookies from `request`, write to `response`)
   - Call `supabase.auth.getUser()` (never `getSession()`)
   - Unauthenticated → redirect to `/login`
   - `role=admin` on `/portal/*` → redirect to `/admin/estates`
   - `role=owner` on `/admin/*` → redirect to `/portal/pagrindinis`
   - Match paths: `/admin/:path*` and `/portal/:path*`
2. Create `app/(auth)/login/page.tsx` — login form using shadcn `Card`, `Input`, `Button`, `Label`. Fields: email, password. Calls `signInWithPassword`, redirects based on role. Show error state with shadcn styling.
3. Create `app/auth/callback/route.ts` — handles Supabase auth code exchange
4. Create `app/(auth)/invite/[token]/page.tsx` — "Set your password" form for owner first login. Fields: password, confirm password. Uses Supabase `verifyOtp` or `updateUser`. On success, creates `unit_owners` record if not exists, redirects to `/portal/pagrindinis`.
5. Create `app/page.tsx` — root redirects to `/login` if unauthenticated, or role-appropriate page if authenticated.
6. Commit: `feat: auth + middleware`

**Acceptance criteria:**
- Unauthenticated users cannot reach `/admin` or `/portal`
- Admin users cannot reach `/portal`
- Owner users cannot reach `/admin`
- Login form shows error on wrong credentials
- No `getSession()` used anywhere for auth decisions

---

### Task 4 — Admin Layout + Estates Management
**Status:** `[ ]`
**Depends on:** Task 3

**Admin sidebar** (matches Figma dark navy design):
1. Create `components/admin/admin-sidebar.tsx` using shadcn `Sidebar` component with ELPEKAS styling. Nav items: Nekilnojamasis turtas (estates), Defektai ir pastabos (defects). User info + sign out at bottom. Logo at top.
2. Create `app/admin/layout.tsx` — wraps all admin pages with `AdminSidebar` + `SidebarProvider`.

**Estates pages:**
3. Create `components/admin/estate-table.tsx` — shadcn `Table` showing estates (name, address, unit count, created date, actions). Actions: Edit, Delete, View units.
4. Create `components/admin/estate-form-dialog.tsx` — shadcn `Dialog` + `Form` for create/edit estate. Fields: name, address, description.
5. Create `app/admin/estates/page.tsx` — fetches estates (server component), renders `EstateTable` + "New Estate" button that opens `EstateFormDialog`.
6. Create `app/admin/estates/[id]/page.tsx` — estate detail: header with name/address, units table (unit number, floor, area, owner name/email, actions). "Invite Owner" button per unit row.
7. Create `lib/actions/estates.ts` — Server Actions: `createEstate`, `updateEstate`, `deleteEstate`. Each re-verifies `role=admin` before mutating.
8. Commit: `feat: admin layout + estates management`

**Acceptance criteria:**
- Sidebar uses shadcn Sidebar component, dark navy background from CSS vars
- All pages fetch real data via Server Components
- Estate CRUD works (create, edit, delete)
- Estate detail shows units list
- No inline styles or hardcoded colors

---

### Task 5 — Admin Unit Editor
**Status:** `[ ]`
**Depends on:** Task 4

1. Create `app/admin/estates/[id]/units/[unitId]/page.tsx` — unit detail page with shadcn `Tabs`:
   - **Techniniai duomenys** tab: form for `technical_data` jsonb (fields: rooms count, total area, living area, heating type, building materials, construction year, floor covering)
   - **Finansiniai duomenys** tab: form for `financial_data` jsonb (fields: sale price, payment type, payment schedule notes, notary info)
   - **Dokumentai** tab: document list (name, category, download link, upload date) + upload button
   - **Nuotraukos** tab: photo grid + upload dropzone
2. Create `components/admin/unit-editor/technical-form.tsx` — form using shadcn `Form`, `Input`, `Select`, `Label`
3. Create `components/admin/unit-editor/financial-form.tsx` — same pattern
4. Create `components/admin/unit-editor/documents-tab.tsx` — file list + upload using `react-dropzone`
5. Create `components/admin/unit-editor/photos-tab.tsx` — photo grid + upload using `react-dropzone`
6. Create `lib/actions/units.ts` — Server Actions: `updateUnitTechnicalData`, `updateUnitFinancialData`, `uploadUnitDocument`, `uploadUnitPhoto`. Use admin Supabase client for storage. Re-verify `role=admin`.
7. Commit: `feat: admin unit editor`

**Acceptance criteria:**
- All four tabs render and are navigable
- Technical + financial forms save to Supabase (jsonb fields)
- Document upload stores file in Supabase Storage and saves record
- Photo upload stores file in Supabase Storage and shows preview
- All form components are shadcn-based, no inline styles

---

### Task 6 — Admin Defects Management
**Status:** `[ ]`
**Depends on:** Task 5

1. Create `components/admin/defect-table.tsx` — shadcn `Table` with filters (estate, status). Columns: ticket number, title, unit, owner, status badge, submitted date, actions.
2. Create `app/admin/defects/page.tsx` — fetches all defects (server component, filtered by query params), renders `DefectTable`.
3. Create `components/admin/defect-thread.tsx` — defect detail component showing:
   - Title, ticket number, submitted by, submitted date
   - Status `Select` (Pateikta / Sprendžiama / Atlikta) — changes immediately via Server Action
   - Timeline steps (visual stepper matching Figma: Pateikta → Sprendžiama → Atlikta)
   - Original message + attachments (image thumbnails with view button)
   - Reply thread (previous replies in order)
   - Reply form: textarea + photo upload (`react-dropzone`) + submit button
4. Create `app/admin/defects/[id]/page.tsx` — renders `DefectThread`
5. Create `lib/actions/defects.ts` — Server Actions: `updateDefectStatus`, `addDefectReply`, `uploadDefectReplyAttachment`. Re-verify `role=admin`.
6. Status badge uses `Badge` variant mapped to status: `pateikta`→grey, `sprendziama`→amber, `atlikta`→green. Use CSS vars `--status-*` not hardcoded colors.
7. Commit: `feat: admin defects management`

**Acceptance criteria:**
- Defects list shows all defects with filters working
- Status can be changed via dropdown (updates DB immediately)
- Admin can reply with text + photos
- Timeline stepper shows correct active step per status
- Status badges use design token colors

---

### Task 7 — Owner Portal Layout + Static Pages
**Status:** `[ ]`
**Depends on:** Task 3

**Portal sidebar** (matches Figma exactly — dark navy, gold accents, badge counts):
1. Create `components/portal/portal-sidebar.tsx` — uses shadcn `Sidebar`. Nav items (Lithuanian): Pagrindinis, Defektai ir pastabos (with unread badge), Objekto nuotraukos, Paslaugų sutartys, Kontaktai. User name + email at bottom. ELPEKAS logo at top. Collapsible toggle.
2. Create `app/portal/layout.tsx` — wraps all portal pages with `PortalSidebar` + `SidebarProvider`. Fetches current user + unit data (passed to sidebar via context or props).

**Static pages:**
3. Create `app/portal/pagrindinis/page.tsx` — unit overview card: estate name, unit number, floor, area. Uses shadcn `Card`. Shows key info prominently.
4. Create `app/portal/nuotraukos/page.tsx` — photo gallery grid. Fetches photos from Supabase Storage for owner's unit. Uses responsive CSS grid.
5. Create `app/portal/sutartys/page.tsx` — document list. Fetches documents for owner's unit. Shows name, category, upload date, download button.
6. Create `app/portal/kontaktai/page.tsx` — company contact info (address, phone, email). Static content from DB or hardcoded company record.
7. Commit: `feat: portal layout + static pages`

**Acceptance criteria:**
- Portal sidebar exactly matches Figma nav (items, icons, badge, logo position)
- Owner can only see their own unit's data (RLS enforced)
- Photos render in grid with correct aspect ratios
- Documents list shows download links
- No inline styles

---

### Task 8 — Owner Defektai Feature
**Status:** `[ ]`
**Depends on:** Task 6 + Task 7

This is the core owner feature. Matches Figma screens exactly.

1. Create `components/portal/defect-form.tsx` — "Registruoti defektą" form:
   - Two-column layout: left = defect info (title input, description textarea with hint text), right = photo upload dropzone
   - shadcn `Card` wrapping each section, numbered headers "1. Defekto informacija", "2. Nuotraukų įkėlimas"
   - Drag-and-drop area using `react-dropzone` (accepts JPG, PNG). Shows file previews.
   - Submit button ("Siųsti") bottom-right, disabled until title + description filled
   - Character count on description (0/500)
   
2. Create `components/portal/defect-card.tsx` — single defect in the tracking list:
   - Title + ticket number (#12345623)
   - Status badge (top right): Pateikta / Sprendžiama / Atlikta
   - Timeline stepper (3 steps with dates): uses `--status-*` CSS vars for active step color
   - "Kitas žingsnis" info box (amber background `oklch(0.97 0.05 90)`) showing next step description
   - "Peržiūrėti pranešimą" expand toggle showing original description + photo thumbnails
   
3. Create `components/portal/defect-timeline.tsx` — the 3-step stepper component (reusable). Props: currentStatus, timestamps per step. Active step = filled circle with checkmark, future steps = outlined clock icon.

4. Create `app/portal/defektai/page.tsx` — two tabs:
   - "Registruoti defektą" tab → `DefectForm`
   - "Sekti eigą" tab → list of `DefectCard` components (fetched for owner's unit). Badge count on tab = count of unresolved defects.
   
5. Create `lib/actions/defects.ts` additions — `submitDefect`, `uploadDefectAttachment` for owner role. Verify `role=owner`, get unit from `unit_owners`.

6. Commit: `feat: owner defektai feature`

**Acceptance criteria:**
- Form matches Figma layout (two-column, numbered cards)
- Photo upload works with drag-and-drop + file preview
- Timeline stepper matches Figma (Pateikta → Sprendžiama → Atlikta with dates)
- "Kitas žingsnis" box shows correct message per status
- "Peržiūrėti pranešimą" expand/collapse works
- Unread badge count on tab/sidebar updates
- No inline styles — all colors via CSS vars

---

### Task 9 — Owner Invite Flow + Email Templates
**Status:** `[ ]`
**Depends on:** Task 6

1. Create `components/admin/invite-owner-dialog.tsx` — shadcn `Dialog` triggered from unit row. Form: email input, confirm unit assignment display. Submit calls invite Server Action.
2. Create `lib/actions/invitations.ts` — `inviteOwner` Server Action:
   - Verify `role=admin`
   - Call Supabase Admin API: `supabase.auth.admin.inviteUserByEmail(email, { data: { role: 'owner', unit_id } })`
   - Send branded invite email via Resend
   - Insert into `unit_owners` (invited_at = now, accepted_at = null)
3. Create `components/email/invite-email.tsx` — React Email template for owner invitation. Includes: ELPEKAS logo, owner's unit info, CTA button to set password, company footer.
4. Create `components/email/defect-status-email.tsx` — React Email template for status updates. Includes: defect title, new status, admin message (if any), link to portal.
5. Update `lib/actions/defects.ts` `updateDefectStatus` to send `DefectStatusEmail` via Resend when status changes.
6. Update `app/(auth)/invite/[token]/page.tsx` to mark `unit_owners.accepted_at` when owner accepts.
7. Commit: `feat: owner invite flow + email templates`

**Acceptance criteria:**
- Admin can invite owner from unit row
- Invite email is sent via Resend with correct content
- Owner clicks link → sets password → lands on portal
- `unit_owners.accepted_at` is set on acceptance
- Status change emails fire correctly

---

### Task 10 — Final Polish + Deployment Config
**Status:** `[ ]`
**Depends on:** All previous tasks

1. Create `vercel.json` or `vercel.ts` with: build command, framework: nextjs
2. Create `.env.local.example` and verify in sync with all required vars
3. Create `app/not-found.tsx` — 404 page with ELPEKAS branding
4. Create `app/error.tsx` — error boundary page
5. Create `app/admin/loading.tsx` + `app/portal/loading.tsx` — skeleton loading states using shadcn `Skeleton`
6. Add `<Toaster>` (shadcn `toast`) to root layout for success/error feedback
7. Run `tsc --noEmit` — fix all TypeScript errors
8. Run `npm run build` — fix all build errors
9. Review every file for: inline styles, hardcoded colors, missing component abstractions
10. Final commit: `chore: final polish + deployment config`

**Acceptance criteria:**
- `npm run build` passes with zero errors
- `tsc --noEmit` passes with zero errors
- No inline styles in any component file
- Loading states exist for both admin and portal
- Toast notifications work for CRUD operations
- vercel.json present and valid

---

## Progress Log

| Date | Task | Status | Agent | Notes |
|------|------|--------|-------|-------|
| 2026-05-20 | — | Starting | — | Plan created |

---

## Figma Reference

- **UI screens:** node-id=948-2789 — full page layouts for both admin and owner portal
- **Components:** node-id=948-8093 — design system, colors, form elements, cards

**Key screens identified:**
- Login page (simple white card, center)
- Admin: property list table with dark sidebar
- Admin: property detail with Čalitiniai / Finansiniai tabs
- Owner: Defektai ir Pastabos (defect form + timeline tracker)
- Owner: sidebar with Pagrindinis, Defektai, Objekto nuotraukos, Paslaugų sutartys, Kontaktai
