'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { createUnit } from '@/lib/actions/units'

const schema = z.object({
  unit_number: z.string().min(1, 'Įveskite buto numerį'),
  floor: z.string().optional(),
  area_sqm: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function UnitFormDialog({ estateId }: { estateId: string }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      unit_number: '',
      floor: '',
      area_sqm: '',
    },
  })

  async function onSubmit(values: FormValues) {
    setError(null)
    try {
      await createUnit({
        estate_id: estateId,
        unit_number: values.unit_number,
        floor: values.floor ? parseInt(values.floor) : null,
        area_sqm: values.area_sqm ? parseFloat(values.area_sqm) : null,
      })
      form.reset()
      setOpen(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Klaida')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4 mr-1" />
          Pridėti butą
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Naujas butas</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unit_number"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Buto numeris</FormLabel>
                    <FormControl>
                      <Input placeholder="pvz. 12A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="floor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aukštas</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="pvz. 3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="area_sqm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plotas (m²)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="pvz. 68.50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Atšaukti
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Išsaugoma...' : 'Išsaugoti'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
