import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DefectThread, type DefectDetail, type ReplyWithAttachments } from '@/components/admin/defect-thread'
import type { DefectStatus } from '@/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function DefectDetailPage({ params }: PageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/portal')

  const { id } = await params
  const adminClient = createAdminClient()

  const { data: defectData, error } = await adminClient
    .from('defects')
    .select(`
      id,
      title,
      description,
      status,
      submitted_by,
      created_at,
      defect_attachments (
        id,
        defect_id,
        storage_path,
        uploaded_by,
        created_at
      ),
      units (
        id,
        unit_number,
        estates (
          id,
          name
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !defectData) notFound()

  const { data: repliesData } = await adminClient
    .from('defect_replies')
    .select(`
      id,
      defect_id,
      author_id,
      body,
      created_at,
      defect_reply_attachments (
        id,
        reply_id,
        storage_path,
        created_at
      )
    `)
    .eq('defect_id', id)
    .order('created_at', { ascending: true })

  // Collect all user IDs to look up emails
  const authorIds = [...new Set((repliesData ?? []).map((r) => r.author_id))]
  const allUserIds = [...new Set([defectData.submitted_by, ...authorIds])]

  const emailMap: Record<string, string> = {}
  if (allUserIds.length > 0) {
    const { data: usersData } = await adminClient.auth.admin.listUsers()
    if (usersData?.users) {
      for (const u of usersData.users) {
        emailMap[u.id] = u.email ?? u.id
      }
    }
  }

  type UnitShape = {
    id: string
    unit_number: string
    estates: { id: string; name: string } | null
  }
  const unit = (defectData.units as unknown) as UnitShape | null

  const defect: DefectDetail = {
    id: defectData.id,
    title: defectData.title,
    description: defectData.description,
    status: defectData.status as DefectStatus,
    submitted_by_email: emailMap[defectData.submitted_by] ?? defectData.submitted_by,
    created_at: defectData.created_at,
    estate_name: unit?.estates?.name ?? '—',
    unit_number: unit?.unit_number ?? '—',
    attachments: (defectData.defect_attachments ?? []) as DefectDetail['attachments'],
  }

  const replies: ReplyWithAttachments[] = (repliesData ?? []).map((r) => ({
    id: r.id,
    defect_id: r.defect_id,
    author_id: r.author_id,
    body: r.body,
    created_at: r.created_at,
    author_email: emailMap[r.author_id] ?? r.author_id,
    attachments: (r.defect_reply_attachments ?? []).map((a) => ({
      id: a.id,
      reply_id: a.reply_id,
      storage_path: a.storage_path,
      created_at: a.created_at,
    })),
  }))

  return (
    <div className="max-w-3xl space-y-2">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Defektas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {defect.estate_name} · {defect.unit_number}
        </p>
      </div>
      <DefectThread defect={defect} replies={replies} />
    </div>
  )
}
