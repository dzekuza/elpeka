'use client'

import { useState, useCallback, useTransition } from 'react'
import Image from 'next/image'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { Check, Camera, X } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  pateikta: '[background:var(--status-pateikta)] text-white',
  sprendziama: '[background:var(--status-sprendziama)] text-white',
  atlikta: '[background:var(--status-atlikta)] text-white',
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

function formatLithuanianDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('lt-LT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function shortId(id: string): string {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase()
}

function getSignedImageUrl(storagePath: string): string {
  return `/api/documents/${encodeURIComponent(storagePath)}/download`
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
          className="relative size-20 rounded-md overflow-hidden border border-border hover:opacity-80 transition-opacity"
        >
          <Image
            src={`/api/storage/preview?path=${encodeURIComponent(path)}`}
            alt="Nuotrauka"
            fill
            className="object-cover"
          />
        </a>
      ))}
    </div>
  )
}

function TimelineStepper({
  currentStatus,
}: {
  currentStatus: DefectStatus
}) {
  const currentIndex = STEP_ORDER[currentStatus]

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex
        const isCurrent = i === currentIndex
        const isUpcoming = i > currentIndex

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={[
                  'size-8 rounded-full flex items-center justify-center border-2 transition-colors',
                  isDone
                    ? 'bg-primary border-primary text-primary-foreground'
                    : isCurrent
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-background border-border text-muted-foreground',
                ].join(' ')}
              >
                {isDone ? (
                  <Check className="size-4" />
                ) : (
                  <span className="text-xs font-medium">{i + 1}</span>
                )}
              </div>
              <span
                className={[
                  'text-xs font-medium whitespace-nowrap',
                  isUpcoming ? 'text-muted-foreground' : 'text-foreground',
                ].join(' ')}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={[
                  'h-0.5 w-16 mb-4 transition-colors',
                  i < currentIndex ? 'bg-primary' : 'bg-border',
                ].join(' ')}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

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

  function handleStatusChange(value: string) {
    const status = value as DefectStatus
    setCurrentStatus(status)
    startTransition(async () => {
      try {
        await updateDefectStatus(defect.id, status)
        toast.success('Statusas atnaujintas')
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
    <div className="space-y-6">
      {/* Header card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground font-mono">
                #{shortId(defect.id)}
              </div>
              <CardTitle className="text-xl">{defect.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {defect.estate_name} · {defect.unit_number}
              </p>
            </div>
            <Badge className={STATUS_BADGE_CLASS[currentStatus]}>
              {STATUS_LABELS[currentStatus]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Pateikė</span>
              <p className="font-medium">{defect.submitted_by_email}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Pateikta</span>
              <p className="font-medium">{formatLithuanianDate(defect.created_at)}</p>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">Keisti statusą</span>
            <Select value={currentStatus} onValueChange={handleStatusChange} disabled={isPending}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pateikta">Pateikta</SelectItem>
                <SelectItem value="sprendziama">Sprendžiama</SelectItem>
                <SelectItem value="atlikta">Atlikta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Timeline stepper */}
      <Card>
        <CardContent className="pt-6">
          <TimelineStepper currentStatus={currentStatus} />
        </CardContent>
      </Card>

      {/* Original report */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pranešimas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{defect.description}</p>
          <PhotoGrid paths={defect.attachments.map((a) => a.storage_path)} />
        </CardContent>
      </Card>

      {/* Reply thread */}
      {replies.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Atsakymai ({replies.length})
          </h3>
          {replies.map((reply) => (
            <Card key={reply.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{reply.author_email}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatLithuanianDate(reply.created_at)}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{reply.body}</p>
                <PhotoGrid paths={reply.attachments.map((a) => a.storage_path)} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reply form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rašyti atsakymą</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Rašyti atsakymą..."
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            rows={4}
            disabled={isPending}
          />

          <div>
            <div
              {...getRootProps()}
              className={[
                'border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-colors',
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50',
              ].join(' ')}
            >
              <input {...getInputProps()} />
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Camera className="size-4" />
                {isDragActive
                  ? 'Paleiskite čia...'
                  : 'Pridėti nuotrauką (tempkite arba spauskite)'}
              </div>
            </div>
            {replyPhoto && (
              <div className="flex items-center gap-2 mt-2 text-sm">
                <span className="text-muted-foreground">{replyPhoto.name}</span>
                <button
                  type="button"
                  onClick={() => setReplyPhoto(null)}
                  className="text-destructive hover:text-destructive/80"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}
          </div>

          <Button
            onClick={handleReplySubmit}
            disabled={isPending || !replyBody.trim()}
          >
            {isPending ? 'Siunčiama...' : 'Siųsti'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
