'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createContact, updateContact } from '@/lib/actions/contacts'
import type { Contact, ContactCategory } from '@/lib/types'

const CATEGORIES: { value: ContactCategory; label: string }[] = [
  { value: 'windows', label: 'Langai' },
  { value: 'heating', label: 'Šildymas' },
  { value: 'water', label: 'Vanduo' },
  { value: 'electrical', label: 'Elektra' },
  { value: 'waste', label: 'Atliekų išvežimas' },
  { value: 'internet', label: 'Internetas' },
  { value: 'general', label: 'Bendrasis' },
  { value: 'construction', label: 'Statybos darbai' },
]

const schema = z.object({
  category: z.enum([
    'windows', 'heating', 'water', 'electrical',
    'waste', 'internet', 'general', 'construction',
  ] as const),
  title: z.string().min(1, 'Privalomas laukas'),
  company_name: z.string().nullable().default(null),
  phone: z.string().nullable().default(null),
  email: z.string().nullable().default(null).refine(
    (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    { message: 'Neteisingas el. paštas' }
  ),
  description: z.string().nullable().default(null),
  footnote: z.string().nullable().default(null),
})

type FormValues = z.input<typeof schema>

interface ContactFormDialogProps {
  contact?: Contact
  trigger: React.ReactNode
}

export function ContactFormDialog({ contact, trigger }: ContactFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: contact?.category ?? 'general',
      title: contact?.title ?? '',
      company_name: contact?.company_name ?? null,
      phone: contact?.phone ?? null,
      email: contact?.email ?? null,
      description: contact?.description ?? null,
      footnote: contact?.footnote ?? null,
    },
  })

  function onSubmit(values: FormValues) {
    const parsed = schema.parse(values)
    startTransition(async () => {
      try {
        if (contact) {
          await updateContact(contact.id, parsed)
          toast.success('Kontaktas atnaujintas')
        } else {
          await createContact(parsed)
          toast.success('Kontaktas sukurtas')
          form.reset()
        }
        setOpen(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Klaida')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{contact ? 'Redaguoti kontaktą' : 'Naujas kontaktas'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategorija</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pasirinkite kategoriją" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paslaugos pavadinimas</FormLabel>
                  <FormControl>
                    <Input placeholder="pvz. Langų reguliavimas ir eksploatacija" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Įmonė</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='pvz. UAB "Vinkelis ir Ko"'
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefonas</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+370 600 00000"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>El. paštas</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="info@imone.lt"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aprašymas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Trumpas paslaugos aprašymas savininkams"
                      rows={3}
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="footnote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pastaba (neprivaloma)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="pvz. *Suteikiama nemokama 5 metų garantija"
                      rows={2}
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Atšaukti
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saugoma…' : 'Išsaugoti'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
