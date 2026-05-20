import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'
import { DefectForm } from '@/components/portal/defect-form'
import { DefectCard, type EnrichedReply } from '@/components/portal/defect-card'
import type { DefectWithDetails, DefectStatus } from '@/lib/types'

export default async function DefektaiPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Resolve unit for this owner
  const { data: ownership } = await supabase
    .from('unit_owners')
    .select('unit_id')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .maybeSingle()

  const unitId = ownership?.unit_id ?? null

  // Fetch defects with attachments and replies
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

  const activeCount = defectsWithUrls.filter((d) => d.status !== 'atlikta').length

  return (
    <div className="space-y-8">
      <PageHeader title="Defektai" />

      <Tabs defaultValue="registruoti">
        <TabsList className="mb-6">
          <TabsTrigger value="registruoti">Registruoti defektą</TabsTrigger>
          <TabsTrigger value="sekti" className="flex items-center gap-2">
            Sekti eigą
            {activeCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {activeCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registruoti">
          {unitId ? (
            <DefectForm unitId={unitId} />
          ) : (
            <p className="text-muted-foreground text-sm">
              Nepriskirtas joks butas. Susisiekite su administratoriumi.
            </p>
          )}
        </TabsContent>

        <TabsContent value="sekti">
          {defectsWithUrls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
              <p className="text-muted-foreground text-sm">
                Kol kas defektų nėra. Pateikite pirmą pranešimą skirtuke &quot;Registruoti defektą&quot;.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {defectsWithUrls.map((defect) => (
                <DefectCard key={defect.id} defect={defect} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
