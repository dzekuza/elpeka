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
