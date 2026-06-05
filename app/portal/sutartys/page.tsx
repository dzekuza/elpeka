import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/page-header'

export const metadata: Metadata = { title: 'Sutartys ir paslaugos | ELPEKAS' }
import { ServiceCard } from '@/components/portal/service-card'
import { WarningCircle } from '@phosphor-icons/react/dist/ssr'
import type { UnitService } from '@/lib/types'
import { PortalAnimateIn } from '@/components/portal/portal-animate-in'

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
        description="Užbaikite likusius žingsnius, kad pilnai įvykdytumėte savo sutartinius įsipareigojimus."
      />

      {anyPending && (
        <div className="flex flex-col gap-2 rounded-[24px] [background:color-mix(in_srgb,var(--status-sprendziama)_10%,transparent)] px-6 py-5">
          <div className="flex items-center gap-2">
            <WarningCircle className="size-6 [color:var(--status-sprendziama)]" />
            <span className="text-lg font-medium [color:var(--status-sprendziama)]">Svarbu</span>
          </div>
          <p className="text-sm leading-relaxed text-foreground/85">
            Prašome sudaryti paslaugų sutartis per 10 dienų po nuosavybės registracijos.
          </p>
        </div>
      )}

      {total > 0 && (
        <div className="flex flex-col gap-8 rounded-[24px] bg-card p-6">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <span className="text-2xl font-medium leading-8 tracking-tight text-foreground">
                Sutarčių sudarymo eiga
              </span>
              <span className="text-base text-foreground">
                Užbaikite likusius žingsnius, kad pilnai įvykdytumėte savo sutartinius įsipareigojimus.
              </span>
            </div>
            <span
              className={`text-xs font-medium rounded-[4px] border px-3 py-2 ${
                allDone
                  ? '[color:var(--status-atlikta)] [background:color-mix(in_srgb,var(--status-atlikta)_10%,transparent)] [border-color:color-mix(in_srgb,var(--status-atlikta)_20%,transparent)]'
                  : '[color:var(--status-sprendziama)] [background:color-mix(in_srgb,var(--status-sprendziama)_10%,transparent)] [border-color:color-mix(in_srgb,var(--status-sprendziama)_20%,transparent)]'
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
        <PortalAnimateIn className="flex flex-col gap-2">
          {sorted.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </PortalAnimateIn>
      )}
    </div>
  )
}
