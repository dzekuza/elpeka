import { createClient } from '@/lib/supabase/server'
import { EstateWithUnitCount } from '@/lib/types'
import { EstateTable } from '@/components/admin/estate-table'
import { EstateFormDialog } from '@/components/admin/estate-form-dialog'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { Plus } from '@phosphor-icons/react/dist/ssr'

export default async function EstatesPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('estates')
    .select('*, units(count)')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const estates: EstateWithUnitCount[] = (data ?? []).map((row) => {
    const unitsArr = row.units as unknown as { count: number }[]
    const unit_count = Array.isArray(unitsArr) && unitsArr.length > 0
      ? unitsArr[0].count
      : 0
    const { units: _units, ...rest } = row
    return { ...rest, unit_count }
  })

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
