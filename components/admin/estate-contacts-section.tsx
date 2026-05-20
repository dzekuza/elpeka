'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { assignContactToEstate, removeContactFromEstate } from '@/lib/actions/contacts'
import type { Contact } from '@/lib/types'

const CATEGORY_LABELS: Record<string, string> = {
  windows: 'Langai',
  heating: 'Šildymas',
  water: 'Vanduo',
  electrical: 'Elektra',
  waste: 'Atliekų išvežimas',
  internet: 'Internetas',
  general: 'Bendrasis',
  construction: 'Statybos darbai',
}

interface EstateContactsSectionProps {
  estateId: string
  assignedContacts: Contact[]
  allContacts: Contact[]
}

export function EstateContactsSection({
  estateId,
  assignedContacts,
  allContacts,
}: EstateContactsSectionProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const assignedIds = new Set(assignedContacts.map((c) => c.id))
  const unassigned = allContacts.filter((c) => !assignedIds.has(c.id))

  function handleAssign(contactId: string) {
    startTransition(async () => {
      try {
        await assignContactToEstate(estateId, contactId)
        toast.success('Kontaktas priskirtas')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Klaida')
      }
    })
  }

  function handleRemove(contactId: string) {
    startTransition(async () => {
      try {
        await removeContactFromEstate(estateId, contactId)
        toast.success('Kontaktas pašalintas')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Klaida')
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {assignedContacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Kontaktų nėra. Pridėkite iš bibliotekos.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {assignedContacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center justify-between gap-4 rounded-[12px] border border-border bg-white px-4 py-3"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">
                  {CATEGORY_LABELS[contact.category] ?? contact.category}
                </span>
                <span className="text-sm font-medium text-foreground">{contact.title}</span>
                {contact.company_name && (
                  <span className="text-xs text-muted-foreground">{contact.company_name}</span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                disabled={isPending}
                onClick={() => handleRemove(contact.id)}
                className="text-muted-foreground hover:text-destructive shrink-0"
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="self-start">
            <Plus className="size-4 mr-2" />
            Pridėti kontaktą
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pridėti kontaktą iš bibliotekos</DialogTitle>
          </DialogHeader>
          {unassigned.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Visi bibliotekos kontaktai jau priskirti.
            </p>
          ) : (
            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
              {unassigned.map((contact) => (
                <button
                  key={contact.id}
                  disabled={isPending}
                  onClick={() => {
                    handleAssign(contact.id)
                    setOpen(false)
                  }}
                  className="flex flex-col gap-0.5 rounded-[12px] border border-border px-4 py-3 text-left hover:bg-muted/50 transition-colors disabled:opacity-50"
                >
                  <span className="text-xs text-muted-foreground">
                    {CATEGORY_LABELS[contact.category] ?? contact.category}
                  </span>
                  <span className="text-sm font-medium text-foreground">{contact.title}</span>
                  {contact.company_name && (
                    <span className="text-xs text-muted-foreground">{contact.company_name}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
