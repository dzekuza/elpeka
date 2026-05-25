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
import { submitDefect } from '@/lib/actions/defects'

interface DefectFormProps {
  unitId: string
  onSuccess?: () => void
}

const MAX_FILES = 5
const MAX_SIZE_BYTES = 50 * 1024 * 1024

export function DefectForm({ unitId, onSuccess }: DefectFormProps) {
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="defect-title">Pavadinimas</Label>
        <Input
          id="defect-title"
          placeholder="Trumpas defekto aprašymas"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="defect-description">Aprašymas</Label>
        <Textarea
          id="defect-description"
          placeholder="Išsamiai aprašykite defektą: vietą, aplinkybes, pastabas."
          value={description}
          onChange={(e) => {
            if (e.target.value.length <= 500) {
              setDescription(e.target.value)
            }
          }}
          rows={5}
          required
        />
        <span className="text-right text-xs text-muted-foreground">
          {description.length}/500
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <Label>Nuotraukos ar vaizdo įrašai</Label>
        <div
          {...getRootProps()}
          className={[
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors',
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/30 hover:border-primary/50',
            files.length >= MAX_FILES ? 'cursor-not-allowed opacity-50' : '',
          ].join(' ')}
        >
          <input {...getInputProps()} />
          <UploadSimple className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">
            {isDragActive ? 'Paleiskite čia...' : 'Įkelti nuotraukas ar vaizdo įrašus'}
          </p>
          <p className="text-xs text-muted-foreground">
            JPG, PNG, WEBP, GIF, MP4, MOV, AVI, WEBM — maks. {MAX_FILES} failai, po 50 MB
          </p>
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
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-1">
        <Button type="submit" disabled={!isValid || submitting}>
          {submitting ? 'Siunčiama...' : 'Siųsti pranešimą'}
        </Button>
      </div>
    </form>
  )
}
