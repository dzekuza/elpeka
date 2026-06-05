import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = { title: 'Kontaktai | ELPEKAS' }
import { PageHeader } from '@/components/page-header'
import { PortalContactCard } from '@/components/portal/portal-contact-card'
import type { ContactWithDocuments } from '@/lib/types'
import { PortalAnimateIn } from '@/components/portal/portal-animate-in'

export default async function KontaktaiPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: ownership } = await supabase
    .from('unit_owners')
    .select('unit_id, units(estate_id)')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .maybeSingle()

  const estateId = (ownership?.units as unknown as { estate_id: string } | null)?.estate_id ?? null

  type ContactRow = ContactWithDocuments & { documentUrls: Record<string, string> }
  let contacts: ContactRow[] = []

  if (estateId) {
    const { data: rows } = await supabase
      .from('estate_contacts')
      .select('contacts(*, documents:contact_documents(*))')
      .eq('estate_id', estateId)

    const raw = (rows ?? [])
      .map((r) => r.contacts)
      .filter(Boolean) as unknown as ContactWithDocuments[]

    contacts = await Promise.all(
      raw.map(async (contact) => {
        const documentUrls: Record<string, string> = {}
        if (contact.documents.length > 0) {
          const { data: signed } = await adminClient.storage
            .from('unit-files')
            .createSignedUrls(
              contact.documents.map((d) => d.storage_path),
              60 * 60
            )
          for (const s of signed ?? []) {
            if (s.signedUrl && s.path) {
              const doc = contact.documents.find((d) => d.storage_path === s.path)
              if (doc) documentUrls[doc.id] = s.signedUrl
            }
          }
        }
        return { ...contact, documentUrls }
      })
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Rangovai ir kontaktai"
        description="Čia rasite rangovų informaciją susijusią su jūsų objektu"
      />

      {contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground py-10 text-center">
          Kontaktų kol kas nėra.
        </p>
      ) : (
        <PortalAnimateIn className="flex flex-col gap-4">
          {contacts.map((contact) => (
            <PortalContactCard
              key={contact.id}
              contact={contact}
              documentUrls={contact.documentUrls}
            />
          ))}
        </PortalAnimateIn>
      )}
    </div>
  )
}
