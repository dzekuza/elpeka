'use client'

import { Fragment } from 'react'
import { Check, ClockCountdown } from '@phosphor-icons/react'
import type { DefectStatus } from '@/lib/types'

interface DefectTimelineProps {
  currentStatus: DefectStatus
  dates: {
    pateikta?: string
    sprendziama?: string
    atlikta?: string
  }
}

const STEPS: { key: DefectStatus; label: string }[] = [
  { key: 'pateikta', label: 'Pateikta' },
  { key: 'sprendziama', label: 'Sprendžiama' },
  { key: 'atlikta', label: 'Atlikta' },
]

const STATUS_ORDER: Record<DefectStatus, number> = {
  pateikta: 0,
  sprendziama: 1,
  atlikta: 2,
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('lt-LT', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function DefectTimeline({ currentStatus, dates }: DefectTimelineProps) {
  const currentOrder = STATUS_ORDER[currentStatus]

  return (
    <div className="flex items-start w-full">
      {STEPS.map((step, idx) => {
        const stepOrder = STATUS_ORDER[step.key]
        const isCompleted = stepOrder < currentOrder
        const isActive = stepOrder === currentOrder
        const isFuture = stepOrder > currentOrder
        const isLast = idx === STEPS.length - 1
        const date = dates[step.key]

        return (
          <Fragment key={step.key}>
            {/* Step: dot + label stacked and centered independently of connectors */}
            <div className="flex flex-col items-center shrink-0">
              {isCompleted ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                  <Check className="h-5 w-5 text-white" weight="bold" />
                </div>
              ) : isActive ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-primary/10">
                  <ClockCountdown className="h-5 w-5 text-primary" />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-muted-foreground/30 opacity-40">
                  <ClockCountdown className="h-5 w-5 text-muted-foreground" />
                </div>
              )}

              {/* Label + date — centered under dot, not under full step+connector width */}
              <div className="mt-2 flex flex-col items-center text-center min-w-[5rem]">
                <span className={isFuture ? 'text-xs font-medium text-muted-foreground' : 'text-xs font-semibold text-foreground'}>
                  {step.label}
                </span>
                {date && (
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    {formatDate(date)}
                  </span>
                )}
              </div>
            </div>

            {/* Connector line between steps, vertically centered at dot midpoint (mt-5 = 20px = half of h-10) */}
            {!isLast && (
              <div
                className={`flex-1 h-0.5 mt-5 ${
                  stepOrder < currentOrder
                    ? 'bg-primary'
                    : 'bg-muted-foreground/20'
                }`}
              />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}
