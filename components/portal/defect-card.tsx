'use client'

import { useState } from 'react'
import { CaretDown, CaretUp, Info, X } from '@phosphor-icons/react'
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { DefectTimeline } from '@/components/portal/defect-timeline'
import type { DefectWithDetails, DefectStatus } from '@/lib/types'

export type EnrichedReply = DefectWithDetails['replies'][number] & { attachmentUrls: string[] }

type DefectCardProps = {
  defect: Omit<DefectWithDetails, 'replies'> & { attachmentUrls: string[]; replies: EnrichedReply[] }
}

const STATUS_LABELS: Record<DefectStatus, string> = {
  pateikta: 'Pateikta',
  sprendziama: 'Sprendžiama',
  atlikta: 'Atlikta',
}

const STATUS_NEXT_STEP: Record<DefectStatus, string> = {
  pateikta: 'Jūsų pranešimas gautas.',
  sprendziama: 'Defektas yra sprendžiamas.',
  atlikta: 'Defektas išspręstas. Ačiū!',
}

function statusBgClass(status: DefectStatus): string {
  switch (status) {
    case 'pateikta':
      return '[background:var(--status-pateikta-soft)] border [border-color:var(--status-pateikta-ring)] [color:var(--status-pateikta)]'
    case 'sprendziama':
      return '[background:var(--status-sprendziama-soft)] border [border-color:var(--status-sprendziama-ring)] [color:var(--status-sprendziama)]'
    case 'atlikta':
      return '[background:var(--status-atlikta-soft)] border [border-color:var(--status-atlikta-ring)] [color:var(--status-atlikta)]'
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

function PhotoRow({ urls }: { urls: string[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null)
  if (urls.length === 0) return null
  return (
    <>
      <div className="flex flex-wrap gap-2 pt-1">
        {urls.map((url, i) => {
          const isVideo = /\.(mp4|mov|avi|webm)(\?|$)/i.test(url)
          return (
            <button
              key={i}
              type="button"
              onClick={() => setLightbox(url)}
              className="block h-20 w-20 rounded-md overflow-hidden border border-border shrink-0 hover:opacity-80 transition-opacity duration-150 ease-out cursor-pointer"
            >
              {isVideo ? (
                <video src={url} className="h-full w-full object-cover" muted playsInline />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt={`Nuotrauka ${i + 1}`} className="h-full w-full object-cover" />
              )}
            </button>
          )
        })}
      </div>

      <Dialog open={!!lightbox} onOpenChange={(open) => { if (!open) setLightbox(null) }}>
        <DialogContent className="max-w-3xl w-full p-0 bg-black border-0 overflow-hidden" aria-describedby={undefined}>
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-3 right-3 z-10 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
            aria-label="Uždaryti"
          >
            <X size={18} />
          </button>
          {lightbox && (() => {
            const isVideo = /\.(mp4|mov|avi|webm)(\?|$)/i.test(lightbox)
            return isVideo ? (
              <video
                src={lightbox}
                className="w-full max-h-[85vh] object-contain"
                controls
                autoPlay
                playsInline
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={lightbox} alt="Peržiūra" className="w-full max-h-[85vh] object-contain" />
            )
          })()}
        </DialogContent>
      </Dialog>
    </>
  )
}

export function DefectCard({ defect }: DefectCardProps) {
  const [expanded, setExpanded] = useState(false)
  const ticketNumber = `#${defect.id.replace(/-/g, '').slice(0, 8)}`
  const dates = buildDates(defect)
  const hasContent = defect.description || defect.attachmentUrls.length > 0
  const hasReplies = defect.replies.length > 0

  return (
    <Card className="w-full rounded-3xl">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground leading-tight">
              {defect.title}
            </span>
            <span className="text-sm text-muted-foreground">{ticketNumber}</span>
          </div>
          <Badge variant="ghost" className={statusBgClass(defect.status)}>
            {STATUS_LABELS[defect.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <DefectTimeline currentStatus={defect.status} dates={dates} />

        <div className="rounded-lg [background:var(--warning-bg)] border [border-color:var(--warning-border)] px-4 py-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 shrink-0 [color:var(--warning-icon)]" />
            <p className="text-base font-semibold [color:var(--warning-icon)]">Kitas žingsnis</p>
          </div>
          <p className="text-sm [color:var(--warning-text)]">{STATUS_NEXT_STEP[defect.status]}</p>
        </div>

        {/* Collapsible original report */}
        {hasContent && (
          <div className="flex flex-col gap-4">
            <button
              type="button"
              className="flex items-center gap-1.5 text-base font-medium text-primary hover:opacity-75 transition-opacity duration-150 self-start"
              onClick={() => setExpanded((v) => !v)}
            >
              Peržiūrėti pranešimą
              {expanded ? <CaretUp className="h-4 w-4" /> : <CaretDown className="h-4 w-4" />}
            </button>
            {expanded && (
              <div className="flex flex-col gap-3 border-t pt-4">
                {defect.description && (
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-foreground">Pranešimo aprašymas</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{defect.description}</p>
                  </div>
                )}
                {defect.attachmentUrls.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium text-foreground">Nuotraukos:</p>
                    <PhotoRow urls={defect.attachmentUrls} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Admin replies */}
        {hasReplies && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Atsakymai
            </p>
            {defect.replies.map((reply) => (
              <div key={reply.id} className="rounded-lg border bg-muted/30 px-4 py-3 flex flex-col gap-2">
                <p className="text-sm whitespace-pre-wrap">{reply.body}</p>
                <PhotoRow urls={reply.attachmentUrls} />
                <p className="text-xs text-muted-foreground">
                  {new Date(reply.created_at).toLocaleDateString('lt-LT')}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
