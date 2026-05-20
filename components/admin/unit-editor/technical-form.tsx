'use client'

import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateUnitTechnicalData } from '@/lib/actions/units'
import type { Unit, TechnicalData } from '@/lib/types'

interface FormValues {
  rooms_count: string
  total_area: string
  living_area: string
  heating_type: string
  building_materials: string
  construction_year: string
  floor_covering: string
}

const HEATING_OPTIONS = [
  { value: 'Centrinis', label: 'Centrinis' },
  { value: 'Autonominis', label: 'Autonominis' },
  { value: 'Elektra', label: 'Elektra' },
]

interface TechnicalFormProps {
  unit: Unit
}

function toStr(v: number | undefined): string {
  return v != null ? String(v) : ''
}

export function TechnicalForm({ unit }: TechnicalFormProps) {
  const td = unit.technical_data

  const form = useForm<FormValues>({
    defaultValues: {
      rooms_count: toStr(td?.rooms_count),
      total_area: toStr(td?.total_area),
      living_area: toStr(td?.living_area),
      heating_type: td?.heating_type ?? '',
      building_materials: td?.building_materials ?? '',
      construction_year: toStr(td?.construction_year),
      floor_covering: td?.floor_covering ?? '',
    },
  })

  async function onSubmit(values: FormValues) {
    try {
      const data: TechnicalData = {
        rooms_count: values.rooms_count !== '' ? parseInt(values.rooms_count, 10) : undefined,
        total_area: values.total_area !== '' ? parseFloat(values.total_area) : undefined,
        living_area: values.living_area !== '' ? parseFloat(values.living_area) : undefined,
        heating_type: values.heating_type || undefined,
        building_materials: values.building_materials || undefined,
        construction_year:
          values.construction_year !== '' ? parseInt(values.construction_year, 10) : undefined,
        floor_covering: values.floor_covering || undefined,
      }
      await updateUnitTechnicalData(unit.id, data)
      toast.success('Techniniai duomenys išsaugoti')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Klaida išsaugant')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="rooms_count"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kambarių skaičius</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="construction_year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Statybos metai</FormLabel>
                <FormControl>
                  <Input type="number" min={1800} max={2100} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="total_area"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bendras plotas (m²)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="living_area"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gyvenamasis plotas (m²)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="heating_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Šildymo tipas</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pasirinkite šildymo tipą" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {HEATING_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="building_materials"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Statybinės medžiagos</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="floor_covering"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Grindų danga</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saugoma…' : 'Išsaugoti'}
        </Button>
      </form>
    </Form>
  )
}
