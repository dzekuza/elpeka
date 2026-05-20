'use client'

import { useState } from 'react'
import { toast } from 'sonner'
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
import { inviteOwner } from '@/lib/actions/invitations'

interface InviteOwnerDialogProps {
  unitId: string
  unitNumber: string
  estateId: string
}

export function InviteOwnerDialog({
  unitId,
  unitNumber,
}: InviteOwnerDialogProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const result = await inviteOwner(unitId, email)

    if (result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }

    toast.success(`Kvietimas išsiųstas į ${email}`)
    setEmail('')
    setOpen(false)
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Pakviesti
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Pakviesti savininką</DialogTitle>
          <DialogDescription>
            Savininkas gaus el. laišką su nuoroda nustatyti slaptažodį.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">El. pašto adresas</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="savininkas@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Butas</Label>
            <Input value={unitNumber} readOnly className="bg-muted" />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Atšaukti
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Siunčiama...' : 'Siųsti kvietimą'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
