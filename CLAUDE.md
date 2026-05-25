# CLAUDE.md

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server
npm run build    # production build + type-check
npm run lint     # ESLint
```

No test suite — `npm run build` is the correctness check.

## Architecture

ELPEKAS — property management CMS. Two surfaces:
- `/admin/*` — staff: estates, units, defects, documents, contacts
- `/portal/*` — owners: unit overview, defects, photos, services, contacts

### Auth & Role Model

Role in `user_metadata.role` (`"admin"` | `"owner"`). No `profiles` table.
- Route guard: `proxy.ts` (not `middleware.ts`) — Next.js 16 rename
- Every Server Action calls `requireAdmin()` — checks metadata, not DB
- `cookies()` is async — always `await cookies()`

### Supabase Clients

| File | Use when |
|------|----------|
| `lib/supabase/client.ts` | `"use client"` components |
| `lib/supabase/server.ts` | Server Components + Server Actions |
| `lib/supabase/admin.ts` | Storage uploads, auth admin — **server only** |

RLS on every table. Helpers: `is_admin()`, `owner_unit_id()`.

### Data Flow

Server Components fetch via `lib/supabase/server.ts`. All mutations → Server Actions in `lib/actions/`. No API routes for CRUD. Storage signed URLs via `lib/supabase/admin.ts`.

Buckets (both private): `unit-files` (`documents/`, `photos/`, `defects/`), `property-files` (`estates/`).

### Design System

All colors via CSS variables — **no hardcoded hex or oklch in JSX/TSX**.
Status badges: use Tailwind arbitrary syntax e.g. `[background:var(--status-pateikta)]` — not inline styles.
Check `components/ui/` before writing raw HTML. Both surfaces have mobile bottom nav bars.

### Migrations

Never edit applied migrations — always create a new numbered file. Current highest: `014`.
