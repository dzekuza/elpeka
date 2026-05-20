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
        className={`flex w-full cursor-pointer items-center justify-between p-4 sm:p-6 text-left${open ? ' border-b border-foreground/15' : ''}`}
      >
        <div className="flex items-center gap-3">
          <def.Icon className="size-5 sm:size-6 shrink-0 text-foreground" />
          <span className="text-base sm:text-2xl font-medium sm:leading-8 sm:tracking-[-0.48px] text-foreground">
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
