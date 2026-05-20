'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { inviteOwner, type OwnerEntry } from '@/lib/actions/invitations'

interface InviteOwnerDialogProps {
  unitId: string
  unitNumber: string
  estateId: string
}

const emptyEntry = (): OwnerEntry => ({ email: '', firstName: '', lastName: '', phone: '' })

export function InviteOwnerDialog({ unitId, unitNumber }: InviteOwnerDialogProps) {
  const [open, setOpen] = useState(false)
  const [owners, setOwners] = useState<OwnerEntry[]>([emptyEntry()])
  const [loading, setLoading] = useState(false)

  function update(index: number, field: keyof OwnerEntry, value: string) {
    setOwners((prev) => prev.map((o, i) => (i === index ? { ...o, [field]: value } : o)))
  }

  function addOwner() {
    setOwners((prev) => [...prev, emptyEntry()])
  }

  function removeOwner(index: number) {
    setOwners((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const valid = owners.filter((o) => o.email.trim())
    if (!valid.length) return

    setLoading(true)
    const result = await inviteOwner(unitId, valid)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(
      result.invited === 1
        ? 'Kvietimas išsiųstas'
        : `${result.invited} kvietimai išsiųsti`
    )
    setOwners([emptyEntry()])
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Pakviesti</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pakviesti savininkus — Butas {unitNumber}</DialogTitle>
          <DialogDescription>
            Savininkai gaus el. laišką su nuoroda prisijungti prie portalo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {owners.map((owner, i) => (
              <div key={i} className="rounded-lg border border-border p-4 space-y-3 relative">
                {owners.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeOwner(i)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-destructive"
                    aria-label="Pašalinti"
                  >
                    <Trash className="size-4" />
                  </button>
                )}

                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Savininkas {owners.length > 1 ? i + 1 : ''}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`firstName-${i}`}>Vardas</Label>
                    <Input
                      id={`firstName-${i}`}
                      placeholder="Jonas"
                      value={owner.firstName}
                      onChange={(e) => update(i, 'firstName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`lastName-${i}`}>Pavardė</Label>
                    <Input
                      id={`lastName-${i}`}
                      placeholder="Jonaitis"
                      value={owner.lastName}
                      onChange={(e) => update(i, 'lastName', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`email-${i}`}>El. paštas <span className="text-destructive">*</span></Label>
                  <Input
                    id={`email-${i}`}
                    type="email"
                    placeholder="savininkas@example.com"
                    value={owner.email}
                    onChange={(e) => update(i, 'email', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`phone-${i}`}>Telefono numeris</Label>
                  <Input
                    id={`phone-${i}`}
                    type="tel"
                    placeholder="+370 600 00000"
                    value={owner.phone}
                    onChange={(e) => update(i, 'phone', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={addOwner}
          >
            <Plus className="size-4 mr-2" />
            Pridėti kitą savininką
          </Button>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Atšaukti
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Siunčiama...' : 'Siųsti kvietimus'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
