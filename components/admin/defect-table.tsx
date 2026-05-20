'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { DefectStatus } from '@/lib/types'

export interface DefectRow {
  id: string
  title: string
  estate_name: string
  unit_number: string
  owner_email: string
  status: DefectStatus
  created_at: string
  estate_id: string
}

interface DefectTableProps {
  defects: DefectRow[]
  estates: { id: string; name: string }[]
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

const STATUS_LABELS: Record<DefectStatus, string> = {
  pateikta: 'Pateikta',
  sprendziama: 'Sprendžiama',
  atlikta: 'Atlikta',
}

function StatusBadge({ status }: { status: DefectStatus }) {
  const classMap: Record<DefectStatus, string> = {
    pateikta: '[background:var(--status-pateikta)] text-white',
    sprendziama: '[background:var(--status-sprendziama)] text-white',
    atlikta: '[background:var(--status-atlikta)] text-white',
  }

  return (
    <Badge className={classMap[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}

export function DefectTable({ defects, estates }: DefectTableProps) {
  const [estateFilter, setEstateFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    return defects.filter((d) => {
      const matchEstate = estateFilter === 'all' || d.estate_id === estateFilter
      const matchStatus = statusFilter === 'all' || d.status === statusFilter
      return matchEstate && matchStatus
    })
  }, [defects, estateFilter, statusFilter])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={estateFilter} onValueChange={setEstateFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Visi objektai" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Visi objektai</SelectItem>
            {estates.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Visi statusai" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Visi statusai</SelectItem>
            <SelectItem value="pateikta">Pateikta</SelectItem>
            <SelectItem value="sprendziama">Sprendžiama</SelectItem>
            <SelectItem value="atlikta">Atlikta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">Nr.</TableHead>
            <TableHead>Pavadinimas</TableHead>
            <TableHead>Objektas</TableHead>
            <TableHead>Savininkas</TableHead>
            <TableHead>Statusas</TableHead>
            <TableHead>Pateikta</TableHead>
            <TableHead className="text-right">Veiksmai</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                Nėra defektų
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((defect) => (
              <TableRow key={defect.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  #{shortId(defect.id)}
                </TableCell>
                <TableCell className="font-medium">{defect.title}</TableCell>
                <TableCell>
                  {defect.estate_name}
                  <span className="text-muted-foreground ml-1">· {defect.unit_number}</span>
                </TableCell>
                <TableCell className="text-sm">{defect.owner_email}</TableCell>
                <TableCell>
                  <StatusBadge status={defect.status} />
                </TableCell>
                <TableCell>{formatLithuanianDate(defect.created_at)}</TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/defects/${defect.id}`}>Peržiūrėti</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
