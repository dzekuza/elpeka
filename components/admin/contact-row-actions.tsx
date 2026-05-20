'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { PencilSimpleLine, Trash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { ContactFormDialog } from '@/components/admin/contact-form-dialog'
import { deleteContact } from '@/lib/actions/contacts'
import type { Contact } from '@/lib/types'

interface ContactRowActionsProps {
  contact: Contact
}

export function ContactRowActions({ contact }: ContactRowActionsProps) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm(`Ištrinti "${contact.title}"?`)) return
    startTransition(async () => {
      try {
        await deleteContact(contact.id)
        toast.success('Kontaktas ištrintas')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Klaida')
      }
    })
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <ContactFormDialog
        contact={contact}
        trigger={
          <Button variant="ghost" size="icon">
            <PencilSimpleLine className="size-4" />
          </Button>
        }
      />
      <Button
        variant="ghost"
        size="icon"
        disabled={isPending}
        onClick={handleDelete}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash className="size-4" />
      </Button>
    </div>
  )
}
