import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Plus } from '@phosphor-icons/react/dist/ssr'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { ContactFormDialog } from '@/components/admin/contact-form-dialog'
import { ContactDocumentsSection } from '@/components/admin/contact-documents-section'
import { ContactRowActions } from '@/components/admin/contact-row-actions'
import type { Contact, ContactDocument } from '@/lib/types'

const CATEGORY_LABELS: Record<string, string> = {
  windows: 'Langai',
  heating: 'Šildymas',
  water: 'Vanduo',
  electrical: 'Elektra',
  waste: 'Atliekų išvežimas',
  internet: 'Internetas',
  general: 'Bendrasis',
  construction: 'Statybos darbai',
}

export default async function AdminContactsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') redirect('/login')

  const { data: contacts } = await supabase
    .from('contacts')
    .select('*, documents:contact_documents(*)')
    .order('created_at', { ascending: false })

  const rows = (contacts ?? []) as (Contact & { documents: ContactDocument[] })[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Kontaktai" description="Kontaktų biblioteka" />
        <ContactFormDialog
          trigger={
            <Button>
              <Plus className="size-4 mr-2" />
              Pridėti kontaktą
            </Button>
          }
        />
      </div>

      <div className="flex flex-col gap-4">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-10 text-center">
            Kontaktų biblioteka tuščia. Pridėkite pirmą kontaktą.
          </p>
        ) : (
          rows.map((contact) => (
            <div
              key={contact.id}
              className="rounded-[16px] bg-white p-6 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {CATEGORY_LABELS[contact.category] ?? contact.category}
                  </span>
                  <p className="text-lg font-medium text-foreground">{contact.title}</p>
                  {contact.company_name && (
                    <p className="text-sm text-muted-foreground">{contact.company_name}</p>
                  )}
                  <div className="flex flex-wrap gap-4 mt-1">
                    {contact.phone && (
                      <span className="text-sm text-foreground">{contact.phone}</span>
                    )}
                    {contact.email && (
                      <span className="text-sm text-foreground">{contact.email}</span>
                    )}
                  </div>
                </div>
                <ContactRowActions contact={contact} />
              </div>

              <ContactDocumentsSection
                contactId={contact.id}
                documents={contact.documents}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
