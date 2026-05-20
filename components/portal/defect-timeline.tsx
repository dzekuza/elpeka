'use client'

import { Check } from '@phosphor-icons/react'
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
    <div className="flex items-start gap-0 w-full">
      {STEPS.map((step, idx) => {
        const stepOrder = STATUS_ORDER[step.key]
        const isCompleted = stepOrder < currentOrder
        const isActive = stepOrder === currentOrder
        const isFuture = stepOrder > currentOrder
        const isLast = idx === STEPS.length - 1
        const date = dates[step.key]

        return (
          <div key={step.key} className="flex items-start flex-1 min-w-0">
            {/* Step + connector */}
            <div className="flex flex-col items-center flex-1 min-w-0">
              {/* Circle row */}
              <div className="flex items-center w-full">
                {/* Left connector */}
                {idx > 0 && (
                  <div
                    className={
                      stepOrder <= currentOrder
                        ? 'flex-1 h-0.5 [background:var(--status-atlikta)]'
                        : 'flex-1 h-0.5 bg-muted'
                    }
                  />
                )}
                {/* Circle */}
                {isCompleted ? (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full [background:var(--status-atlikta)]">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                ) : isActive ? (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary">
                    <span className="h-2 w-2 rounded-full bg-white" />
                  </div>
                ) : (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-muted bg-background" />
                )}
                {/* Right connector */}
                {!isLast && (
                  <div
                    className={
                      stepOrder < currentOrder
                        ? 'flex-1 h-0.5 [background:var(--status-atlikta)]'
                        : 'flex-1 h-0.5 bg-muted'
                    }
                  />
                )}
              </div>
              {/* Label + date */}
              <div className="mt-2 flex flex-col items-center text-center px-1">
                <span
                  className={
                    isFuture
                      ? 'text-xs font-medium text-muted-foreground'
                      : 'text-xs font-semibold text-foreground'
                  }
                >
                  {step.label}
                </span>
                {date && (
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    {formatDate(date)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
