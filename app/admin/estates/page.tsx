import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { EstateWithUnitCount } from '@/lib/types'
import { EstateTable } from '@/components/admin/estate-table'
import { EstateFormDialog } from '@/components/admin/estate-form-dialog'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { Plus } from '@phosphor-icons/react/dist/ssr'

export default async function EstatesPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data, error } = await supabase
    .from('estates')
    .select('*, units(count)')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const rows = (data ?? []).map((row) => {
    const unitsArr = row.units as unknown as { count: number }[]
    const unit_count = Array.isArray(unitsArr) && unitsArr.length > 0
      ? unitsArr[0].count
      : 0
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { units: _units, ...rest } = row
    return { ...rest, unit_count }
  })

  // Batch-generate signed URLs for cover photos
  const paths = rows.map((r) => r.cover_photo_path).filter(Boolean) as string[]
  const signedMap: Record<string, string> = {}

  if (paths.length > 0) {
    const { data: signed } = await adminClient.storage
      .from('unit-files')
      .createSignedUrls(paths, 60 * 60)
    for (const s of signed ?? []) {
      if (s.signedUrl && s.path) signedMap[s.path] = s.signedUrl
    }
  }

  const estates: EstateWithUnitCount[] = rows.map((r) => ({
    ...r,
    cover_image_url: r.cover_photo_path ? (signedMap[r.cover_photo_path] ?? null) : null,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Nekilnojamasis turtas" description="Visi valdomi objektai" />
        <EstateFormDialog
          trigger={
            <Button>
              <Plus className="size-4" />
              Naujas objektas
            </Button>
          }
        />
      </div>
      <EstateTable estates={estates} />
    </div>
  )
}
