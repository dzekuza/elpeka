import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/page-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EstatePhotosSection } from '@/components/admin/estate-photos-section'
import { EstateContactsSection } from '@/components/admin/estate-contacts-section'
import { UnitsDataTable } from '@/components/admin/units-data-table'
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
      <PageHeader title={estate.name} description={estate.address} />

      <Tabs defaultValue="units">
        <TabsList>
          <TabsTrigger value="units">Butai</TabsTrigger>
          <TabsTrigger value="photos">Nuotraukos</TabsTrigger>
          <TabsTrigger value="contacts">Kontaktai</TabsTrigger>
        </TabsList>
        <TabsContent value="units">
          <UnitsDataTable estateId={id} units={unitsWithOwners} />
        </TabsContent>
        <TabsContent value="photos">
          <EstatePhotosSection estateId={id} photos={estatePhotos} />
        </TabsContent>
        <TabsContent value="contacts">
          <EstateContactsSection
            estateId={id}
            assignedContacts={assignedContacts}
            allContacts={allContacts}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
