# Contacts Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable contact library that admin manages globally, assigns per estate, and owners see in the portal.

**Architecture:** Three new DB tables (`contacts`, `contact_documents`, `estate_contacts`), a new `/admin/contacts` library page, a contacts section added to the estate detail page, and the portal `/portal/kontaktai` page converted from hardcoded data to a server component reading from the DB.

**Tech Stack:** Next.js 15 App Router, Supabase (PostgreSQL + Storage), Server Actions, shadcn/ui, React Hook Form + Zod, @phosphor-icons/react

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/005_add_contacts.sql` | Create | Tables + RLS for contacts, contact_documents, estate_contacts |
| `lib/types.ts` | Modify | Add ContactCategory, Contact, ContactDocument, ContactWithDocuments |
| `lib/actions/contacts.ts` | Create | All contact server actions |
| `components/admin/admin-sidebar.tsx` | Modify | Add Contacts nav item |
| `components/admin/contact-form-dialog.tsx` | Create | Add/edit contact dialog |
| `components/admin/contact-documents-section.tsx` | Create | Upload/list/delete docs per contact |
| `components/admin/estate-contacts-section.tsx` | Create | Assign/unassign contacts on estate page |
| `app/admin/contacts/page.tsx` | Create | Admin contacts library page |
| `app/admin/estates/[id]/page.tsx` | Modify | Add EstateContactsSection below photos |
| `app/portal/kontaktai/page.tsx` | Modify | Replace hardcoded array with DB fetch |

---

### Task 1: Database migration

**Files:**
- Create: `supabase/migrations/005_add_contacts.sql`

- [ ] **Step 1: Create migration file**

```sql
-- supabase/migrations/005_add_contacts.sql

create table contacts (
  id           uuid primary key default gen_random_uuid(),
  category     text not null check (category in (
                 'windows','heating','water','electrical',
                 'waste','internet','general','construction')),
  title        text not null,
  company_name text,
  phone        text,
  email        text,
  description  text,
  footnote     text,
  created_at   timestamptz not null default now()
);

create table contact_documents (
  id           uuid primary key default gen_random_uuid(),
  contact_id   uuid not null references contacts(id) on delete cascade,
  name         text not null,
  storage_path text not null,
  created_at   timestamptz not null default now()
);

create table estate_contacts (
  id         uuid primary key default gen_random_uuid(),
  estate_id  uuid not null references estates(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(estate_id, contact_id)
);

-- RLS
alter table contacts enable row level security;
alter table contact_documents enable row level security;
alter table estate_contacts enable row level security;

-- contacts: admins full CRUD
create policy "admins_all_contacts" on contacts
  for all using (is_admin());

-- contacts: owners can read contacts assigned to their estate
create policy "owners_read_assigned_contacts" on contacts
  for select using (
    id in (
      select contact_id from estate_contacts
      where estate_id = (
        select estate_id from units where id = owner_unit_id()
      )
    )
  );

-- contact_documents: admins full CRUD
create policy "admins_all_contact_documents" on contact_documents
  for all using (is_admin());

-- contact_documents: owners can read docs for contacts assigned to their estate
create policy "owners_read_assigned_contact_docs" on contact_documents
  for select using (
    contact_id in (
      select contact_id from estate_contacts
      where estate_id = (
        select estate_id from units where id = owner_unit_id()
      )
    )
  );

-- estate_contacts: admins full CRUD
create policy "admins_all_estate_contacts" on estate_contacts
  for all using (is_admin());

-- estate_contacts: owners can read their estate's assignments
create policy "owners_read_own_estate_contacts" on estate_contacts
  for select using (
    estate_id = (
      select estate_id from units where id = owner_unit_id()
    )
  );
```

- [ ] **Step 2: Apply migration via Supabase MCP**

Use `mcp__plugin_supabase_supabase__apply_migration` with the SQL above, or run:
```bash
supabase db push
```

Expected: migration applied, three new tables visible in Supabase dashboard.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/005_add_contacts.sql
git commit -m "feat: add contacts, contact_documents, estate_contacts tables with RLS"
```

---

### Task 2: TypeScript types

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Add types to `lib/types.ts`**

Append at the end of the file:

```ts
export type ContactCategory =
  | 'windows'
  | 'heating'
  | 'water'
  | 'electrical'
  | 'waste'
  | 'internet'
  | 'general'
  | 'construction'

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

- [ ] **Step 2: Verify build is clean**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add Contact, ContactDocument, ContactWithDocuments types"
```

---

### Task 3: Server actions

**Files:**
- Create: `lib/actions/contacts.ts`

- [ ] **Step 1: Create `lib/actions/contacts.ts`**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Contact, ContactDocument, ContactCategory } from '@/lib/types'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  if (user.user_metadata?.role !== 'admin') throw new Error('Forbidden')
  return { supabase, user }
}

export async function createContact(data: {
  category: ContactCategory
  title: string
  company_name: string | null
  phone: string | null
  email: string | null
  description: string | null
  footnote: string | null
}): Promise<Contact> {
  const { supabase } = await requireAdmin()

  const { data: contact, error } = await supabase
    .from('contacts')
    .insert(data)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/admin/contacts')
  return contact as Contact
}

export async function updateContact(
  id: string,
  data: {
    category: ContactCategory
    title: string
    company_name: string | null
    phone: string | null
    email: string | null
    description: string | null
    footnote: string | null
  }
): Promise<Contact> {
  const { supabase } = await requireAdmin()

  const { data: contact, error } = await supabase
    .from('contacts')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/admin/contacts')
  return contact as Contact
}

export async function deleteContact(id: string): Promise<void> {
  const { supabase } = await requireAdmin()
  const adminClient = createAdminClient()

  // Delete all storage files for this contact's documents
  const { data: docs } = await supabase
    .from('contact_documents')
    .select('storage_path')
    .eq('contact_id', id)

  if (docs && docs.length > 0) {
    await adminClient.storage
      .from('unit-files')
      .remove(docs.map((d) => d.storage_path))
  }

  const { error } = await supabase.from('contacts').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/contacts')
}

export async function uploadContactDocument(
  contactId: string,
  formData: FormData
): Promise<ContactDocument> {
  const { supabase, user } = await requireAdmin()
  const adminClient = createAdminClient()

  const file = formData.get('file') as File | null
  if (!file) throw new Error('Trūksta failo')

  const fileName = `${Date.now()}-${file.name}`
  const storagePath = `contacts/${contactId}/${fileName}`
  const buffer = new Uint8Array(await file.arrayBuffer())

  const { error: uploadError } = await adminClient.storage
    .from('unit-files')
    .upload(storagePath, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (uploadError) throw new Error(uploadError.message)

  const { data: doc, error: dbError } = await supabase
    .from('contact_documents')
    .insert({ contact_id: contactId, name: file.name, storage_path: storagePath })
    .select()
    .single()

  if (dbError) {
    await adminClient.storage.from('unit-files').remove([storagePath])
    throw new Error(dbError.message)
  }

  revalidatePath('/admin/contacts')
  return doc as ContactDocument
}

export async function deleteContactDocument(
  id: string,
  storagePath: string
): Promise<void> {
  const { supabase } = await requireAdmin()
  const adminClient = createAdminClient()

  const { error: dbError } = await supabase
    .from('contact_documents')
    .delete()
    .eq('id', id)

  if (dbError) throw new Error(dbError.message)

  await adminClient.storage.from('unit-files').remove([storagePath])
  revalidatePath('/admin/contacts')
}

export async function assignContactToEstate(
  estateId: string,
  contactId: string
): Promise<void> {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('estate_contacts')
    .upsert({ estate_id: estateId, contact_id: contactId })

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/estates/${estateId}`)
}

export async function removeContactFromEstate(
  estateId: string,
  contactId: string
): Promise<void> {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('estate_contacts')
    .delete()
    .eq('estate_id', estateId)
    .eq('contact_id', contactId)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/estates/${estateId}`)
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: compiles cleanly.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/contacts.ts
git commit -m "feat: add contacts server actions"
```

---

### Task 4: Admin sidebar — add Contacts nav item

**Files:**
- Modify: `components/admin/admin-sidebar.tsx`

- [ ] **Step 1: Add AddressBook import and nav item**

In `components/admin/admin-sidebar.tsx`, change the imports line from:
```ts
import { Buildings, WarningCircle, SignOut } from '@phosphor-icons/react'
```
to:
```ts
import { AddressBook, Buildings, SignOut, WarningCircle } from '@phosphor-icons/react'
```

Then add to the `navItems` array after the defects entry:
```ts
  {
    label: 'Kontaktai',
    href: '/admin/contacts',
    icon: AddressBook,
  },
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: no errors, sidebar compiles.

- [ ] **Step 3: Commit**

```bash
git add components/admin/admin-sidebar.tsx
git commit -m "feat: add Contacts nav item to admin sidebar"
```

---

### Task 5: ContactFormDialog component

**Files:**
- Create: `components/admin/contact-form-dialog.tsx`

- [ ] **Step 1: Create `components/admin/contact-form-dialog.tsx`**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createContact, updateContact } from '@/lib/actions/contacts'
import type { Contact, ContactCategory } from '@/lib/types'

const CATEGORIES: { value: ContactCategory; label: string }[] = [
  { value: 'windows', label: 'Langai' },
  { value: 'heating', label: 'Šildymas' },
  { value: 'water', label: 'Vanduo' },
  { value: 'electrical', label: 'Elektra' },
  { value: 'waste', label: 'Atliekų išvežimas' },
  { value: 'internet', label: 'Internetas' },
  { value: 'general', label: 'Bendrasis' },
  { value: 'construction', label: 'Statybos darbai' },
]

const schema = z.object({
  category: z.enum([
    'windows', 'heating', 'water', 'electrical',
    'waste', 'internet', 'general', 'construction',
  ] as const),
  title: z.string().min(1, 'Privalomas laukas'),
  company_name: z.string().nullable().default(null),
  phone: z.string().nullable().default(null),
  email: z.string().email('Neteisingas el. paštas').nullable().or(z.literal('')).transform(v => v || null).default(null),
  description: z.string().nullable().default(null),
  footnote: z.string().nullable().default(null),
})

type FormValues = z.infer<typeof schema>

interface ContactFormDialogProps {
  contact?: Contact
  trigger: React.ReactNode
}

export function ContactFormDialog({ contact, trigger }: ContactFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: contact?.category ?? 'general',
      title: contact?.title ?? '',
      company_name: contact?.company_name ?? null,
      phone: contact?.phone ?? null,
      email: contact?.email ?? null,
      description: contact?.description ?? null,
      footnote: contact?.footnote ?? null,
    },
  })

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        if (contact) {
          await updateContact(contact.id, values)
          toast.success('Kontaktas atnaujintas')
        } else {
          await createContact(values)
          toast.success('Kontaktas sukurtas')
        }
        setOpen(false)
        form.reset()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Klaida')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{contact ? 'Redaguoti kontaktą' : 'Naujas kontaktas'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategorija</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pasirinkite kategoriją" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paslaugos pavadinimas</FormLabel>
                  <FormControl>
                    <Input placeholder="pvz. Langų reguliavimas ir eksploatacija" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Įmonė</FormLabel>
                  <FormControl>
                    <Input placeholder='pvz. UAB "Vinkelis ir Ko"' {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefonas</FormLabel>
                    <FormControl>
                      <Input placeholder="+370 600 00000" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>El. paštas</FormLabel>
                    <FormControl>
                      <Input placeholder="info@imone.lt" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aprašymas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Trumpas paslaugos aprašymas savininkams"
                      rows={3}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="footnote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pastaba (neprivaloma)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="pvz. *Suteikiama nemokama 5 metų garantija"
                      rows={2}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Atšaukti
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saugoma…' : 'Išsaugoti'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add components/admin/contact-form-dialog.tsx
git commit -m "feat: add ContactFormDialog component"
```

---

### Task 6: ContactDocumentsSection component

**Files:**
- Create: `components/admin/contact-documents-section.tsx`

- [ ] **Step 1: Create `components/admin/contact-documents-section.tsx`**

```tsx
'use client'

import { useRef, useTransition } from 'react'
import { toast } from 'sonner'
import { File, Trash, UploadSimple } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { uploadContactDocument, deleteContactDocument } from '@/lib/actions/contacts'
import type { ContactDocument } from '@/lib/types'

interface ContactDocumentsSectionProps {
  contactId: string
  documents: ContactDocument[]
}

export function ContactDocumentsSection({
  contactId,
  documents,
}: ContactDocumentsSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.append('file', file)
        await uploadContactDocument(contactId, fd)
        toast.success('Dokumentas įkeltas')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Klaida įkeliant')
      } finally {
        if (inputRef.current) inputRef.current.value = ''
      }
    })
  }

  function handleDelete(doc: ContactDocument) {
    startTransition(async () => {
      try {
        await deleteContactDocument(doc.id, doc.storage_path)
        toast.success('Dokumentas ištrintas')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Klaida trinant')
      }
    })
  }

  return (
    <div className="flex flex-col gap-2">
      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">Dokumentų nėra</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5"
            >
              <File className="size-4 text-muted-foreground" />
              <span className="text-sm">{doc.name}</span>
              <button
                onClick={() => handleDelete(doc)}
                disabled={isPending}
                className="text-muted-foreground hover:text-destructive disabled:opacity-50"
              >
                <Trash className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleUpload}
          accept=".pdf,.doc,.docx,.xlsx,.png,.jpg"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
        >
          <UploadSimple className="size-4 mr-2" />
          {isPending ? 'Įkeliama…' : 'Pridėti dokumentą'}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add components/admin/contact-documents-section.tsx
git commit -m "feat: add ContactDocumentsSection component"
```

---

### Task 7: Admin contacts library page

**Files:**
- Create: `app/admin/contacts/page.tsx`

- [ ] **Step 1: Create `app/admin/contacts/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Plus } from '@phosphor-icons/react/dist/ssr'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { ContactFormDialog } from '@/components/admin/contact-form-dialog'
import { ContactDocumentsSection } from '@/components/admin/contact-documents-section'
import { ContactRowActions } from '@/components/admin/contact-row-actions'
import type { Contact, ContactDocument } from '@/lib/types'

const CATEGORY_LABELS: Record<string, string> = {
  windows: 'Langai',
  heating: 'Šildymas',
  water: 'Vanduo',
  electrical: 'Elektra',
  waste: 'Atliekų išvežimas',
  internet: 'Internetas',
  general: 'Bendrasis',
  construction: 'Statybos darbai',
}

export default async function AdminContactsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') redirect('/login')

  const { data: contacts } = await supabase
    .from('contacts')
    .select('*, documents:contact_documents(*)')
    .order('created_at', { ascending: false })

  const rows = (contacts ?? []) as (Contact & { documents: ContactDocument[] })[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Kontaktai" description="Kontaktų biblioteka" />
        <ContactFormDialog
          trigger={
            <Button>
              <Plus className="size-4 mr-2" />
              Pridėti kontaktą
            </Button>
          }
        />
      </div>

      <div className="flex flex-col gap-4">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-10 text-center">
            Kontaktų biblioteka tuščia. Pridėkite pirmą kontaktą.
          </p>
        ) : (
          rows.map((contact) => (
            <div
              key={contact.id}
              className="rounded-[16px] bg-white p-6 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {CATEGORY_LABELS[contact.category] ?? contact.category}
                    </span>
                  </div>
                  <p className="text-lg font-medium text-foreground">{contact.title}</p>
                  {contact.company_name && (
                    <p className="text-sm text-muted-foreground">{contact.company_name}</p>
                  )}
                  <div className="flex flex-wrap gap-4 mt-1">
                    {contact.phone && (
                      <span className="text-sm text-foreground">{contact.phone}</span>
                    )}
                    {contact.email && (
                      <span className="text-sm text-foreground">{contact.email}</span>
                    )}
                  </div>
                </div>
                <ContactRowActions contact={contact} />
              </div>

              <ContactDocumentsSection
                contactId={contact.id}
                documents={contact.documents}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `components/admin/contact-row-actions.tsx`**

This is a small client component for the edit/delete buttons (needed because deleteContact is a server action called from a client event).

```tsx
'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { PencilSimpleLine, Trash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { ContactFormDialog } from '@/components/admin/contact-form-dialog'
import { deleteContact } from '@/lib/actions/contacts'
import type { Contact } from '@/lib/types'

interface ContactRowActionsProps {
  contact: Contact
}

export function ContactRowActions({ contact }: ContactRowActionsProps) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm(`Ištrinti "${contact.title}"?`)) return
    startTransition(async () => {
      try {
        await deleteContact(contact.id)
        toast.success('Kontaktas ištrintas')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Klaida')
      }
    })
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <ContactFormDialog
        contact={contact}
        trigger={
          <Button variant="ghost" size="icon">
            <PencilSimpleLine className="size-4" />
          </Button>
        }
      />
      <Button
        variant="ghost"
        size="icon"
        disabled={isPending}
        onClick={handleDelete}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash className="size-4" />
      </Button>
    </div>
  )
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: `/admin/contacts` page builds cleanly.

- [ ] **Step 4: Commit**

```bash
git add app/admin/contacts/page.tsx components/admin/contact-row-actions.tsx
git commit -m "feat: add admin contacts library page"
```

---

### Task 8: EstateContactsSection component

**Files:**
- Create: `components/admin/estate-contacts-section.tsx`

- [ ] **Step 1: Create `components/admin/estate-contacts-section.tsx`**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { assignContactToEstate, removeContactFromEstate } from '@/lib/actions/contacts'
import type { Contact } from '@/lib/types'

const CATEGORY_LABELS: Record<string, string> = {
  windows: 'Langai',
  heating: 'Šildymas',
  water: 'Vanduo',
  electrical: 'Elektra',
  waste: 'Atliekų išvežimas',
  internet: 'Internetas',
  general: 'Bendrasis',
  construction: 'Statybos darbai',
}

interface EstateContactsSectionProps {
  estateId: string
  assignedContacts: Contact[]
  allContacts: Contact[]
}

export function EstateContactsSection({
  estateId,
  assignedContacts,
  allContacts,
}: EstateContactsSectionProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const assignedIds = new Set(assignedContacts.map((c) => c.id))
  const unassigned = allContacts.filter((c) => !assignedIds.has(c.id))

  function handleAssign(contactId: string) {
    startTransition(async () => {
      try {
        await assignContactToEstate(estateId, contactId)
        toast.success('Kontaktas priskirtas')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Klaida')
      }
    })
  }

  function handleRemove(contactId: string) {
    startTransition(async () => {
      try {
        await removeContactFromEstate(estateId, contactId)
        toast.success('Kontaktas pašalintas')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Klaida')
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {assignedContacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Kontaktų nėra. Pridėkite iš bibliotekos.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {assignedContacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center justify-between gap-4 rounded-[12px] border border-border bg-white px-4 py-3"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">
                  {CATEGORY_LABELS[contact.category] ?? contact.category}
                </span>
                <span className="text-sm font-medium text-foreground">{contact.title}</span>
                {contact.company_name && (
                  <span className="text-xs text-muted-foreground">{contact.company_name}</span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                disabled={isPending}
                onClick={() => handleRemove(contact.id)}
                className="text-muted-foreground hover:text-destructive shrink-0"
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="self-start">
            <Plus className="size-4 mr-2" />
            Pridėti kontaktą
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pridėti kontaktą iš bibliotekos</DialogTitle>
          </DialogHeader>
          {unassigned.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Visi bibliotekos kontaktai jau priskirti.
            </p>
          ) : (
            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
              {unassigned.map((contact) => (
                <button
                  key={contact.id}
                  disabled={isPending}
                  onClick={() => {
                    handleAssign(contact.id)
                    setOpen(false)
                  }}
                  className="flex flex-col gap-0.5 rounded-[12px] border border-border px-4 py-3 text-left hover:bg-muted/50 transition-colors disabled:opacity-50"
                >
                  <span className="text-xs text-muted-foreground">
                    {CATEGORY_LABELS[contact.category] ?? contact.category}
                  </span>
                  <span className="text-sm font-medium text-foreground">{contact.title}</span>
                  {contact.company_name && (
                    <span className="text-xs text-muted-foreground">{contact.company_name}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add components/admin/estate-contacts-section.tsx
git commit -m "feat: add EstateContactsSection component"
```

---

### Task 9: Wire EstateContactsSection into estate detail page

**Files:**
- Modify: `app/admin/estates/[id]/page.tsx`

- [ ] **Step 1: Add imports to the estate detail page**

In `app/admin/estates/[id]/page.tsx`, add these two imports after the existing import block:

```ts
import { EstateContactsSection } from '@/components/admin/estate-contacts-section'
import type { Contact } from '@/lib/types'
```

- [ ] **Step 2: Fetch contacts data**

Inside `EstateDetailPage`, after the estate photos fetch block (after `estatePhotos` is built) and before the `unitOwnersData` fetch, add:

```ts
  // Fetch all library contacts + which are assigned to this estate
  const { data: allContactsData } = await supabase
    .from('contacts')
    .select('*')
    .order('title', { ascending: true })

  const allContacts = (allContactsData ?? []) as Contact[]

  const { data: assignedData } = await supabase
    .from('estate_contacts')
    .select('contact_id')
    .eq('estate_id', id)

  const assignedIds = new Set((assignedData ?? []).map((r) => r.contact_id))
  const assignedContacts = allContacts.filter((c) => assignedIds.has(c.id))
```

- [ ] **Step 3: Add EstateContactsSection to JSX**

In the return JSX, after the photos `<div>` block and before the units `<div>` block, add:

```tsx
      <div>
        <h2 className="text-lg font-medium mb-4">Kontaktai</h2>
        <EstateContactsSection
          estateId={id}
          assignedContacts={assignedContacts}
          allContacts={allContacts}
        />
      </div>
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: estate detail page builds, no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add "app/admin/estates/[id]/page.tsx"
git commit -m "feat: add contacts section to estate detail page"
```

---

### Task 10: Portal contacts page — make dynamic

**Files:**
- Modify: `app/portal/kontaktai/page.tsx`

- [ ] **Step 1: Replace the entire file with a server component**

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/page-header'
import { PortalContactCard } from '@/components/portal/portal-contact-card'
import type { ContactWithDocuments } from '@/lib/types'

export default async function KontaktaiPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get unit → estate for this owner
  const { data: ownership } = await supabase
    .from('unit_owners')
    .select('unit_id, units(estate_id)')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .maybeSingle()

  const estateId = (ownership?.units as { estate_id: string } | null)?.estate_id ?? null

  let contacts: (ContactWithDocuments & { documentUrls: Record<string, string> })[] = []

  if (estateId) {
    const { data: rows } = await supabase
      .from('estate_contacts')
      .select('contacts(*, documents:contact_documents(*))')
      .eq('estate_id', estateId)

    const raw = (rows ?? [])
      .map((r) => r.contacts)
      .filter(Boolean) as (ContactWithDocuments)[]

    // Generate signed URLs for all documents
    contacts = await Promise.all(
      raw.map(async (contact) => {
        const documentUrls: Record<string, string> = {}
        if (contact.documents.length > 0) {
          const { data: signed } = await adminClient.storage
            .from('unit-files')
            .createSignedUrls(
              contact.documents.map((d) => d.storage_path),
              60 * 60
            )
          for (const s of signed ?? []) {
            if (s.signedUrl && s.path) {
              const doc = contact.documents.find((d) => d.storage_path === s.path)
              if (doc) documentUrls[doc.id] = s.signedUrl
            }
          }
        }
        return { ...contact, documentUrls }
      })
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Kontaktai"
        description="Čia rasite rangovų informaciją susijusią su jūsų objektu"
      />

      {contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground py-10 text-center">
          Kontaktų kol kas nėra.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {contacts.map((contact) => (
            <PortalContactCard
              key={contact.id}
              contact={contact}
              documentUrls={contact.documentUrls}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create `components/portal/portal-contact-card.tsx`**

This extracts the accordion card from the old kontaktai page into a standalone client component that accepts typed props from the server:

```tsx
'use client'

import { useState } from 'react'
import {
  AppWindow,
  ThermometerHot,
  Drop,
  Lightning,
  Trash,
  WifiHigh,
  Buildings,
  Hammer,
  BuildingOffice,
  Phone,
  EnvelopeOpen,
  File,
  ArrowUpRight,
  CaretDown,
  DownloadSimple,
} from '@phosphor-icons/react'
import type { ContactWithDocuments, ContactCategory } from '@/lib/types'

const CATEGORY_ICONS: Record<ContactCategory, React.ElementType> = {
  windows: AppWindow,
  heating: ThermometerHot,
  water: Drop,
  electrical: Lightning,
  waste: Trash,
  internet: WifiHigh,
  general: Buildings,
  construction: Hammer,
}

interface PortalContactCardProps {
  contact: ContactWithDocuments
  documentUrls: Record<string, string>
}

export function PortalContactCard({ contact, documentUrls }: PortalContactCardProps) {
  const [open, setOpen] = useState(false)
  const Icon = CATEGORY_ICONS[contact.category] ?? Buildings

  return (
    <div className="flex flex-col gap-8 overflow-hidden rounded-[24px] bg-white p-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-10 border-b border-foreground/15 pb-6 text-left"
      >
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center gap-3">
            <Icon className="size-6 shrink-0 text-foreground" />
            <span className="text-2xl font-medium leading-8 tracking-[-0.48px] text-foreground">
              {contact.title}
            </span>
          </div>
          {contact.description && (
            <p className="text-sm leading-5 text-foreground/75">{contact.description}</p>
          )}
        </div>
        <CaretDown
          className="size-6 shrink-0 text-foreground transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {open && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-x-16 gap-y-6">
            {contact.company_name && (
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center rounded-[8px] bg-foreground/6 p-2">
                  <BuildingOffice className="size-6 text-foreground" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs leading-4 text-foreground/75">Įmonė:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold leading-5 text-primary">
                      {contact.company_name}
                    </span>
                    <ArrowUpRight className="size-4 text-primary" />
                  </div>
                </div>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center rounded-[8px] bg-foreground/6 p-2">
                  <Phone className="size-6 text-foreground" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs leading-4 text-foreground/75">Telefonas:</span>
                  <span className="text-sm font-medium leading-5 text-foreground">
                    {contact.phone}
                  </span>
                </div>
              </div>
            )}
            {contact.email && (
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center rounded-[8px] bg-foreground/6 p-2">
                  <EnvelopeOpen className="size-6 text-foreground" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs leading-4 text-foreground/75">El. paštas:</span>
                  <span className="text-sm font-medium leading-5 text-foreground">
                    {contact.email}
                  </span>
                </div>
              </div>
            )}
          </div>

          {contact.documents.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium leading-5 text-foreground">Dokumentai:</span>
              <div className="flex flex-wrap gap-2">
                {contact.documents.map((doc) => {
                  const url = documentUrls[doc.id]
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-8 rounded-[8px] border border-foreground/15 py-2 pl-2 pr-3"
                    >
                      <div className="flex items-center gap-2">
                        <File className="size-5 text-foreground" />
                        <span className="text-sm leading-5 text-foreground">{doc.name}</span>
                      </div>
                      {url && (
                        <a
                          href={url}
                          download={doc.name}
                          className="text-foreground/75 hover:text-foreground"
                        >
                          <DownloadSimple className="size-5" />
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {contact.footnote && (
            <p className="text-xs font-semibold leading-4 text-foreground/75">
              {contact.footnote}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: portal contacts page builds as a server component, old client component removed.

- [ ] **Step 4: Commit**

```bash
git add app/portal/kontaktai/page.tsx components/portal/portal-contact-card.tsx
git commit -m "feat: wire portal contacts page to live database data"
```

---

## Done

All 10 tasks complete. The contacts library is fully functional:
- Admin manages contacts at `/admin/contacts`
- Admin assigns contacts to estates on the estate detail page
- Owners see their estate's contacts at `/portal/kontaktai` with real data and signed document URLs
