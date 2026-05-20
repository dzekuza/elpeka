'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createEstate, updateEstate } from '@/lib/actions/estates'
import { Estate } from '@/lib/types'
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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

const estateSchema = z.object({
  name: z.string().min(1, 'Pavadinimas privalomas'),
  address: z.string().min(1, 'Adresas privalomas'),
  description: z.string().optional(),
})

type EstateFormValues = z.infer<typeof estateSchema>

interface EstateFormDialogProps {
  trigger: React.ReactNode
  estate?: Estate
}

export function EstateFormDialog({ trigger, estate }: EstateFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<EstateFormValues>({
    resolver: zodResolver(estateSchema),
    defaultValues: {
      name: estate?.name ?? '',
      address: estate?.address ?? '',
      description: estate?.description ?? '',
    },
  })

  async function onSubmit(values: EstateFormValues) {
    setIsSubmitting(true)
    try {
      if (estate) {
        await updateEstate(estate.id, values)
        toast.success('Objektas atnaujintas')
      } else {
        await createEstate(values)
        toast.success('Objektas sukurtas')
      }
      setOpen(false)
      form.reset()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Klaida')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{estate ? 'Redaguoti objektą' : 'Naujas objektas'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pavadinimas</FormLabel>
                  <FormControl>
                    <Input placeholder="Objekto pavadinimas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresas</FormLabel>
                  <FormControl>
                    <Input placeholder="Gatvė, miestas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aprašymas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Neprivalomas aprašymas"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Atšaukti
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saugoma...' : 'Išsaugoti'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
