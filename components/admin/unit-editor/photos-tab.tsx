'use client'

import { useCallback, useState, useTransition } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { toast } from 'sonner'
import { Camera, Trash, UploadSimple } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { uploadUnitPhoto, deleteDocument } from '@/lib/actions/units'

interface Photo {
  id: string
  storage_path: string
  url: string
  name: string
}

interface Preview {
  file: File
  previewUrl: string
}

interface PhotosTabProps {
  unitId: string
  photos: Photo[]
}

export function PhotosTab({ unitId, photos }: PhotosTabProps) {
  const [previews, setPreviews] = useState<Preview[]>([])
  const [isPending, startTransition] = useTransition()

  const onDrop = useCallback((accepted: File[]) => {
    const newPreviews = accepted.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    setPreviews((prev) => [...prev, ...newPreviews])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [] },
    maxSize: 10 * 1024 * 1024,
    onDropRejected: () => toast.error('Netinkamas failas (max 10MB, tik JPG/PNG)'),
  })

  function removePreview(index: number) {
    setPreviews((prev) => {
      const updated = [...prev]
      URL.revokeObjectURL(updated[index].previewUrl)
      updated.splice(index, 1)
      return updated
    })
  }

  function handleUpload() {
    if (previews.length === 0) return

    startTransition(async () => {
      try {
        for (const preview of previews) {
          const fd = new FormData()
          fd.append('file', preview.file)
          await uploadUnitPhoto(unitId, fd)
          URL.revokeObjectURL(preview.previewUrl)
        }
        setPreviews([])
        toast.success('Nuotraukos įkeltos')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Klaida įkeliant nuotraukas')
      }
    })
  }

  function handleDelete(photo: Photo) {
    startTransition(async () => {
      try {
        await deleteDocument(photo.id, photo.storage_path)
        toast.success('Nuotrauka ištrinta')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Klaida trinant nuotrauką')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <Camera className="size-8 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {isDragActive
            ? 'Paleiskite failus čia…'
            : 'Vilkite nuotraukas čia arba spustelėkite, kad pasirinktumėte'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">JPG, PNG — max 10MB</p>
      </div>

      {previews.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium">
            Laukia įkėlimo: {previews.length} nuotrauka(-os)
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative group aspect-square">
                <Image
                  src={preview.previewUrl}
                  alt={preview.file.name}
                  fill
                  className="rounded-md object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 size-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removePreview(index)}
                  aria-label="Pašalinti"
                >
                  <Trash className="size-3" />
                </Button>
              </div>
            ))}
          </div>
          <Button onClick={handleUpload} disabled={isPending}>
            <UploadSimple className="size-4 mr-2" />
            {isPending ? 'Įkeliama…' : `Įkelti ${previews.length} nuotrauką(-as)`}
          </Button>
        </div>
      )}

      {photos.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Įkeltos nuotraukos</p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group aspect-square">
                <Image
                  src={photo.url}
                  alt={photo.name}
                  fill
                  className="rounded-md object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 size-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(photo)}
                  disabled={isPending}
                  aria-label="Ištrinti"
                >
                  <Trash className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {photos.length === 0 && previews.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nėra įkeltų nuotraukų
        </p>
      )}
    </div>
  )
}
