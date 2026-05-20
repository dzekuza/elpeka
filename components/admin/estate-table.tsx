'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { PencilSimpleLine, Trash, Buildings, MapPin, ArrowRight } from '@phosphor-icons/react'
import { EstateWithUnitCount } from '@/lib/types'
import { deleteEstate } from '@/lib/actions/estates'
import { EstateFormDialog } from './estate-form-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface EstateTableProps {
  estates: EstateWithUnitCount[]
}

export function EstateTable({ estates }: EstateTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<EstateWithUnitCount | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function confirmDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteEstate(deleteTarget.id)
      toast.success('Objektas ištrintas')
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Klaida trinant objektą')
    } finally {
      setIsDeleting(false)
    }
  }

  if (estates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center text-muted-foreground">
        <Buildings className="mb-3 size-10 opacity-30" />
        <p className="text-sm">Nėra objektų</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {estates.map((estate) => (
          <div key={estate.id} className="group relative flex flex-col gap-3.5 rounded-2xl bg-card p-2 shadow-sm ring-1 ring-border">
            <Link href={`/admin/estates/${estate.id}`} className="absolute inset-0 z-0 rounded-2xl" aria-label={estate.name} />

            {/* Image / placeholder */}
            <div className="relative h-48 overflow-hidden rounded-xl bg-muted">
              {estate.cover_image_url ? (
                <Image
                  src={estate.cover_image_url}
                  alt={estate.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Buildings className="size-12 text-muted-foreground/25" />
                </div>
              )}

              {/* Unit count badge */}
              <div className="absolute bottom-4 left-4 z-10 flex items-center rounded border border-primary/20 bg-card px-3 py-1.5">
                <span className="text-xs font-medium text-primary">
                  {estate.unit_count} {estate.unit_count === 1 ? 'butas' : 'butai'}
                </span>
              </div>

              {/* Action buttons — visible on card hover */}
              <div className="absolute right-3 top-3 z-10 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <EstateFormDialog
                  estate={{ ...estate, coverImageUrl: estate.cover_image_url }}
                  trigger={
                    <Button variant="secondary" size="icon" className="size-8 shadow-sm">
                      <PencilSimpleLine className="size-3.5" />
                      <span className="sr-only">Redaguoti</span>
                    </Button>
                  }
                />
                <Button
                  variant="secondary"
                  size="icon"
                  className="size-8 shadow-sm text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(estate)}
                >
                  <Trash className="size-3.5" />
                  <span className="sr-only">Ištrinti</span>
                </Button>
              </div>
            </div>

            {/* Name + address */}
            <div className="flex flex-col gap-1 px-2">
              <span className="text-base font-medium leading-5 text-foreground">{estate.name}</span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-4 shrink-0" />
                {estate.address}
              </span>
            </div>

            {/* Open button */}
            <div className="px-2 pb-2">
              <div className="flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-1.5">
                <span className="text-sm font-medium text-primary-foreground">Atidaryti projektą</span>
                <ArrowRight className="size-4 text-primary-foreground" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ištrinti objektą?</DialogTitle>
            <DialogDescription>
              Ar tikrai norite ištrinti &quot;{deleteTarget?.name}&quot;? Šio veiksmo anuliuoti
              negalima.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Atšaukti
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Trinama...' : 'Ištrinti'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
