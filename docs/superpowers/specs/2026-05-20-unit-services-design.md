# Unit Services (Paslaugų teikimo sutartys) Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the static documents view on `/portal/sutartys` with a live service-tracking page where admins set meter numbers and owners mark contracts as completed.

**Architecture:** New `unit_services` DB table stores one row per service category per unit. Admin manages meter numbers on the unit editor. Owner marks completion via a server action. Portal page renders the Figma accordion design.

**Tech Stack:** Next.js 15 App Router, Supabase (PostgreSQL + RLS), React Hook Form + Zod, `@phosphor-icons/react`, shadcn/ui, Tailwind CSS.

---

## Database

**Table: `unit_services`**

| column | type | constraints |
|--------|------|-------------|
| `id` | uuid | PK, default gen_random_uuid() |
| `unit_id` | uuid | FK → units(id) ON DELETE CASCADE, NOT NULL |
| `category` | text | CHECK IN ('electrical','water','heating','waste'), NOT NULL |
| `meter_number` | text | nullable |
| `description` | text | nullable — instructions shown to owner |
| `completed_at` | timestamptz | nullable — null = pending |
| `created_at` | timestamptz | default now() |
| UNIQUE | (unit_id, category) | one row per service per unit |

**RLS policies:**
- Admins: full CRUD via `is_admin()`
- Owners: SELECT own unit's rows via `owner_unit_id() = unit_id`; UPDATE `completed_at` only (mark done)

---

## Services definition

Fixed set of 4 services, each with a Lithuanian label and Phosphor icon:

| category | label | icon |
|----------|-------|------|
| `electrical` | Elektra | `Lightning` |
| `water` | Vanduo | `Drop` |
| `heating` | Šildymas | `ThermometerHot` |
| `waste` | Atliekų išvežimas | `Trash` |

---

## Admin UI

**Location:** New "Paslaugos" tab on `/admin/estates/[id]/units/[unitId]` (alongside existing tabs).

**Tab content:** List of the 4 services. Each service row has:
- Label + icon (read-only)
- Meter number input (text, optional)
- Description textarea (optional, shown to owner)
- Status badge: shows completed_at date if done, "Laukiama" if not
- Save button per row (or single save-all)

**Server actions:** `upsertUnitService(unitId, category, data)` — upserts meter_number + description.

---

## Portal page (`/portal/sutartys`)

Completely replaces the current documents view.

**Layout (matches Figma node 948:3020):**

1. `PageHeader` with title "Paslaugų teikimo sutartys" and description "Po nuosavybės registracijos sudarykite komunalinių ir kitų paslaugų sutartis savo objektui."

2. **Warning banner** (amber tint, rounded-[24px]): "Svarbu — Prašome sudaryti paslaugų sutartis per 10 dienų po nuosavybės registracijos." Shown only if any service is not completed.

3. **Progress card** (white, rounded-[24px]): Title "Sutarčių sudarymo eiga", subtitle, badge "Vykdoma"/"Įvykdyta", progress bar, "X iš 4 sutarčių / Y% įvykdyta". Hidden when no services exist yet.

4. **Service accordion list**: One card per service (only services with a row in DB are shown — if admin hasn't set up services yet, show empty state). Each card:
   - Header row: icon + name + status badge + caret
   - Expanded body (always visible or toggled): description text + "Skaitiklio numeris: [number] [copy icon]" + "Pažymėti, kaip atlikta" button (only when pending)
   - "Įvykdyta" state: green badge, no action button
   - "Laukiama" state: grey badge, action button visible

**Server action:** `markServiceCompleted(serviceId)` — sets `completed_at = now()` for the calling owner's unit. Validates the service belongs to the owner's unit via RLS.

**Components:**
- `app/portal/sutartys/page.tsx` — server component, fetches services + owner unit
- `components/portal/service-card.tsx` — client component, accordion + mark-done action

---

## Data flow

1. Admin creates unit → goes to unit editor → "Paslaugos" tab → enters meter numbers per service
2. `upsertUnitService` upserts rows into `unit_services`
3. Owner visits `/portal/sutartys` → server component fetches their unit's services
4. Owner expands a card → clicks "Pažymėti, kaip atlikta" → `markServiceCompleted` sets `completed_at`
5. Page re-renders (revalidatePath) showing green badge and updated progress

---

## Error handling / edge cases

- If no services configured for the unit → show "Paslaugos dar nėra sukurtos." empty state
- `markServiceCompleted` verifies service belongs to caller's unit (RLS enforces this)
- Meter number copy: uses `navigator.clipboard.writeText` client-side, shows toast confirmation
- Already-completed services: action button hidden, status badge green, `completed_at` is immutable from portal (owner cannot unmark)
