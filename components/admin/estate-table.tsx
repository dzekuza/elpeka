'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { PencilSimpleLine, Trash, Eye } from '@phosphor-icons/react'
import { EstateWithUnitCount } from '@/lib/types'
import { deleteEstate } from '@/lib/actions/estates'
import { EstateFormDialog } from './estate-form-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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

function formatLithuanianDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('lt-LT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
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

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pavadinimas</TableHead>
            <TableHead>Adresas</TableHead>
            <TableHead className="text-center">Butų skaičius</TableHead>
            <TableHead>Sukurta</TableHead>
            <TableHead className="text-right">Veiksmai</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {estates.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                Nėra objektų
              </TableCell>
            </TableRow>
          ) : (
            estates.map((estate) => (
              <TableRow key={estate.id}>
                <TableCell className="font-medium">{estate.name}</TableCell>
                <TableCell>{estate.address}</TableCell>
                <TableCell className="text-center">{estate.unit_count}</TableCell>
                <TableCell>{formatLithuanianDate(estate.created_at)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button asChild variant="ghost" size="icon">
                      <Link href={`/admin/estates/${estate.id}`}>
                        <Eye className="size-4" />
                        <span className="sr-only">Žiūrėti butus</span>
                      </Link>
                    </Button>
                    <EstateFormDialog
                      estate={estate}
                      trigger={
                        <Button variant="ghost" size="icon">
                          <PencilSimpleLine className="size-4" />
                          <span className="sr-only">Redaguoti</span>
                        </Button>
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(estate)}
                    >
                      <Trash className="size-4" />
                      <span className="sr-only">Ištrinti</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

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
