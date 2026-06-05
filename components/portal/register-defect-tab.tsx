'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { X, UploadSimple } from '@phosphor-icons/react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { submitDefect } from '@/lib/actions/defects'

interface RegisterDefectTabProps {
  unitId: string
  onSuccess?: () => void
}

const MAX_FILES = 5
const MAX_SIZE_BYTES = 50 * 1024 * 1024

export function RegisterDefectTab({ unitId, onSuccess }: RegisterDefectTabProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onDrop = useCallback(
    (accepted: File[]) => {
      const remaining = MAX_FILES - files.length
      const toAdd = accepted.slice(0, remaining)
      setFiles((prev) => [...prev, ...toAdd])
      setPreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))])
    },
    [files.length]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.webm'],
    },
    maxSize: MAX_SIZE_BYTES,
    disabled: files.length >= MAX_FILES,
  })

  function removeFile(index: number) {
    URL.revokeObjectURL(previews[index])
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return

    setSubmitting(true)
    try {
      if (files.length > 0) {
        const fd = new FormData()
        files.forEach((f) => fd.append('files', f))
        await submitDefect(unitId, title.trim(), description.trim(), fd)
      } else {
        await submitDefect(unitId, title.trim(), description.trim())
      }

      toast.success('Pranešimas sėkmingai išsiųstas!')
      previews.forEach((url) => URL.revokeObjectURL(url))
      setTitle('')
      setDescription('')
      setFiles([])
      setPreviews([])
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Klaida. Bandykite dar kartą.')
    } finally {
      setSubmitting(false)
    }
  }

  const isValid = title.trim().length > 0 && description.trim().length > 0

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Left: defect info */}
        <Card className="rounded-3xl">
          <CardContent className="flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-medium">1. Defekto informacija</h2>
              <p className="text-sm text-muted-foreground mt-1">Pateikite aiškų aprašymą</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reg-title">Trumpas pavadinimas*</Label>
              <Input
                id="reg-title"
                placeholder="pvz., vandens nutekėjimas po kriaukle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reg-description">Išsamus aprašymas*</Label>
              <Textarea
                id="reg-description"
                placeholder={`Prašome nurodyti:\n• Kas nutiko?\n• Kada tai prasidėjo?\n• Ar yra papildomų patekimo sąlygų ar svarbių pastabų?`}
                value={description}
                onChange={(e) => {
                  if (e.target.value.length <= 500) setDescription(e.target.value)
                }}
                rows={6}
                required
              />
              <span className="text-right text-xs text-muted-foreground">
                {description.length}/500
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Right: photo upload */}
        <Card className="rounded-3xl">
          <CardContent className="flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-medium">2. Nuotraukų įkėlimas</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Pridėkite nuotraukas, kad galėtume geriau suprasti defektą
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Nuotraukos*</Label>
              <div
                {...getRootProps()}
                className={[
                  'flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors',
                  isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50',
                  files.length >= MAX_FILES ? 'cursor-not-allowed opacity-50' : '',
                ].join(' ')}
              >
                <input {...getInputProps()} aria-label="Nuotraukų įkėlimas" />
                <UploadSimple className="h-7 w-7 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  {isDragActive
                    ? 'Paleiskite čia...'
                    : 'Vilkite arba spustelėkite, kad įkeltumėte nuotraukas'}
                </p>
                <p className="text-xs text-muted-foreground">Priimtini formatai: JPG, PNG.</p>
              </div>
            </div>

            {previews.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {previews.map((src, i) => (
                  <div
                    key={i}
                    className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-border"
                  >
                    {files[i]?.type.startsWith('video/') ? (
                      <video src={src} className="h-full w-full object-cover" muted playsInline />
                    ) : (
                      <Image
                        src={src}
                        alt={`Peržiūra ${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-5 w-5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={!isValid || submitting}>
          {submitting ? 'Siunčiama...' : 'Siųsti'}
        </Button>
      </div>
    </form>
  )
}
