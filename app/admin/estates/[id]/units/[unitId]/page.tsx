import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CaretLeft } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TechnicalForm } from '@/components/admin/unit-editor/technical-form'
import { FinancialForm } from '@/components/admin/unit-editor/financial-form'
import { DocumentsTab } from '@/components/admin/unit-editor/documents-tab'
import { PhotosTab } from '@/components/admin/unit-editor/photos-tab'
import type { Unit, Document } from '@/lib/types'

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
      const { data } = adminClient.storage
        .from('unit-files')
        .getPublicUrl(row.storage_path)
      return {
        id: row.id,
        storage_path: row.storage_path,
        url: data.publicUrl,
        name: row.name,
      }
    })
  )

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
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/admin/estates/${estateId}`}>
            <CaretLeft className="size-4" />
            <span className="sr-only">Grįžti</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">
            Butas {unit.unit_number}
          </h1>
          {estate && (
            <p className="text-sm text-muted-foreground">{estate.name}</p>
          )}
        </div>
      </div>

      <Tabs defaultValue="technical">
        <TabsList className="mb-6">
          <TabsTrigger value="technical">Techniniai duomenys</TabsTrigger>
          <TabsTrigger value="financial">Finansiniai duomenys</TabsTrigger>
          <TabsTrigger value="documents">Dokumentai</TabsTrigger>
          <TabsTrigger value="photos">Nuotraukos</TabsTrigger>
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
      </Tabs>
    </div>
  )
}
