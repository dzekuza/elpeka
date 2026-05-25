'use client'

import { useState, useCallback, useTransition } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { Check, Camera, X, ArrowRight } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateDefectStatus, addDefectReply } from '@/lib/actions/defects'
import type { DefectStatus, DefectAttachment, DefectReply, DefectReplyAttachment } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface DefectDetail {
  id: string
  title: string
  description: string
  status: DefectStatus
  submitted_by_email: string
  created_at: string
  estate_name: string
  unit_number: string
  attachments: DefectAttachment[]
}

export type ReplyWithAttachments = DefectReply & {
  attachments: DefectReplyAttachment[]
  author_email: string
}

interface DefectThreadProps {
  defect: DefectDetail
  replies: ReplyWithAttachments[]
}

const STATUS_LABELS: Record<DefectStatus, string> = {
  pateikta: 'Pateikta',
  sprendziama: 'Sprendžiama',
  atlikta: 'Atlikta',
}

const STATUS_BADGE_CLASS: Record<DefectStatus, string> = {
  pateikta: '[background:var(--status-pateikta)] text-white border-0',
  sprendziama: '[background:var(--status-sprendziama)] text-white border-0',
  atlikta: '[background:var(--status-atlikta)] text-white border-0',
}

const STEPS: { key: DefectStatus; label: string }[] = [
  { key: 'pateikta', label: 'Pateikta' },
  { key: 'sprendziama', label: 'Sprendžiama' },
  { key: 'atlikta', label: 'Atlikta' },
]

const STEP_ORDER: Record<DefectStatus, number> = {
  pateikta: 0,
  sprendziama: 1,
  atlikta: 2,
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('lt-LT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function shortId(id: string): string {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase()
}

function PhotoGrid({ paths }: { paths: string[] }) {
  if (paths.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {paths.map((path) => (
        <a
          key={path}
          href={`/api/storage/preview?path=${encodeURIComponent(path)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="relative size-20 rounded-lg overflow-hidden border border-border hover:opacity-80 transition-opacity"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/storage/preview?path=${encodeURIComponent(path)}`}
            alt="Nuotrauka"
            className="size-full object-cover"
          />
        </a>
      ))}
    </div>
  )
}

function TimelineStepper({ currentStatus }: { currentStatus: DefectStatus }) {
  const currentIndex = STEP_ORDER[currentStatus]
  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => {
        const isDone = i <= currentIndex
        const isLast = i === STEPS.length - 1
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'size-7 rounded-full flex items-center justify-center border-2 transition-all',
                  isDone
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-background border-border text-muted-foreground'
                )}
              >
                {i < currentIndex ? (
                  <Check className="size-3.5" weight="bold" />
                ) : (
                  <span className="text-[10px] font-semibold">{i + 1}</span>
                )}
              </div>
              <span className={cn('text-[11px] font-medium whitespace-nowrap', isDone ? 'text-foreground' : 'text-muted-foreground')}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className={cn('flex-1 h-0.5 mb-5 mx-1 transition-colors', i < currentIndex ? 'bg-primary' : 'bg-border')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Top info banner (exported separately for the page) ─── */
export function DefectInfoBanner({
  defect,
  currentStatus,
  onStatusChange,
  isPending,
}: {
  defect: DefectDetail
  currentStatus: DefectStatus
  onStatusChange: (s: DefectStatus) => void
  isPending: boolean
}) {
  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-5">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-xs font-mono text-muted-foreground">#{shortId(defect.id)}</p>
          <h2 className="text-lg font-semibold text-foreground">{defect.title}</h2>
          <p className="text-sm text-muted-foreground">{defect.estate_name} · Butas {defect.unit_number}</p>
        </div>
        <Badge className={STATUS_BADGE_CLASS[currentStatus]}>
          {STATUS_LABELS[currentStatus]}
        </Badge>
      </div>

      {/* Timeline stepper */}
      <TimelineStepper currentStatus={currentStatus} />

      {/* Meta + status change */}
      <div className="flex flex-wrap items-end justify-between gap-4 pt-1 border-t border-border">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="text-muted-foreground text-xs block">Pateikė</span>
            <span className="font-medium">{defect.submitted_by_email}</span>
          </div>
          <div>
            <span className="text-muted-foreground text-xs block">Data</span>
            <span className="font-medium">{formatDate(defect.created_at)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Keisti statusą</span>
          <Select value={currentStatus} onValueChange={(v) => onStatusChange(v as DefectStatus)} disabled={isPending}>
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pateikta">Pateikta</SelectItem>
              <SelectItem value="sprendziama">Sprendžiama</SelectItem>
              <SelectItem value="atlikta">Atlikta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

/* ─── Main thread ─── */
export function DefectThread({ defect, replies }: DefectThreadProps) {
  const [currentStatus, setCurrentStatus] = useState<DefectStatus>(defect.status)
  const [replyBody, setReplyBody] = useState('')
  const [replyPhoto, setReplyPhoto] = useState<File | null>(null)
  const [isPending, startTransition] = useTransition()

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setReplyPhoto(accepted[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    multiple: false,
  })

  function handleStatusChange(status: DefectStatus) {
    setCurrentStatus(status)
    startTransition(async () => {
      try {
        await updateDefectStatus(defect.id, status)
        toast.success('Defekto statusas atnaujintas')
      } catch {
        toast.error('Nepavyko atnaujinti statuso')
        setCurrentStatus(currentStatus)
      }
    })
  }

  async function handleReplySubmit() {
    if (!replyBody.trim()) return
    startTransition(async () => {
      try {
        let photoFormData: FormData | undefined
        if (replyPhoto) {
          photoFormData = new FormData()
          photoFormData.set('file', replyPhoto)
        }
        await addDefectReply(defect.id, replyBody, photoFormData)
        setReplyBody('')
        setReplyPhoto(null)
        toast.success('Atsakymas išsiųstas')
      } catch {
        toast.error('Nepavyko išsiųsti atsakymo')
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Info banner — full width, above thread */}
      <DefectInfoBanner
        defect={defect}
        currentStatus={currentStatus}
        onStatusChange={handleStatusChange}
        isPending={isPending}
      />

      {/* Thread */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <p className="text-sm font-medium text-muted-foreground">
            Pokalbis · {1 + replies.length} {replies.length === 0 ? 'pranešimas' : 'pranešimai'}
          </p>
        </div>

        <div className="divide-y divide-border">
          {/* Original message */}
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                  {defect.submitted_by_email.slice(0, 1).toUpperCase()}
                </div>
                <span className="text-sm font-medium truncate">{defect.submitted_by_email}</span>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{formatDate(defect.created_at)}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap text-foreground pl-9">{defect.description}</p>
            {defect.attachments.length > 0 && (
              <div className="pl-9">
                <PhotoGrid paths={defect.attachments.map((a) => a.storage_path)} />
              </div>
            )}
          </div>

          {/* Replies */}
          {replies.map((reply) => (
            <div key={reply.id} className="p-4 sm:p-5 space-y-3 bg-muted/20">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                    {reply.author_email.slice(0, 1).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium truncate">{reply.author_email}</span>
                  <span className="text-xs text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded">Admin</span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{formatDate(reply.created_at)}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap text-foreground pl-9">{reply.body}</p>
              {reply.attachments.length > 0 && (
                <div className="pl-9">
                  <PhotoGrid paths={reply.attachments.map((a) => a.storage_path)} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Reply composer */}
        <div className="p-4 sm:p-5 border-t border-border space-y-3">
          <Textarea
            placeholder="Rašyti atsakymą..."
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            rows={3}
            disabled={isPending}
            className="resize-none"
          />

          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors',
              isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
            )}
          >
            <input {...getInputProps()} />
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Camera className="size-3.5" />
              {isDragActive ? 'Paleiskite čia...' : 'Pridėti nuotrauką'}
            </div>
          </div>

          {replyPhoto && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground truncate">{replyPhoto.name}</span>
              <button type="button" onClick={() => setReplyPhoto(null)} className="text-destructive shrink-0">
                <X className="size-3.5" />
              </button>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleReplySubmit}
              disabled={isPending || !replyBody.trim()}
              size="sm"
            >
              {isPending ? 'Siunčiama...' : (
                <>Siųsti <ArrowRight className="size-3.5 ml-1.5" /></>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
