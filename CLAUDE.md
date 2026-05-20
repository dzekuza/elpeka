# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server
npm run build    # production build (also type-checks)
npm run lint     # ESLint
```

No test suite yet — verify correctness via `npm run build` (`tsc --noEmit` equivalent).

## Architecture

**ELPEKAS** is a property management CMS for a single construction company. Two distinct user surfaces:
- `/admin/*` — company staff manage estates, units, defects, documents, invite owners
- `/portal/*` — home owners view their unit, track defects, download documents

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

Storage bucket: `property-files` (private). Path convention: `documents/${unitId}/...`, `photos/${unitId}/...`.

### Key Types (`lib/types.ts`)

```
Estate, Unit, UnitOwner, UnitWithOwner, EstateWithUnitCount
Defect, DefectStatus ('pateikta' | 'sprendziama' | 'atlikta')
DefectAttachment, DefectReply, DefectReplyAttachment, DefectWithDetails
Document, TechnicalData, FinancialData (both stored as JSONB in units table)
```

`Unit.technical_data` and `Unit.financial_data` are `jsonb` columns — typed as `TechnicalData | null` and `FinancialData | null`.

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

Use `shadcn/ui` components before writing any raw HTML. `Card`, `Table`, `Dialog`, `Tabs`, `Badge`, `Form`, `Sidebar` are all installed. Check `components/ui/` before creating anything new.

### Next.js 16 Specifics

This project runs **Next.js 16.2.6** which has breaking changes from 15.x:

- Route guard file is `proxy.ts` (not `middleware.ts`) — exports `proxy` function, not `middleware`
- Read `node_modules/next/dist/docs/` before using any Next.js API — training data may be outdated
- `cookies()` is async — always `await cookies()`

### Known Gaps (as of Task 5)

- `/api/documents/[id]/download` route not implemented — document download links are broken
- `unit-files` Supabase storage bucket needs to be created (only `property-files` exists)
- Tasks 6–10 from `PLAN.md` are not yet built: Admin Defects, Owner Portal, Invite flow, Email templates, Final Polish
