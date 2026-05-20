# Unit Services (Paslaugų teikimo sutartys) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `unit_services` table where admins set meter numbers per service (Elektra, Vanduo, Šildymas, Atliekų išvežimas) per unit, and owners mark each service as completed on the portal `/portal/sutartys` page.

**Architecture:** New DB table `unit_services` (one row per category per unit, upserted by admin). Admin manages via a new "Paslaugos" tab on the unit editor. Portal page replaces the current documents view with accordion service cards matching the Figma design. Server actions handle upsert (admin) and mark-done (owner) with RLS enforcement.

**Tech Stack:** Next.js 15 App Router, Supabase PostgreSQL + RLS, `@phosphor-icons/react`, shadcn/ui, Tailwind CSS, React `useTransition` for mutations.

---

## File map

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/007_add_unit_services.sql` | Create | DB table + RLS |
| `lib/types.ts` | Modify | Add `ServiceCategory`, `UnitService` |
| `lib/actions/services.ts` | Create | `upsertUnitService`, `markServiceCompleted` |
| `components/admin/unit-editor/services-tab.tsx` | Create | Admin form: meter numbers + descriptions per service |
| `app/admin/estates/[id]/units/[unitId]/page.tsx` | Modify | Fetch services, add "Paslaugos" tab |
| `components/portal/service-card.tsx` | Create | Owner-facing accordion card with mark-done |
| `app/portal/sutartys/page.tsx` | Modify | Replace documents view with service cards |

---

### Task 1: Database migration

**Files:**
- Create: `supabase/migrations/007_add_unit_services.sql`

- [ ] **Step 1: Create migration file**

```sql
-- supabase/migrations/007_add_unit_services.sql
CREATE TABLE unit_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('electrical', 'water', 'heating', 'waste')),
  meter_number text,
  description text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(unit_id, category)
);

ALTER TABLE unit_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_unit_services" ON unit_services
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "owner_select_unit_services" ON unit_services
  FOR SELECT TO authenticated
  USING (unit_id = owner_unit_id());

CREATE POLICY "owner_complete_unit_services" ON unit_services
  FOR UPDATE TO authenticated
  USING (unit_id = owner_unit_id())
  WITH CHECK (unit_id = owner_unit_id());
```

- [ ] **Step 2: Push migration to Supabase**

```bash
npx supabase db push
```

Expected: `Applying migration 007_add_unit_services.sql... done`

- [ ] **Step 3: Verify build still passes**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/007_add_unit_services.sql
git commit -m "feat: add unit_services table with RLS"
```

---

### Task 2: TypeScript types

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Append types to `lib/types.ts`**

Add at the end of the file:

```ts
export type ServiceCategory = 'electrical' | 'water' | 'heating' | 'waste'

export interface UnitService {
  id: string
  unit_id: string
  category: ServiceCategory
  meter_number: string | null
  description: string | null
  completed_at: string | null
  created_at: string
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add ServiceCategory and UnitService types"
```

---

### Task 3: Server actions

**Files:**
- Create: `lib/actions/services.ts`

- [ ] **Step 1: Create `lib/actions/services.ts`**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ServiceCategory } from '@/lib/types'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  if (user.user_metadata?.role !== 'admin') throw new Error('Forbidden')
  return { supabase, user }
}

export async function upsertUnitService(
  unitId: string,
  category: ServiceCategory,
  data: { meter_number: string | null; description: string | null }
): Promise<void> {
  const { supabase } = await requireAdmin()
  const { error } = await supabase
    .from('unit_services')
    .upsert(
      { unit_id: unitId, category, meter_number: data.meter_number, description: data.description },
      { onConflict: 'unit_id,category' }
    )
  if (error) throw new Error(error.message)
  revalidatePath('/admin/estates', 'layout')
}

export async function markServiceCompleted(serviceId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('unit_services')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', serviceId)
    .is('completed_at', null)

  if (error) throw new Error(error.message)
  revalidatePath('/portal/sutartys')
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/services.ts
git commit -m "feat: add upsertUnitService and markServiceCompleted server actions"
```

---

### Task 4: Admin ServicesTab component

**Files:**
- Create: `components/admin/unit-editor/services-tab.tsx`

- [ ] **Step 1: Create `components/admin/unit-editor/services-tab.tsx`**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Lightning, Drop, ThermometerSimple, Trash } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { upsertUnitService } from '@/lib/actions/services'
import type { UnitService, ServiceCategory } from '@/lib/types'

const SERVICE_DEFS: { category: ServiceCategory; label: string; Icon: React.ElementType }[] = [
  { category: 'electrical', label: 'Elektra', Icon: Lightning },
  { category: 'water', label: 'Vanduo', Icon: Drop },
  { category: 'heating', label: 'Šildymas', Icon: ThermometerSimple },
  { category: 'waste', label: 'Atliekų išvežimas', Icon: Trash },
]

interface ServicesTabProps {
  unitId: string
  services: UnitService[]
}

type ServiceFields = { meter_number: string; description: string }
type ServiceValues = Record<ServiceCategory, ServiceFields>

export function ServicesTab({ unitId, services }: ServicesTabProps) {
  const serviceMap = Object.fromEntries(services.map((s) => [s.category, s]))

  const [values, setValues] = useState<ServiceValues>({
    electrical: { meter_number: serviceMap.electrical?.meter_number ?? '', description: serviceMap.electrical?.description ?? '' },
    water: { meter_number: serviceMap.water?.meter_number ?? '', description: serviceMap.water?.description ?? '' },
    heating: { meter_number: serviceMap.heating?.meter_number ?? '', description: serviceMap.heating?.description ?? '' },
    waste: { meter_number: serviceMap.waste?.meter_number ?? '', description: serviceMap.waste?.description ?? '' },
  })

  const [isPending, startTransition] = useTransition()

  function handleSave(category: ServiceCategory) {
    const v = values[category]
    startTransition(async () => {
      try {
        await upsertUnitService(unitId, category, {
          meter_number: v.meter_number || null,
          description: v.description || null,
        })
        toast.success('Išsaugota')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Klaida')
      }
    })
  }

  function setField(category: ServiceCategory, field: keyof ServiceFields, value: string) {
    setValues((prev) => ({ ...prev, [category]: { ...prev[category], [field]: value } }))
  }

  return (
    <div className="flex flex-col gap-4">
      {SERVICE_DEFS.map(({ category, label, Icon }) => {
        const existing = serviceMap[category]
        const v = values[category]
        return (
          <div key={category} className="rounded-[16px] bg-white p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Icon className="size-5 text-foreground" />
              <span className="text-base font-medium text-foreground">{label}</span>
              {existing?.completed_at && (
                <span className="ml-auto text-xs font-medium text-[#3e8000] bg-[rgba(62,128,0,0.08)] border border-[rgba(62,128,0,0.15)] rounded-[4px] px-3 py-1">
                  Įvykdyta
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-muted-foreground">Skaitiklio numeris</label>
                <Input
                  value={v.meter_number}
                  onChange={(e) => setField(category, 'meter_number', e.target.value)}
                  placeholder="pvz. 1234567890"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-muted-foreground">Aprašymas savininkui</label>
                <Textarea
                  rows={2}
                  value={v.description}
                  onChange={(e) => setField(category, 'description', e.target.value)}
                  placeholder="pvz. Prašome sudaryti sutartį su pasirinktu tiekėju..."
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" disabled={isPending} onClick={() => handleSave(category)}>
                Išsaugoti
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/admin/unit-editor/services-tab.tsx
git commit -m "feat: add ServicesTab component for unit editor"
```

---

### Task 5: Wire ServicesTab into unit detail page

**Files:**
- Modify: `app/admin/estates/[id]/units/[unitId]/page.tsx`

- [ ] **Step 1: Add services fetch after the photos block (after line ~80)**

After the `ownerRow` query block, add:

```ts
const { data: servicesData } = await supabase
  .from('unit_services')
  .select('*')
  .eq('unit_id', unitId)
  .order('created_at', { ascending: true })

const services = (servicesData ?? []) as UnitService[]
```

- [ ] **Step 2: Add import for ServicesTab and UnitService type**

At the top of the file, add:
```ts
import { ServicesTab } from '@/components/admin/unit-editor/services-tab'
import type { Unit, Document, UnitService } from '@/lib/types'
```

(Replace the existing `import type { Unit, Document } from '@/lib/types'` line.)

- [ ] **Step 3: Add "Paslaugos" tab to the Tabs component**

In the `<TabsList>` block, add after the "photos" trigger:
```tsx
<TabsTrigger value="services">Paslaugos</TabsTrigger>
```

After the `<TabsContent value="photos">` block, add:
```tsx
<TabsContent value="services">
  <ServicesTab unitId={unitId} services={services} />
</TabsContent>
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add "app/admin/estates/[id]/units/[unitId]/page.tsx"
git commit -m "feat: add Paslaugos tab to unit editor"
```

---

### Task 6: Portal ServiceCard component

**Files:**
- Create: `components/portal/service-card.tsx`

- [ ] **Step 1: Create `components/portal/service-card.tsx`**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { CaretDown, Copy, Checks, Lightning, Drop, ThermometerSimple, Trash } from '@phosphor-icons/react'
import { markServiceCompleted } from '@/lib/actions/services'
import type { UnitService, ServiceCategory } from '@/lib/types'

const SERVICE_DEFS: Record<ServiceCategory, { label: string; Icon: React.ElementType }> = {
  electrical: { label: 'Elektra', Icon: Lightning },
  water: { label: 'Vanduo', Icon: Drop },
  heating: { label: 'Šildymas', Icon: ThermometerSimple },
  waste: { label: 'Atliekų išvežimas', Icon: Trash },
}

interface ServiceCardProps {
  service: UnitService
}

export function ServiceCard({ service }: ServiceCardProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const def = SERVICE_DEFS[service.category]
  const isDone = !!service.completed_at

  function copyMeterNumber() {
    if (!service.meter_number) return
    navigator.clipboard.writeText(service.meter_number).then(() => toast.success('Nukopijuota'))
  }

  function handleMarkDone() {
    startTransition(async () => {
      try {
        await markServiceCompleted(service.id)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Klaida')
      }
    })
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-[24px] bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full cursor-pointer items-center justify-between p-6 text-left${open ? ' border-b border-foreground/15' : ''}`}
      >
        <div className="flex items-center gap-3">
          <def.Icon className="size-6 shrink-0 text-foreground" />
          <span className="text-2xl font-medium leading-8 tracking-[-0.48px] text-foreground">
            {def.label}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {isDone ? (
            <span className="text-xs font-medium text-[#3e8000] bg-[rgba(62,128,0,0.08)] border border-[rgba(62,128,0,0.15)] rounded-[4px] px-3 py-2">
              Įvykdyta
            </span>
          ) : (
            <span className="text-xs font-medium text-foreground/85 bg-foreground/8 border border-foreground/15 rounded-[4px] px-3 py-2">
              Laukiama
            </span>
          )}
          <CaretDown
            className="size-6 shrink-0 text-foreground transition-transform duration-200"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </div>
      </button>

      {open && (
        <div className="flex items-end justify-between gap-8 p-6">
          <div className="flex flex-1 flex-col gap-4">
            {service.description && (
              <p className="text-base leading-6 text-foreground">{service.description}</p>
            )}
            {service.meter_number && (
              <div className="flex items-center gap-2">
                <span className="text-base text-foreground">Skaitiklio numeris:</span>
                <span className="text-base font-medium text-foreground">{service.meter_number}</span>
                <button
                  onClick={copyMeterNumber}
                  className="text-foreground/60 hover:text-foreground"
                  aria-label="Kopijuoti"
                >
                  <Copy className="size-5" />
                </button>
              </div>
            )}
          </div>
          {!isDone && (
            <button
              onClick={handleMarkDone}
              disabled={isPending}
              className="flex shrink-0 items-center gap-2 rounded-[8px] bg-primary px-3 py-2 text-base font-medium text-primary-foreground disabled:opacity-60"
            >
              <Checks className="size-5" />
              Pažymėti, kaip atlikta
            </button>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/portal/service-card.tsx
git commit -m "feat: add ServiceCard portal component"
```

---

### Task 7: Replace portal sutartys page

**Files:**
- Modify: `app/portal/sutartys/page.tsx`

- [ ] **Step 1: Replace the entire content of `app/portal/sutartys/page.tsx`**

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/page-header'
import { ServiceCard } from '@/components/portal/service-card'
import { WarningCircle } from '@phosphor-icons/react/dist/ssr'
import type { UnitService } from '@/lib/types'

const SERVICE_ORDER = ['electrical', 'water', 'heating', 'waste'] as const

export default async function SutartysPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: ownership } = await supabase
    .from('unit_owners')
    .select('unit_id')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .maybeSingle()

  const unitId = ownership?.unit_id ?? null
  let services: UnitService[] = []

  if (unitId) {
    const { data } = await supabase
      .from('unit_services')
      .select('*')
      .eq('unit_id', unitId)
    services = (data ?? []) as UnitService[]
  }

  const sorted = SERVICE_ORDER
    .map((cat) => services.find((s) => s.category === cat))
    .filter(Boolean) as UnitService[]

  const total = sorted.length
  const done = sorted.filter((s) => s.completed_at).length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const allDone = total > 0 && done === total
  const anyPending = total > 0 && done < total

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Paslaugų teikimo sutartys"
        description="Po nuosavybės registracijos sudarykite komunalinių ir kitų paslaugų sutartis savo objektui."
      />

      {anyPending && (
        <div className="flex flex-col gap-2 rounded-[24px] bg-[rgba(238,147,2,0.08)] px-6 py-5">
          <div className="flex items-center gap-2">
            <WarningCircle className="size-6 text-[#ee9302]" />
            <span className="text-lg font-medium text-[#ee9302]">Svarbu</span>
          </div>
          <p className="text-sm leading-5 text-foreground/85">
            Prašome sudaryti paslaugų sutartis per 10 dienų po nuosavybės registracijos.
          </p>
        </div>
      )}

      {total > 0 && (
        <div className="flex flex-col gap-8 rounded-[24px] bg-white p-6">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <span className="text-2xl font-medium leading-8 tracking-[-0.48px] text-foreground">
                Sutarčių sudarymo eiga
              </span>
              <span className="text-base text-foreground">
                Užbaikite likusius žingsnius, kad pilnai paruoštumėte savo butą.
              </span>
            </div>
            <span
              className={`text-xs font-medium rounded-[4px] border px-3 py-2 ${
                allDone
                  ? 'text-[#3e8000] bg-[rgba(62,128,0,0.08)] border-[rgba(62,128,0,0.15)]'
                  : 'text-[#ee9302] bg-[rgba(238,147,2,0.08)] border-[rgba(238,147,2,0.15)]'
              }`}
            >
              {allDone ? 'Įvykdyta' : 'Vykdoma'}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-base text-foreground">
              <span>{done} iš {total} sutarčių</span>
              <span>{pct}% įvykdyta</span>
            </div>
            <div className="relative h-3 w-full rounded-full bg-foreground/8">
              <div
                className="absolute left-0 top-0 h-3 rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {total === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Paslaugos dar nėra sukurtos.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: no errors, `/portal/sutartys` listed in build output.

- [ ] **Step 3: Commit**

```bash
git add app/portal/sutartys/page.tsx
git commit -m "feat: replace sutartys page with live service-tracking view"
```

---

## Self-Review

**Spec coverage:**
- ✅ `unit_services` table with RLS — Task 1
- ✅ `ServiceCategory`, `UnitService` types — Task 2
- ✅ `upsertUnitService` (admin) — Task 3
- ✅ `markServiceCompleted` (owner, sets completed_at) — Task 3
- ✅ Admin "Paslaugos" tab on unit editor — Tasks 4 + 5
- ✅ Warning banner (amber, shown when any pending) — Task 7
- ✅ Progress card with bar — Task 7
- ✅ Service accordion cards (icon, name, badge, caret) — Task 6
- ✅ Copy meter number to clipboard — Task 6
- ✅ "Pažymėti, kaip atlikta" button (hidden when done) — Task 6
- ✅ Empty state when no services configured — Task 7

**Type consistency:** `UnitService` defined in Task 2, used in Tasks 4, 5, 6, 7. `ServiceCategory` defined in Task 2, used in Task 3 action signatures and Task 4 component. All match.

**Placeholder scan:** None found.
