# Contacts Library Feature — Design Spec

**Date:** 2026-05-20  
**Status:** Approved

---

## Overview

Admin manages a global library of service provider contacts (contractors, utility companies, etc.). Contacts are assigned to estates. Owners viewing their portal see only the contacts assigned to their estate.

---

## Data Model

### `contacts` table
Global reusable library. No estate foreign key — contacts are estate-agnostic until assigned.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| category | text NOT NULL | One of: `windows`, `heating`, `water`, `electrical`, `waste`, `internet`, `general`, `construction` |
| title | text NOT NULL | Service description, e.g. "Langų reguliavimas ir eksploatacija" |
| company_name | text | e.g. "UAB Vinkelis ir Ko" |
| phone | text | |
| email | text | |
| description | text | Shown in the accordion body |
| footnote | text | Optional small-print note |
| created_at | timestamptz | DEFAULT now() |

### `contact_documents` table
Files attached to a contact (stored in `property-files` bucket).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| contact_id | uuid | FK → contacts(id) ON DELETE CASCADE |
| name | text NOT NULL | Display filename |
| storage_path | text NOT NULL | Path in `property-files` bucket: `contacts/{contactId}/{filename}` |
| created_at | timestamptz | DEFAULT now() |

### `estate_contacts` table
Junction: which contacts are assigned to which estate.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| estate_id | uuid | FK → estates(id) ON DELETE CASCADE |
| contact_id | uuid | FK → contacts(id) ON DELETE CASCADE |
| created_at | timestamptz | DEFAULT now() |
| — | UNIQUE | (estate_id, contact_id) |

### RLS policies
- `contacts`: admins full CRUD via `is_admin()`. Owners SELECT only — filtered via `estate_contacts` join to their unit's estate (`owner_unit_id()`).
- `contact_documents`: same access pattern as `contacts`.
- `estate_contacts`: admins full CRUD. Owners SELECT — `estate_id` must equal their unit's estate_id.

---

## TypeScript Types (additions to `lib/types.ts`)

```ts
export type ContactCategory =
  | 'windows' | 'heating' | 'water' | 'electrical'
  | 'waste' | 'internet' | 'general' | 'construction'

export interface Contact {
  id: string
  category: ContactCategory
  title: string
  company_name: string | null
  phone: string | null
  email: string | null
  description: string | null
  footnote: string | null
  created_at: string
}

export interface ContactDocument {
  id: string
  contact_id: string
  name: string
  storage_path: string
  created_at: string
}

export interface ContactWithDocuments extends Contact {
  documents: ContactDocument[]
}
```

---

## Server Actions (`lib/actions/contacts.ts`)

All actions call `requireAdmin()` first.

| Action | Signature | Notes |
|--------|-----------|-------|
| `createContact` | `(data: ContactFormData) → Contact` | INSERT into contacts |
| `updateContact` | `(id, data) → Contact` | UPDATE contacts |
| `deleteContact` | `(id) → void` | DELETE — cascades to documents and estate_contacts |
| `uploadContactDocument` | `(contactId, file, name) → ContactDocument` | Upload to storage + INSERT contact_documents |
| `deleteContactDocument` | `(id) → void` | Delete from storage + DELETE row |
| `assignContactToEstate` | `(estateId, contactId) → void` | INSERT estate_contacts (upsert) |
| `removeContactFromEstate` | `(estateId, contactId) → void` | DELETE from estate_contacts |

---

## Admin UI

### New page: `/admin/contacts`

- `PageHeader` title="Kontaktai" description="Kontaktų biblioteka"
- Table columns: category icon | Title | Company | Phone | Email | Actions
- "Pridėti kontaktą" button → `ContactFormDialog`
- Per-row actions: Edit (opens dialog prefilled) | Documents (inline expand) | Delete (confirm)
- Document section per row: lists attached files with delete, plus upload button

### `ContactFormDialog` component
Form fields: category (Select with icons), title (Input), company_name, phone, email, description (Textarea), footnote (Textarea). Uses React Hook Form + Zod. Submit calls `createContact` or `updateContact`.

### Estate detail page additions
Below the photos section, new "Kontaktai" section:
- Header "Kontaktai" + "Pridėti" button
- Assigned contacts shown as compact rows: icon + title + company + remove button
- "Pridėti" → `AssignContactDialog`: lists all library contacts as a searchable list with checkboxes, calls `assignContactToEstate` on confirm

---

## Portal

`/portal/kontaktai/page.tsx` converted from client component (hardcoded) to async server component:

1. `createClient()` → get user → get unit_id via `unit_owners`
2. Query: `estates` joined through `units` to get `estate_id`
3. Query `estate_contacts` → join `contacts` + `contact_documents` for that estate
4. Generate signed URLs for each document (1hr expiry) via admin client
5. Pass data to the existing `ContractorCard` accordion UI (same visual, real data)

The `ContractorCard` component and its UI stay unchanged — only the data source changes.

---

## Storage

Bucket: `property-files` (existing, private)  
Contact document path: `contacts/{contactId}/{filename}`

---

## Migration

Single new migration file: `supabase/migrations/TIMESTAMP_add_contacts.sql`
- CREATE TABLE contacts
- CREATE TABLE contact_documents  
- CREATE TABLE estate_contacts
- RLS policies for all three tables
- Helper functions already exist (`is_admin()`, `owner_unit_id()`)

---

## Out of Scope

- Contact "categories" as a separate DB table (using enum/string is sufficient)
- Per-unit contact overrides (estate-level only)
- Owner ability to add/edit contacts
- Contact tags or search beyond the admin table
