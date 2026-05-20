'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { X, Upload } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { submitDefect } from '@/lib/actions/defects'

interface DefectFormProps {
  unitId: string
}

const MAX_FILES = 5
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export function DefectForm({ unitId }: DefectFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

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
    accept: { 'image/*': [] },
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
        fd.append('file', files[0])
        await submitDefect(unitId, title.trim(), description.trim(), fd)
      } else {
        await submitDefect(unitId, title.trim(), description.trim())
      }

      toast.success('Pranešimas sėkmingai išsiųstas!')

      // Reset
      previews.forEach((url) => URL.revokeObjectURL(url))
      setTitle('')
      setDescription('')
      setFiles([])
      setPreviews([])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Klaida. Bandykite dar kartą.')
    } finally {
      setSubmitting(false)
    }
  }

  const isValid = title.trim().length > 0 && description.trim().length > 0

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left: Defect info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Defekto informacija</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
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
                placeholder="Išsamiai aprašykite defektą — vietą, aplinkybes, pastabas..."
                value={description}
                onChange={(e) => {
                  if (e.target.value.length <= 500) {
                    setDescription(e.target.value)
                  }
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

        {/* Right: Photo upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Nuotraukų įkėlimas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={[
                'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors',
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/30 hover:border-primary/50',
                files.length >= MAX_FILES
                  ? 'cursor-not-allowed opacity-50'
                  : '',
              ].join(' ')}
            >
              <input {...getInputProps()} />
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                {isDragActive
                  ? 'Paleiskite čia...'
                  : 'Vilkite nuotraukas arba spauskite pasirinkti'}
              </p>
              <p className="text-xs text-muted-foreground">
                Maks. {MAX_FILES} nuotraukos, po 10 MB
              </p>
            </div>

            {/* Previews */}
            {previews.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {previews.map((src, i) => (
                  <div
                    key={i}
                    className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-border"
                  >
                    <Image
                      src={src}
                      alt={`Peržiūra ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
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
          </CardContent>
        </Card>
      </div>

      {/* Submit */}
      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={!isValid || submitting}>
          {submitting ? 'Siunčiama...' : 'Siųsti pranešimą'}
        </Button>
      </div>
    </form>
  )
}
