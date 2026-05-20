import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TechnicalForm } from '@/components/admin/unit-editor/technical-form'
import { FinancialForm } from '@/components/admin/unit-editor/financial-form'
import { DocumentsTab } from '@/components/admin/unit-editor/documents-tab'
import { PhotosTab } from '@/components/admin/unit-editor/photos-tab'
import { ServicesTab } from '@/components/admin/unit-editor/services-tab'
import { InviteOwnerDialog } from '@/components/admin/invite-owner-dialog'
import type { Unit, Document, UnitService } from '@/lib/types'

interface Photo {
  id: string
  storage_path: string
  url: string
  name: string
}

export default async function UnitDetailPage({
  params,
}: {
  params: Promise<{ id: string; unitId: string }>
}) {
  const { id: estateId, unitId } = await params
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: unit, error: unitError } = await supabase
    .from('units')
    .select('*')
    .eq('id', unitId)
    .eq('estate_id', estateId)
    .single()

  if (unitError || !unit) {
    notFound()
  }

  const { data: estate } = await supabase
    .from('estates')
    .select('name')
    .eq('id', estateId)
    .single()

  const { data: allDocs } = await supabase
    .from('documents')
    .select('*')
    .eq('unit_id', unitId)
    .order('created_at', { ascending: false })

  const docRows = allDocs ?? []
  const documents: Document[] = docRows.filter((d) => d.category !== 'photo')
  const photoRows = docRows.filter((d) => d.category === 'photo')

  const photos: Photo[] = await Promise.all(
    photoRows.map(async (row) => {
      const { data } = await adminClient.storage
        .from('unit-files')
        .createSignedUrl(row.storage_path, 60 * 60)
      return {
        id: row.id,
        storage_path: row.storage_path,
        url: data?.signedUrl ?? '',
        name: row.name,
      }
    })
  )

  const { data: ownerRow } = await supabase
    .from('unit_owners')
    .select('user_id, accepted_at')
    .eq('unit_id', unitId)
    .order('invited_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: servicesData } = await supabase
    .from('unit_services')
    .select('*')
    .eq('unit_id', unitId)
    .order('created_at', { ascending: true })

  const services = (servicesData ?? []) as UnitService[]

  let ownerEmail: string | null = null
  if (ownerRow) {
    const { data: ownerUser } = await adminClient.auth.admin.getUserById(ownerRow.user_id)
    ownerEmail = ownerUser?.user?.email ?? null
  }

  const typedUnit: Unit = {
    id: unit.id,
    estate_id: unit.estate_id,
    unit_number: unit.unit_number,
    floor: unit.floor,
    area_sqm: unit.area_sqm,
    technical_data: unit.technical_data,
    financial_data: unit.financial_data,
    created_at: unit.created_at,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <PageHeader title={`Butas ${unit.unit_number}`} description={estate?.name} />

        <div className="flex items-center gap-3">
          {ownerRow ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{ownerEmail}</span>
              <Badge variant={ownerRow.accepted_at ? 'default' : 'secondary'}>
                {ownerRow.accepted_at ? 'Aktyvus' : 'Pakviestas'}
              </Badge>
            </div>
          ) : null}
          {!ownerRow?.accepted_at && (
            <InviteOwnerDialog
              unitId={unitId}
              unitNumber={unit.unit_number}
              estateId={estateId}
            />
          )}
        </div>
      </div>

      <Tabs defaultValue="technical">
        <TabsList className="mb-6">
          <TabsTrigger value="technical">Techniniai duomenys</TabsTrigger>
          <TabsTrigger value="financial">Finansiniai duomenys</TabsTrigger>
          <TabsTrigger value="documents">Dokumentai</TabsTrigger>
          <TabsTrigger value="photos">Nuotraukos</TabsTrigger>
          <TabsTrigger value="services">Paslaugos</TabsTrigger>
        </TabsList>

        <TabsContent value="technical">
          <TechnicalForm unit={typedUnit} />
        </TabsContent>

        <TabsContent value="financial">
          <FinancialForm unit={typedUnit} />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTab unitId={unitId} documents={documents} />
        </TabsContent>

        <TabsContent value="photos">
          <PhotosTab unitId={unitId} photos={photos} />
        </TabsContent>

        <TabsContent value="services">
          <ServicesTab unitId={unitId} services={services} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
