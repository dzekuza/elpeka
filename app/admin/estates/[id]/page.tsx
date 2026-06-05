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

  // Phase 1: estate existence gate
  const { data: estate, error: estateError } = await supabase
    .from('estates')
    .select('*')
    .eq('id', id)
    .single()

  if (estateError || !estate) {
    notFound()
  }

  interface EstatePhoto { storagePath: string; url: string; name: string }

  // Phase 2: all independent queries in parallel
  const [
    { data: photoFiles },
    { data: allContactsData },
    { data: assignedData },
    { data: units },
  ] = await Promise.all([
    adminClient.storage.from('unit-files').list(`estate-photos/${id}`, { limit: 50 }),
    supabase.from('contacts').select('*').order('title', { ascending: true }),
    supabase.from('estate_contacts').select('contact_id').eq('estate_id', id),
    supabase.from('units').select('id, unit_number, floor, area_sqm, created_at').eq('estate_id', id).order('unit_number', { ascending: true }),
  ])

  // Phase 3: depends on phase 2 results — unit_owners + signed photo URLs in parallel
  const unitIdList = (units ?? []).map((u) => u.id)

  const [{ data: unitOwnersData }, estatePhotos] = await Promise.all([
    unitIdList.length > 0
      ? supabase.from('unit_owners').select('user_id, unit_id, accepted_at').in('unit_id', unitIdList)
      : Promise.resolve({ data: [] as Array<{ user_id: string; unit_id: string; accepted_at: string | null }> }),
    (async (): Promise<EstatePhoto[]> => {
      if (!photoFiles || photoFiles.length === 0) return []
      const { data: signed } = await adminClient.storage
        .from('unit-files')
        .createSignedUrls(photoFiles.map((f) => `estate-photos/${id}/${f.name}`), 60 * 60)
      return (signed ?? []).flatMap((s) => {
        if (!s.signedUrl || !s.path) return []
        return [{ storagePath: s.path, url: s.signedUrl, name: s.path.split('/').pop() ?? s.path }]
      })
    })(),
  ])

  // Phase 4: owner emails — parallel per user
  const ownerEmails: Record<string, string> = {}
  if (unitOwnersData && unitOwnersData.length > 0) {
    const userIds = [...new Set(unitOwnersData.map((o) => o.user_id))]
    const emailResults = await Promise.all(
      userIds.map((userId) => adminClient.auth.admin.getUserById(userId))
    )
    for (let i = 0; i < userIds.length; i++) {
      const email = emailResults[i].data?.user?.email
      if (email) ownerEmails[userIds[i]] = email
    }
  }

  const allContacts = (allContactsData ?? []) as Contact[]
  const assignedIds = new Set((assignedData ?? []).map((r) => r.contact_id))
  const assignedContacts = allContacts.filter((c) => assignedIds.has(c.id))

  const ownerByUnit: Record<string, { email: string | null; accepted_at: string | null }> = {}
  for (const owner of unitOwnersData ?? []) {
    ownerByUnit[owner.unit_id] = {
      email: ownerEmails[owner.user_id] ?? null,
      accepted_at: owner.accepted_at,
    }
  }

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
