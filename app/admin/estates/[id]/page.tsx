import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Pencil } from 'lucide-react'
import { InviteOwnerDialog } from '@/components/admin/invite-owner-dialog'

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

function formatDate(dateString: string | null): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('lt-LT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export default async function EstateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: estate, error: estateError } = await supabase
    .from('estates')
    .select('*')
    .eq('id', id)
    .single()

  if (estateError || !estate) {
    notFound()
  }

  const { data: unitOwnersData } = await supabase
    .from('unit_owners')
    .select('user_id, unit_id, accepted_at')
    .in(
      'unit_id',
      await supabase
        .from('units')
        .select('id')
        .eq('estate_id', id)
        .then(({ data }) => (data ?? []).map((u) => u.id))
    )

  const ownerEmails: Record<string, string> = {}

  if (unitOwnersData && unitOwnersData.length > 0) {
    const userIds = [...new Set(unitOwnersData.map((o) => o.user_id))]
    for (const userId of userIds) {
      const { data: userData } = await adminClient.auth.admin.getUserById(userId)
      if (userData?.user?.email) {
        ownerEmails[userId] = userData.user.email
      }
    }
  }

  const ownerByUnit: Record<string, { email: string | null; accepted_at: string | null }> = {}
  for (const owner of unitOwnersData ?? []) {
    ownerByUnit[owner.unit_id] = {
      email: ownerEmails[owner.user_id] ?? null,
      accepted_at: owner.accepted_at,
    }
  }

  const { data: units } = await supabase
    .from('units')
    .select('id, unit_number, floor, area_sqm, created_at')
    .eq('estate_id', id)
    .order('unit_number', { ascending: true })

  const unitsWithOwners: UnitRow[] = (units ?? []).map((unit) => {
    const owner = ownerByUnit[unit.id]
    return {
      ...unit,
      unit_owners: owner
        ? [{ user_id: '', accepted_at: owner.accepted_at, email: owner.email }]
        : [],
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/estates">
            <ChevronLeft className="size-4" />
            <span className="sr-only">Grįžti</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{estate.name}</h1>
          <p className="text-sm text-muted-foreground">{estate.address}</p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-4">Butai</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Buto nr.</TableHead>
              <TableHead>Aukštas</TableHead>
              <TableHead>Plotas (m²)</TableHead>
              <TableHead>Savininkas</TableHead>
              <TableHead>Prisijungė</TableHead>
              <TableHead className="text-right">Veiksmai</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {unitsWithOwners.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  Nėra butų
                </TableCell>
              </TableRow>
            ) : (
              unitsWithOwners.map((unit) => {
                const owner = unit.unit_owners[0] ?? null
                return (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">
                      {unit.unit_number}
                    </TableCell>
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
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!owner?.accepted_at && (
                          <InviteOwnerDialog
                            unitId={unit.id}
                            unitNumber={unit.unit_number}
                            estateId={id}
                          />
                        )}
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/estates/${id}/units/${unit.id}`}>
                            <Pencil className="size-4 mr-1" />
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
    </div>
  )
}
