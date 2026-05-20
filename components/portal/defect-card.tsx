'use client'

import { useState } from 'react'
import Image from 'next/image'
import { CaretDown, CaretUp, Info } from '@phosphor-icons/react'
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DefectTimeline } from '@/components/portal/defect-timeline'
import type { DefectWithDetails, DefectStatus } from '@/lib/types'

type DefectCardProps = {
  defect: DefectWithDetails & { attachmentUrls: string[] }
}

const STATUS_LABELS: Record<DefectStatus, string> = {
  pateikta: 'Pateikta',
  sprendziama: 'Sprendžiama',
  atlikta: 'Atlikta',
}

const STATUS_NEXT_STEP: Record<DefectStatus, string> = {
  pateikta: 'Jūsų pranešimas gautas. Laukiame atsakymo iš vadybininko.',
  sprendziama: 'Defektas yra sprendžiamas. Susisieksime su Jumis.',
  atlikta: 'Defektas išspręstas. Ačiū!',
}

function statusBgClass(status: DefectStatus): string {
  switch (status) {
    case 'pateikta':
      return '[background:var(--status-pateikta)] text-white'
    case 'sprendziama':
      return '[background:var(--status-sprendziama)] text-white'
    case 'atlikta':
      return '[background:var(--status-atlikta)] text-white'
  }
}

function buildDates(defect: DefectWithDetails): {
  pateikta?: string
  sprendziama?: string
  atlikta?: string
} {
  const dates: { pateikta?: string; sprendziama?: string; atlikta?: string } = {
    pateikta: defect.created_at,
  }

  // Future tasks may store status-change timestamps in replies or elsewhere.
  // For now, we only know the creation date (pateikta).
  return dates
}

export function DefectCard({ defect }: DefectCardProps) {
  const [expanded, setExpanded] = useState(false)
  const ticketNumber = `#${defect.id.replace(/-/g, '').slice(0, 8)}`
  const dates = buildDates(defect)
  const hasContent = defect.description || defect.attachmentUrls.length > 0

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="font-semibold text-foreground leading-snug">
              {defect.title}
            </span>
            <span className="text-xs text-muted-foreground">{ticketNumber}</span>
          </div>
          <Badge className={statusBgClass(defect.status)}>
            {STATUS_LABELS[defect.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Stepper */}
        <DefectTimeline currentStatus={defect.status} dates={dates} />

        {/* Next step info box */}
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">{STATUS_NEXT_STEP[defect.status]}</p>
        </div>

        {/* Collapsible description & photos */}
        {hasContent && (
          <div className="border rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              className="w-full flex items-center justify-between px-4 py-3 rounded-none h-auto text-sm font-medium"
              onClick={() => setExpanded((v) => !v)}
            >
              Peržiūrėti pranešimą
              {expanded ? (
                <CaretUp className="h-4 w-4" />
              ) : (
                <CaretDown className="h-4 w-4" />
              )}
            </Button>

            {expanded && (
              <div className="px-4 pb-4 flex flex-col gap-3 border-t">
                {defect.description && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap pt-3">
                    {defect.description}
                  </p>
                )}
                {defect.attachmentUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {defect.attachmentUrls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block relative h-20 w-20 rounded-md overflow-hidden border border-border shrink-0"
                      >
                        <Image
                          src={url}
                          alt={`Nuotrauka ${i + 1}`}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
