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
import { updateUnitTechnicalData } from '@/lib/actions/units'
import type { Unit, TechnicalData } from '@/lib/types'

interface FormValues {
  rooms_count: string
  total_area: string
  living_area: string
  construction_year: string
  parking: string
}

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
      construction_year: toStr(td?.construction_year),
      parking: unit.parking ?? '',
    },
  })

  async function onSubmit(values: FormValues) {
    try {
      const data: TechnicalData = {
        rooms_count: values.rooms_count !== '' ? parseInt(values.rooms_count, 10) : undefined,
        total_area: values.total_area !== '' ? parseFloat(values.total_area) : undefined,
        living_area: values.living_area !== '' ? parseFloat(values.living_area) : undefined,
        construction_year:
          values.construction_year !== '' ? parseInt(values.construction_year, 10) : undefined,
      }
      await updateUnitTechnicalData(unit.id, data, values.parking || null)
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
          name="parking"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parkingai</FormLabel>
              <FormControl>
                <Input
                  placeholder="pvz. P-12A"
                  pattern="^[A-Za-z0-9-]*$"
                  title="Leistini simboliai: raidės, skaičiai, brūkšnys"
                  {...field}
                />
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
