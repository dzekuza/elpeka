import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DefectTable, type DefectRow } from '@/components/admin/defect-table'
import type { DefectStatus } from '@/lib/types'
import { PageHeader } from '@/components/page-header'

export default async function DefectsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  if (user.user_metadata?.role !== 'admin') redirect('/portal')

  const adminClient = createAdminClient()

  const { data: defectsData } = await adminClient
    .from('defects')
    .select(`
      id,
      title,
      status,
      submitted_by,
      created_at,
      unit_id,
      units (
        id,
        unit_number,
        estate_id,
        estates (
          id,
          name
        )
      )
    `)
    .order('created_at', { ascending: false })

  const { data: estatesData } = await adminClient
    .from('estates')
    .select('id, name')
    .order('name')

  const userIds = [
    ...new Set((defectsData ?? []).map((d) => d.submitted_by).filter(Boolean)),
  ]

  const emailMap: Record<string, string> = {}

  if (userIds.length > 0) {
    const { data: usersData } = await adminClient.auth.admin.listUsers()
    if (usersData?.users) {
      for (const u of usersData.users) {
        emailMap[u.id] = u.email ?? u.id
      }
    }
  }

  const defects: DefectRow[] = (defectsData ?? []).map((d) => {
    type UnitShape = { id: string; unit_number: string; estate_id: string; estates: { id: string; name: string } | null }
    const unit = (d.units as unknown) as UnitShape | null
    const estate = unit?.estates ?? null

    return {
      id: d.id,
      title: d.title,
      estate_name: estate?.name ?? '—',
      unit_number: unit?.unit_number ?? '—',
      owner_email: emailMap[d.submitted_by] ?? d.submitted_by,
      status: d.status as DefectStatus,
      created_at: d.created_at,
      estate_id: estate?.id ?? '',
    }
  })

  const estates = (estatesData ?? []).map((e) => ({ id: e.id, name: e.name }))

  return (
    <div className="space-y-6">
      <div>
        <PageHeader title="Defektai" description="Valdykite savininkų pateiktus defektų pranešimus" />
      </div>
      <DefectTable defects={defects} estates={estates} />
    </div>
  )
}
