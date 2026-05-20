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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateUnitFinancialData } from '@/lib/actions/units'
import type { Unit, FinancialData } from '@/lib/types'

interface FormValues {
  sale_price: string
  payment_type: string
  payment_schedule_notes: string
  notary_info: string
}

const PAYMENT_OPTIONS = [
  { value: 'Vienkartinis', label: 'Vienkartinis' },
  { value: 'Išsimokėtinai', label: 'Išsimokėtinai' },
]

interface FinancialFormProps {
  unit: Unit
}

export function FinancialForm({ unit }: FinancialFormProps) {
  const fd = unit.financial_data

  const form = useForm<FormValues>({
    defaultValues: {
      sale_price: fd?.sale_price != null ? String(fd.sale_price) : '',
      payment_type: fd?.payment_type ?? '',
      payment_schedule_notes: fd?.payment_schedule_notes ?? '',
      notary_info: fd?.notary_info ?? '',
    },
  })

  async function onSubmit(values: FormValues) {
    try {
      const data: FinancialData = {
        sale_price: values.sale_price !== '' ? Number(values.sale_price) : undefined,
        payment_type: values.payment_type || undefined,
        payment_schedule_notes: values.payment_schedule_notes || undefined,
        notary_info: values.notary_info || undefined,
      }
      await updateUnitFinancialData(unit.id, data)
      toast.success('Finansiniai duomenys išsaugoti')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Klaida išsaugant')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="sale_price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pardavimo kaina (€)</FormLabel>
              <FormControl>
                <Input type="number" min={0} step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="payment_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mokėjimo tipas</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pasirinkite mokėjimo tipą" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PAYMENT_OPTIONS.map((opt) => (
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
          name="payment_schedule_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mokėjimo grafiko pastabos</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notary_info"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notaro informacija</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
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
