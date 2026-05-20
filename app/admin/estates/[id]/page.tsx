import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/page-header'
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
import { CaretLeft, PencilSimpleLine } from '@phosphor-icons/react/dist/ssr'
import { InviteOwnerDialog } from '@/components/admin/invite-owner-dialog'
import { UnitFormDialog } from '@/components/admin/unit-form-dialog'
import { EstatePhotosSection } from '@/components/admin/estate-photos-section'
import { EstateContactsSection } from '@/components/admin/estate-contacts-section'
import type { Contact } from '@/lib/types'

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

  // Fetch estate photos from storage
  interface EstatePhoto { storagePath: string; url: string; name: string }
  const estatePhotos: EstatePhoto[] = []
  {
    const { data: files } = await adminClient.storage
      .from('unit-files')
      .list(`estate-photos/${id}`, { limit: 50 })

    if (files && files.length > 0) {
      const { data: signed } = await adminClient.storage
        .from('unit-files')
        .createSignedUrls(
          files.map((f) => `estate-photos/${id}/${f.name}`),
          60 * 60
        )
      for (const s of signed ?? []) {
        if (s.signedUrl && s.path) {
          const name = s.path.split('/').pop() ?? s.path
          estatePhotos.push({ storagePath: s.path, url: s.signedUrl, name })
        }
      }
    }
  }

  const { data: allContactsData } = await supabase
    .from('contacts')
    .select('*')
    .order('title', { ascending: true })

  const allContacts = (allContactsData ?? []) as Contact[]

  const { data: assignedData } = await supabase
    .from('estate_contacts')
    .select('contact_id')
    .eq('estate_id', id)

  const assignedIds = new Set((assignedData ?? []).map((r) => r.contact_id))
  const assignedContacts = allContacts.filter((c) => assignedIds.has(c.id))

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
            <CaretLeft className="size-4" />
            <span className="sr-only">Grįžti</span>
          </Link>
        </Button>
        <PageHeader title={estate.name} description={estate.address} />
      </div>

      <div>
        <h2 className="text-lg font-medium mb-4">Nuotraukos</h2>
        <EstatePhotosSection estateId={id} photos={estatePhotos} />
      </div>

      <div>
        <h2 className="text-lg font-medium mb-4">Kontaktai</h2>
        <EstateContactsSection
          estateId={id}
          assignedContacts={assignedContacts}
          allContacts={allContacts}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Butai</h2>
          <UnitFormDialog estateId={id} />
        </div>
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
    </div>
  )
}
