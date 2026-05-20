# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server
npm run build    # production build (also type-checks)
npm run lint     # ESLint
```

No test suite — verify correctness via `npm run build` (runs tsc + Next.js build).

## Project Status

All 10 original plan tasks are complete. Build passes clean (21 routes, 0 errors). The app is feature-complete and ready for Vercel deployment.

## Architecture

**ELPEKAS** is a property management CMS for a single construction company. Two distinct user surfaces:
- `/admin/*` — company staff manage estates, units, defects, documents, contacts, invite owners
- `/portal/*` — home owners view their unit, track defects, download documents, view services and contacts

### Route Map

```
/login                                    shared login
/forgot-password                          password reset
/invite                                   owner sets password after email invite
/onboarding                               post-invite onboarding screen
/auth/callback                            Supabase auth callback

/admin/estates                            estate list
/admin/estates/[id]                       estate detail (units table + cover photo + contacts)
/admin/estates/[id]/units/[unitId]        unit editor (Technical / Financial / Documents / Photos / Services tabs)
/admin/defects                            all defects across estates
/admin/defects/[id]                       defect thread with replies
/admin/contacts                           contacts library (reusable company contacts)

/portal/pagrindinis                       owner home — unit overview + purchase steps accordion
/portal/defektai                          submit defect + track defect timeline
/portal/nuotraukos                        unit photo gallery
/portal/sutartys                          service tracking (active services with status)
/portal/kontaktai                         contacts assigned to owner's estate
/portal/nustatymai                        account settings (name, password)
```

### Auth & Role Model

Roles live in **Supabase `user_metadata.role`** — either `"admin"` or `"owner"`. There is no `profiles` table.

- `proxy.ts` (Next.js 16 rename of `middleware.ts`) — guards all `/admin` and `/portal` routes, reads role from `user.user_metadata.role`
- Every Server Action calls a local `requireAdmin()` that checks `user.user_metadata?.role !== 'admin'` — **not a DB lookup**
- Login redirect is role-based: admin → `/admin/estates`, owner → `/portal/pagrindinis`

### Supabase Clients — Three Distinct Clients

| File | Usage |
|------|-------|
| `lib/supabase/client.ts` | Browser components (`createBrowserClient`) |
| `lib/supabase/server.ts` | Server Components + Server Actions (`async createClient()` using `await cookies()`) |
| `lib/supabase/admin.ts` | Service-role operations (storage uploads, invite user by email) — **never import in client code** |

RLS is enabled on all tables. Helper SQL functions `is_admin()` and `owner_unit_id()` drive all policies.

### Data Flow

Server Components fetch directly via `lib/supabase/server.ts`. Mutations go through **Server Actions** in `lib/actions/` — never API routes for CRUD. Storage operations (upload/download signed URLs) use `lib/supabase/admin.ts`.

**Storage buckets** (both private):
- `unit-files` — unit documents, photos, defect attachments. Paths: `documents/{unitId}/`, `photos/{unitId}/`, `defects/{defectId}/`
- `property-files` — estate-level files (e.g. cover photos). Path: `estates/{estateId}/`

**Storage access routes:**
- `GET /api/documents/[id]/download` — verifies auth + unit ownership, returns signed URL
- `GET /api/storage/preview?path=` — verifies auth, returns 1hr signed URL for any storage path

### Key Types (`lib/types.ts`)

```
UserRole                    'admin' | 'owner'
Estate                      id, name, address, description, cover_image_url, created_at
EstateWithUnitCount         Estate + unit_count
Unit                        id, estate_id, unit_number, floor, area_sqm, technical_data, financial_data
TechnicalData               rooms, total_area, living_area, heating_type, building_materials, construction_year, floor_covering (JSONB)
FinancialData               sale_price, payment_type, payment_schedule_notes, notary_info (JSONB)
UnitOwner                   id, unit_id, user_id, first_name, last_name, phone, email, invited_at, accepted_at
UnitWithOwner               Unit + owners: UnitOwner[]
Defect                      id, unit_id, submitted_by, title, description, status, created_at
DefectStatus                'pateikta' | 'sprendziama' | 'atlikta'
DefectAttachment            id, defect_id, storage_path, uploaded_by, created_at
DefectReply                 id, defect_id, author_id, body, created_at
DefectReplyAttachment       id, reply_id, storage_path, created_at
DefectWithDetails           Defect + attachments + replies (with attachments)
Document                    id, unit_id, category, name, storage_path, uploaded_by, created_at
Contact                     id, category, title, company_name, phone, email, description, footnote, created_at
ContactDocument             id, contact_id, name, storage_path, created_at
UnitService                 id, unit_id, category, meter_number, description, completed_at, created_at
                            category: 'electrical' | 'water' | 'heating' | 'waste'
```

`Unit.technical_data` and `Unit.financial_data` are `jsonb` columns — typed as `TechnicalData | null` and `FinancialData | null`.

### Database Migrations

| File | Description |
|------|-------------|
| `001_initial_schema.sql` | Core tables: estates, units, unit_owners, defects, defect_*, documents |
| `002_rls_policies.sql` | RLS on all tables using `is_admin()` and `owner_unit_id()` |
| `003_storage.sql` | Storage buckets + storage.objects RLS |
| `004_unit_owners_unique.sql` | Composite UNIQUE(unit_id, user_id) on unit_owners |
| `005_add_contacts.sql` | contacts + contact_documents tables with RLS |
| `006_estate_cover_photo.sql` | cover_image_url column on estates |
| `007_add_unit_services.sql` | unit_services table with RLS |
| `008_unit_owners_multi_owner.sql` | Drop single-owner constraint, add first_name/last_name/phone to unit_owners |

Never edit applied migrations — always create a new one.

### Server Actions (`lib/actions/`)

| File | Actions |
|------|---------|
| `estates.ts` | `createEstate`, `updateEstate`, `deleteEstate` |
| `units.ts` | `updateUnitTechnicalData`, `updateUnitFinancialData`, `uploadUnitDocument`, `uploadUnitPhoto`, `deleteUnitDocument` |
| `defects.ts` | `submitDefect`, `updateDefectStatus`, `addDefectReply`, `uploadDefectAttachment` |
| `invitations.ts` | `inviteOwner` (batch multi-owner, sends Resend email) |
| `contacts.ts` | `createContact`, `updateContact`, `deleteContact`, `uploadContactDocument` |
| `services.ts` | `upsertUnitService`, `markServiceCompleted` |

### Design System Rules

All colors via CSS custom properties — **no hardcoded hex or oklch values in JSX/TSX**. Key tokens:

```
--primary              gold  oklch(0.68 0.10 60)
--sidebar              dark navy oklch(0.22 0.03 255)
--background           off-white oklch(0.97 0.005 90)
--status-pateikta      muted grey
--status-sprendziama   amber
--status-atlikta       green
```

Status badge colors use Tailwind arbitrary syntax `[background:var(--status-pateikta)]` — not inline styles.

Use `shadcn/ui` components before writing any raw HTML. `Card`, `Table`, `Dialog`, `Tabs`, `Badge`, `Form`, `Sidebar`, `Skeleton`, `Sonner` are all installed. Check `components/ui/` before creating anything new.

Both admin and portal have fixed bottom navigation bars on mobile (`components/admin/admin-bottom-nav.tsx`, `components/portal/portal-bottom-nav.tsx`).

### Next.js 16 Specifics

This project runs **Next.js 16.2.6** which has breaking changes from 15.x:

- Route guard file is `proxy.ts` (not `middleware.ts`) — exports `proxy` function, not `middleware`
- Read `node_modules/next/dist/docs/` before using any Next.js API — training data may be outdated
- `cookies()` is async — always `await cookies()`

### Multi-Owner Units

A unit can have multiple owners (migration 008 removed the single-owner UNIQUE constraint). `unit_owners` rows have `first_name`, `last_name`, `phone`, `email` contact fields in addition to `user_id`. The `inviteOwner` action accepts an array of owners and creates/invites each one.
