import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StepsAccordion, type PurchaseStep } from '@/components/portal/steps-accordion'
import type { Document } from '@/lib/types'

const PURCHASE_STEPS: Omit<PurchaseStep, 'documents' | 'category'>[] = [
  {
    number: 1,
    title: 'Preliminari sutartis',
    description: 'Čia yra jūsų preliminari buto pirkimo-pardavimo sutartis.',
    canOwnerUpload: false,
  },
  {
    number: 2,
    title: 'Mokėjimai',
    description: 'Pasirašykite ir įkelkite mokėjimą patvirtinantį dokumentą.',
    canOwnerUpload: true,
  },
  {
    number: 3,
    title: 'Banko sutartis ir turto vertinimas',
    description: 'Įkelkite banko sutartį ir turto vertinimo aktą.',
    canOwnerUpload: true,
  },
  {
    number: 4,
    title: 'Kadastrinių matavimų byla',
    description: 'Įkelkite kadastrinių matavimų bylą.',
    canOwnerUpload: true,
  },
  {
    number: 5,
    title: 'Notarinė pirkimo - pardavimo sutartis',
    description: 'Čia yra jūsų notarinė buto pirkimo-pardavimo sutartis.',
    canOwnerUpload: false,
  },
  {
    number: 6,
    title: 'Registrų centro išrašas',
    description: 'Įkelkite Registrų centro nuosavybės teisės išrašą.',
    canOwnerUpload: true,
  },
  {
    number: 7,
    title: 'Pakvitavimas',
    description: 'Įkelkite pakvitavimą dėl buto perdavimo.',
    canOwnerUpload: true,
  },
  {
    number: 8,
    title: 'Papildomi dokumentai',
    description: 'Įkelkite papildomus su pirkimu susijusius dokumentus.',
    canOwnerUpload: true,
  },
]

const STEP_CATEGORIES = [
  'preliminari_sutartis',
  'mokejimai',
  'banko_sutartis',
  'kadastro_byla',
  'notarine_sutartis',
  'registru_israsas',
  'pakvitavimas',
  'papildomi_dokumentai',
]

export default async function PagrindiniPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: ownership } = await supabase
    .from('unit_owners')
    .select('unit_id, accepted_at')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .maybeSingle()

  if (!ownership) {
    return (
      <div className="bg-card rounded-3xl p-8 text-center text-muted-foreground text-sm">
        Jūsų paskyra dar nėra susieta su jokiu butu. Susisiekite su administratoriumi.
      </div>
    )
  }

  const { data: unit } = await supabase
    .from('units')
    .select('id, unit_number, floor, area_sqm, estate_id, estates(name, address)')
    .eq('id', ownership.unit_id)
    .single()

  type EstateShape = { name: string; address: string } | null
  const estate = unit?.estates as unknown as EstateShape

  const { data: documents } = await supabase
    .from('documents')
    .select('id, name, category, storage_path')
    .eq('unit_id', ownership.unit_id)

  // Fetch estate photos (uploaded by admin on the estate page)
  let photoUrls: string[] = []
  if (unit?.estate_id) {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()

    const { data: files } = await adminClient.storage
      .from('unit-files')
      .list(`estate-photos/${unit.estate_id}`, { limit: 6 })

    if (files && files.length > 0) {
      const { data: signedUrls } = await adminClient.storage
        .from('unit-files')
        .createSignedUrls(
          files.map((f) => `estate-photos/${unit.estate_id}/${f.name}`),
          60 * 60
        )
      photoUrls = (signedUrls ?? []).flatMap((s) => (s.signedUrl ? [s.signedUrl] : []))
    }
  }

  const docsByCategory = (documents ?? []).reduce<Record<string, Document[]>>(
    (acc, doc) => {
      if (doc.category) {
        acc[doc.category] = [...(acc[doc.category] ?? []), doc as Document]
      }
      return acc
    },
    {}
  )

  const steps: PurchaseStep[] = PURCHASE_STEPS.map((step, i) => ({
    ...step,
    category: STEP_CATEGORIES[i],
    documents: docsByCategory[STEP_CATEGORIES[i]] ?? [],
  }))

  const mainPhoto = photoUrls[0] ?? null
  const gridPhotos = photoUrls.slice(1, 5)
  const extraCount = Math.max(0, photoUrls.length - 5)

  return (
    <div className="space-y-8">
      {/* Hero — estate photos */}
      <div className="flex gap-4 h-56 sm:h-72">
        {/* Main photo */}
        <div className="relative flex-1 rounded-2xl overflow-hidden min-w-0">
          {mainPhoto ? (
            <img src={mainPhoto} alt={estate?.name ?? ''} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-sidebar" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent rounded-2xl" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white space-y-1">
            <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight leading-tight">
              {estate?.name ?? unit?.unit_number ?? '—'}
            </h1>
            <p className="text-sm opacity-80">{estate?.address ?? '—'}</p>
          </div>
        </div>

        {/* 2×2 photo grid — hidden on mobile */}
        {(gridPhotos.length > 0 || photoUrls.length === 0) && (
          <div className="hidden sm:grid grid-cols-2 grid-rows-2 gap-4 w-[340px] shrink-0">
            {Array.from({ length: 4 }).map((_, i) => {
              const url = gridPhotos[i] ?? null
              const isLast = i === 3
              return (
                <div key={i} className="relative rounded-2xl overflow-hidden bg-muted">
                  {url && (
                    <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  )}
                  {isLast && extraCount > 0 && (
                    <>
                      <div className="absolute inset-0 bg-black/35" />
                      <span className="absolute inset-0 flex items-center justify-center text-white text-4xl font-semibold tracking-tight">
                        +{extraCount}
                      </span>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Steps accordion */}
      <StepsAccordion steps={steps} unitId={ownership.unit_id} />
    </div>
  )
}
