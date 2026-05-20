'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PencilSimpleLine, Trash } from '@phosphor-icons/react'
import { deleteUnits } from '@/lib/actions/units'
import { InviteOwnerDialog } from './invite-owner-dialog'
import { UnitFormDialog } from './unit-form-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface UnitRow {
  id: string
  unit_number: string
  floor: number | null
  area_sqm: number | null
  created_at: string
  unit_owners: Array<{
    user_id: string
    accepted_at: string | null
    email: string | null
  }>
}

interface UnitsDataTableProps {
  estateId: string
  units: UnitRow[]
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('lt-LT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function UnitsDataTable({ estateId, units }: UnitsDataTableProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isPending, startTransition] = useTransition()

  const allSelected = units.length > 0 && selected.size === units.length
  const someSelected = selected.size > 0 && !allSelected

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(units.map((u) => u.id)))
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  function handleBulkDelete() {
    startTransition(async () => {
      try {
        await deleteUnits([...selected], estateId)
        toast.success(`${selected.size} ${selected.size === 1 ? 'butas ištrintas' : 'butai ištrinti'}`)
        setSelected(new Set())
        setConfirmDelete(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Klaida trinant butus')
      }
    })
  }

  return (
    <>
      <div className="space-y-2">
        {/* Header row: title + add button + bulk toolbar */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Butai</h2>
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash className="size-4 mr-1.5" />
                Ištrinti ({selected.size})
              </Button>
            )}
            <UnitFormDialog estateId={estateId} />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  onCheckedChange={toggleAll}
                  aria-label="Pažymėti visus"
                />
              </TableHead>
              <TableHead>Buto nr.</TableHead>
              <TableHead>Aukštas</TableHead>
              <TableHead>Plotas (m²)</TableHead>
              <TableHead>Savininkas</TableHead>
              <TableHead>Prisijungė</TableHead>
              <TableHead className="text-right">Veiksmai</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {units.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nėra butų
                </TableCell>
              </TableRow>
            ) : (
              units.map((unit) => {
                const owner = unit.unit_owners[0] ?? null
                const isSelected = selected.has(unit.id)
                return (
                  <TableRow
                    key={unit.id}
                    data-state={isSelected ? 'selected' : undefined}
                    className="cursor-pointer"
                    onClick={() => router.push(`/admin/estates/${estateId}/units/${unit.id}`)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleRow(unit.id)}
                        aria-label={`Pažymėti ${unit.unit_number}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{unit.unit_number}</TableCell>
                    <TableCell>{unit.floor ?? '—'}</TableCell>
                    <TableCell>{unit.area_sqm ?? '—'}</TableCell>
                    <TableCell>
                      {owner?.email ? (
                        owner.email
                      ) : (
                        <Badge variant="secondary">Savininkas neprikeltas</Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(owner?.accepted_at ?? null)}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {!owner?.accepted_at && (
                          <InviteOwnerDialog
                            unitId={unit.id}
                            unitNumber={unit.unit_number}
                            estateId={estateId}
                          />
                        )}
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/estates/${estateId}/units/${unit.id}`}>
                            <PencilSimpleLine className="size-4 mr-1" />
                            Redaguoti
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ištrinti {selected.size} {selected.size === 1 ? 'butą' : 'butus'}?</DialogTitle>
            <DialogDescription>
              Šis veiksmas negrįžtamas. Visi pasirinkti butai ir jų duomenys bus ištrinti.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={isPending}>
              Atšaukti
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={isPending}>
              {isPending ? 'Trinama...' : 'Ištrinti'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
