'use client'

import { useRef, useState, useTransition } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { toast } from 'sonner'

gsap.registerPlugin(useGSAP)
import { CaretDown, Copy, Checks, Lightning, Drop, ThermometerSimple, Trash } from '@phosphor-icons/react'
import { markServiceCompleted } from '@/lib/actions/services'
import type { UnitService, ServiceCategory } from '@/lib/types'

const SERVICE_DEFS: Record<ServiceCategory, { label: string; Icon: React.ElementType; instruction: string }> = {
  electrical: {
    label: 'Elektra',
    Icon: Lightning,
    instruction: 'Prašome sudaryti sutartį su pasirinktu elektros tiekėju. Pažymėkite šį žingsnį kaip užbaigtą, kai paslauga bus aktyvuota.',
  },
  water: {
    label: 'Vanduo',
    Icon: Drop,
    instruction: 'Prašome sudaryti sutartį su vandens tiekėju. Pažymėkite šį žingsnį kaip užbaigtą, kai paslauga bus aktyvuota.',
  },
  heating: {
    label: 'Šildymas',
    Icon: ThermometerSimple,
    instruction: 'Prašome sudaryti sutartį su šilumos tiekėju. Pažymėkite šį žingsnį kaip užbaigtą, kai paslauga bus aktyvuota.',
  },
  waste: {
    label: 'Atliekų išvežimas',
    Icon: Trash,
    instruction: 'Prašome sudaryti sutartį su atliekų išvežimo įmone. Pažymėkite šį žingsnį kaip užbaigtą, kai paslauga bus aktyvuota.',
  },
}

interface ServiceCardProps {
  service: UnitService
}

export function ServiceCard({ service }: ServiceCardProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const def = SERVICE_DEFS[service.category]
  const isDone = !!service.completed_at
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!open || !contentRef.current) return
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(contentRef.current!, {
          y: -8,
          autoAlpha: 0,
          duration: 0.22,
          ease: 'power2.out',
          clearProps: 'all',
        })
      })
      return () => mm.revert()
    },
    { dependencies: [open], scope: containerRef }
  )

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
    <div ref={containerRef} className="flex flex-col overflow-hidden rounded-[24px] bg-card">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`service-detail-${service.id}`}
        className={`flex w-full cursor-pointer items-center justify-between p-4 sm:p-6 text-left${open ? ' border-b border-foreground/15' : ''}`}
      >
        <div className="flex items-center gap-3">
          <def.Icon className="size-5 sm:size-6 shrink-0 text-foreground" />
          <span className="text-base sm:text-2xl font-medium sm:leading-8 sm:tracking-tight text-foreground">
            {def.label}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {isDone ? (
            <span className="text-xs font-medium [color:var(--status-atlikta)] [background:color-mix(in_srgb,var(--status-atlikta)_10%,transparent)] border [border-color:color-mix(in_srgb,var(--status-atlikta)_20%,transparent)] rounded-[4px] px-3 py-2">
              Įvykdyta
            </span>
          ) : (
            <span className="text-xs font-medium text-foreground/85 bg-foreground/8 border border-foreground/15 rounded-[4px] px-3 py-2">
              Laukiama
            </span>
          )}
          <CaretDown
            className="size-6 shrink-0 text-foreground transition-transform duration-200 ease-out"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </div>
      </button>

      {open && (
        <div ref={contentRef} id={`service-detail-${service.id}`} className="flex items-end justify-between gap-8 p-6">
          <div className="flex flex-1 flex-col gap-4">
            <p className="text-base leading-6 text-foreground">{def.instruction}</p>
            {service.description && (
              <p className="text-sm leading-5 text-foreground/70">{service.description}</p>
            )}
            {service.meter_number && service.category !== 'waste' && (
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
