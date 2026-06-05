import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/page-header'
import { DefektaiTabs } from '@/components/portal/defektai-tabs'
import type { EnrichedReply } from '@/components/portal/defect-card'
import type { DefectWithDetails, DefectStatus } from '@/lib/types'
import { PortalAnimateIn } from '@/components/portal/portal-animate-in'

export default async function DefektaiPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: ownership } = await supabase
    .from('unit_owners')
    .select('unit_id')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .maybeSingle()

  const unitId = ownership?.unit_id ?? null

  let defectsWithUrls: (Omit<DefectWithDetails, 'replies'> & { attachmentUrls: string[]; replies: EnrichedReply[] })[] = []

  if (unitId) {
    const { data: rawDefects } = await supabase
      .from('defects')
      .select(`
        id,
        unit_id,
        submitted_by,
        title,
        description,
        status,
        created_at,
        defect_attachments (
          id,
          defect_id,
          storage_path,
          uploaded_by,
          created_at
        ),
        defect_replies (
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
        )
      `)
      .eq('unit_id', unitId)
      .order('created_at', { ascending: false })

    if (rawDefects && rawDefects.length > 0) {
      const adminClient = createAdminClient()

      defectsWithUrls = await Promise.all(
        rawDefects.map(async (defect) => {
          const attachments = defect.defect_attachments ?? []
          const attachmentUrls = await Promise.all(
            attachments.map(async (att: { storage_path: string }) => {
              const { data } = await adminClient.storage
                .from('unit-files')
                .createSignedUrl(att.storage_path, 3600)
              return data?.signedUrl ?? ''
            })
          )

          const replies = await Promise.all(
            (defect.defect_replies ?? []).map(
              async (reply: {
                id: string
                defect_id: string
                author_id: string
                body: string
                created_at: string
                defect_reply_attachments: {
                  id: string
                  reply_id: string
                  storage_path: string
                  created_at: string
                }[]
              }) => {
                const replyAttachmentUrls = await Promise.all(
                  (reply.defect_reply_attachments ?? []).map(async (a) => {
                    const { data } = await adminClient.storage
                      .from('unit-files')
                      .createSignedUrl(a.storage_path, 3600)
                    return data?.signedUrl ?? ''
                  })
                )
                return {
                  id: reply.id,
                  defect_id: reply.defect_id,
                  author_id: reply.author_id,
                  body: reply.body,
                  created_at: reply.created_at,
                  attachments: reply.defect_reply_attachments ?? [],
                  attachmentUrls: replyAttachmentUrls.filter(Boolean),
                }
              }
            )
          )

          return {
            id: defect.id,
            unit_id: defect.unit_id,
            submitted_by: defect.submitted_by,
            title: defect.title,
            description: defect.description,
            status: defect.status as DefectStatus,
            created_at: defect.created_at,
            attachments: attachments.map(
              (att: {
                id: string
                defect_id: string
                storage_path: string
                uploaded_by: string
                created_at: string
              }) => ({
                id: att.id,
                defect_id: att.defect_id,
                storage_path: att.storage_path,
                uploaded_by: att.uploaded_by,
                created_at: att.created_at,
              })
            ),
            replies,
            attachmentUrls: attachmentUrls.filter(Boolean),
          }
        })
      )
    }
  }

  return (
    <PortalAnimateIn className="space-y-8">
      <PageHeader
        title="Defektai ir Pastabos"
        description="Praneškite apie defektus ir sekite jų sprendimo eigą"
      />

      {!unitId ? (
        <p className="text-muted-foreground text-sm">
          Nepriskirtas joks butas. Susisiekite su administratoriumi.
        </p>
      ) : (
        <DefektaiTabs unitId={unitId} defects={defectsWithUrls} />
      )}
    </PortalAnimateIn>
  )
}
