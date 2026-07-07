'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Lightning, Drop, ThermometerSimple, Trash } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { upsertUnitService, setServiceCompletion } from '@/lib/actions/services'
import type { UnitService, ServiceCategory } from '@/lib/types'

const SERVICE_DEFS: { category: ServiceCategory; label: string; Icon: React.ElementType }[] = [
  { category: 'electrical', label: 'Elektra', Icon: Lightning },
  { category: 'water', label: 'Vanduo', Icon: Drop },
  { category: 'heating', label: 'Šildymas', Icon: ThermometerSimple },
  { category: 'waste', label: 'Atliekų išvežimas', Icon: Trash },
]

interface ServicesTabProps {
  unitId: string
  services: UnitService[]
}

type ServiceFields = { meter_number: string; description: string }
type ServiceValues = Record<ServiceCategory, ServiceFields>

export function ServicesTab({ unitId, services }: ServicesTabProps) {
  const serviceMap = Object.fromEntries(services.map((s) => [s.category, s]))

  const [values, setValues] = useState<ServiceValues>({
    electrical: { meter_number: serviceMap.electrical?.meter_number ?? '', description: serviceMap.electrical?.description ?? '' },
    water: { meter_number: serviceMap.water?.meter_number ?? '', description: serviceMap.water?.description ?? '' },
    heating: { meter_number: serviceMap.heating?.meter_number ?? '', description: serviceMap.heating?.description ?? '' },
    waste: { meter_number: serviceMap.waste?.meter_number ?? '', description: serviceMap.waste?.description ?? '' },
  })

  const [isPending, startTransition] = useTransition()

  function handleSave(category: ServiceCategory) {
    const v = values[category]
    startTransition(async () => {
      try {
        await upsertUnitService(unitId, category, {
          meter_number: v.meter_number || null,
          description: v.description || null,
        })
        toast.success('Išsaugota')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Klaida')
      }
    })
  }

  function setField(category: ServiceCategory, field: keyof ServiceFields, value: string) {
    setValues((prev) => ({ ...prev, [category]: { ...prev[category], [field]: value } }))
  }

  function handleToggleCompletion(category: ServiceCategory, completed: boolean) {
    startTransition(async () => {
      try {
        await setServiceCompletion(unitId, category, completed)
        toast.success(completed ? 'Pažymėta kaip įvykdyta' : 'Pažymėta kaip laukiama')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Klaida')
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {SERVICE_DEFS.map(({ category, label, Icon }) => {
        const existing = serviceMap[category]
        const v = values[category]
        return (
          <div key={category} className="rounded-[16px] bg-white p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Icon className="size-5 text-foreground" />
              <span className="text-base font-medium text-foreground">{label}</span>
              <Select
                disabled={isPending}
                value={existing?.completed_at ? 'done' : 'pending'}
                onValueChange={(v) => handleToggleCompletion(category, v === 'done')}
              >
                <SelectTrigger
                  className={
                    existing?.completed_at
                      ? 'ml-auto w-auto gap-1.5 rounded-full border-transparent bg-[color-mix(in_srgb,var(--status-atlikta)_8%,transparent)] px-3 py-1 text-xs font-medium text-[color:var(--status-atlikta)] hover:bg-[color-mix(in_srgb,var(--status-atlikta)_12%,transparent)]'
                      : 'ml-auto w-auto gap-1.5 rounded-full border-transparent bg-[color-mix(in_srgb,var(--status-pateikta)_8%,transparent)] px-3 py-1 text-xs font-medium text-[color:var(--status-pateikta)] hover:bg-[color-mix(in_srgb,var(--status-pateikta)_12%,transparent)]'
                  }
                >
                  <span
                    className={
                      existing?.completed_at
                        ? 'size-1.5 rounded-full bg-[color:var(--status-atlikta)]'
                        : 'size-1.5 rounded-full bg-[color:var(--status-pateikta)]'
                    }
                  />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="pending">Laukiama</SelectItem>
                  <SelectItem value="done">Įvykdyta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-muted-foreground">Skaitiklio numeris</label>
                <Input
                  value={v.meter_number}
                  onChange={(e) => setField(category, 'meter_number', e.target.value)}
                  placeholder="pvz. 1234567890"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-muted-foreground">Aprašymas savininkui</label>
                <Textarea
                  rows={2}
                  value={v.description}
                  onChange={(e) => setField(category, 'description', e.target.value)}
                  placeholder="pvz. Prašome sudaryti sutartį su pasirinktu tiekėju..."
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" disabled={isPending} onClick={() => handleSave(category)}>
                Išsaugoti
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
