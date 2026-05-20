<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This project runs **Next.js 16.2.6**. Breaking changes from 15.x that will trip you up:

- Route guard is `proxy.ts` at the root (not `middleware.ts`) — exports `proxy`, not `middleware`
- `cookies()` is async — always `await cookies()`
- Read `node_modules/next/dist/docs/` before using any Next.js API — your training data is likely outdated
<!-- END:nextjs-agent-rules -->

# Architecture Quick Reference

## What is this?

ELPEKAS — property management CMS. Two surfaces:
- `/admin/*` — company staff (role = `"admin"`)
- `/portal/*` — home owners (role = `"owner"`)

Role is stored in **Supabase `user_metadata.role`** — not a DB table. No `profiles` table exists.

## Supabase clients — use the right one

| Import from | Use when |
|-------------|----------|
| `lib/supabase/client.ts` | Client components (`"use client"`) |
| `lib/supabase/server.ts` | Server Components, Server Actions |
| `lib/supabase/admin.ts` | Storage uploads, auth admin API — **server only, never client** |

## Server Actions — not API routes

All mutations go through Server Actions in `lib/actions/`. No API routes for CRUD. Every admin action calls `requireAdmin()` at the top.

## Storage

Two private buckets:
- `unit-files` — documents, photos, defect attachments (`documents/{unitId}/`, `photos/{unitId}/`, `defects/{defectId}/`)
- `property-files` — estate-level files (`estates/{estateId}/`)

Signed URL routes: `GET /api/documents/[id]/download` and `GET /api/storage/preview?path=`

## Database

RLS on every table. Key helper functions: `is_admin()`, `owner_unit_id()`.

Applied migrations: 001 (schema) → 002 (RLS) → 003 (storage) → 004 (unit_owners unique) → 005 (contacts) → 006 (estate cover photo) → 007 (unit_services) → 008 (multi-owner).

Never edit applied migrations — create a new numbered file.

## Build status

`npm run build` passes clean — 21 routes, 0 TypeScript errors. All 10 original plan tasks plus post-plan features are complete.
