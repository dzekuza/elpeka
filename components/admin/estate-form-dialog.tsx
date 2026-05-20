'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Image as ImageIcon, Plus, Trash, X } from '@phosphor-icons/react'
import { createEstate, updateEstate, setEstateCoverPhoto, uploadEstatePhoto } from '@/lib/actions/estates'
import { Estate } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

const estateSchema = z.object({
  name: z.string().min(1, 'Pavadinimas privalomas'),
  address: z.string().min(1, 'Adresas privalomas'),
  description: z.string().optional(),
})

type EstateFormValues = z.infer<typeof estateSchema>

interface EstateFormDialogProps {
  trigger: React.ReactNode
  estate?: Estate & { coverImageUrl?: string | null }
}

export function EstateFormDialog({ trigger, estate }: EstateFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(estate?.coverImageUrl ?? null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [galleryFiles, setGalleryFiles] = useState<{ file: File; preview: string }[]>([])

  const form = useForm<EstateFormValues>({
    resolver: zodResolver(estateSchema),
    defaultValues: {
      name: estate?.name ?? '',
      address: estate?.address ?? '',
      description: estate?.description ?? '',
    },
  })

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function clearImage() {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setGalleryFiles((prev) => [
      ...prev,
      ...files.map((f) => ({ file: f, preview: URL.createObjectURL(f) })),
    ])
    if (galleryInputRef.current) galleryInputRef.current.value = ''
  }

  function removeGalleryFile(index: number) {
    setGalleryFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  async function onSubmit(values: EstateFormValues) {
    setIsSubmitting(true)
    try {
      let estateId: string
      if (estate) {
        await updateEstate(estate.id, values)
        estateId = estate.id
        toast.success('Objektas atnaujintas')
      } else {
        const result = await createEstate(values)
        estateId = result.id
        toast.success('Objektas sukurtas')
      }

      if (imageFile) {
        const fd = new FormData()
        fd.append('file', imageFile)
        await setEstateCoverPhoto(estateId, fd)
      }

      for (const { file } of galleryFiles) {
        const fd = new FormData()
        fd.append('file', file)
        await uploadEstatePhoto(estateId, fd)
      }

      setOpen(false)
      form.reset()
      setImageFile(null)
      setImagePreview(null)
      setGalleryFiles([])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Klaida')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => {
      setOpen(v)
      if (!v) {
        setImageFile(null)
        setImagePreview(estate?.coverImageUrl ?? null)
        setGalleryFiles((prev) => { prev.forEach((f) => URL.revokeObjectURL(f.preview)); return [] })
      }
    }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{estate ? 'Redaguoti objektą' : 'Naujas objektas'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* Cover image */}
            <div className="space-y-2">
              <span className="text-sm font-medium">Viršelio nuotrauka</span>
              {imagePreview ? (
                <div className="relative h-40 w-full overflow-hidden rounded-xl">
                  <Image
                    src={imagePreview}
                    alt="Viršelis"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 text-muted-foreground transition-colors hover:bg-muted/60"
                >
                  <ImageIcon className="size-8" />
                  <span className="text-sm">Pasirinkite nuotrauką</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              {imagePreview && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Keisti nuotrauką
                </Button>
              )}
            </div>

            {/* Gallery */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Galerija</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => galleryInputRef.current?.click()}
                >
                  <Plus className="size-3.5 mr-1" />
                  Pridėti nuotraukų
                </Button>
              </div>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleGalleryChange}
              />
              {galleryFiles.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {galleryFiles.map((item, i) => (
                    <div key={i} className="group relative aspect-square overflow-hidden rounded-lg">
                      <Image src={item.preview} alt={item.file.name} fill className="object-cover" unoptimized />
                      <button
                        type="button"
                        onClick={() => removeGalleryFile(i)}
                        className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Trash className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Nėra pridėtų galerijos nuotraukų</p>
              )}
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pavadinimas</FormLabel>
                  <FormControl>
                    <Input placeholder="Objekto pavadinimas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresas</FormLabel>
                  <FormControl>
                    <Input placeholder="Gatvė, miestas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aprašymas</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Neprivalomas aprašymas" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                Atšaukti
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saugoma...' : 'Išsaugoti'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
