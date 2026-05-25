'use client'

import { useState } from 'react'
import { Plus } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DefectForm } from '@/components/portal/defect-form'

interface DefectSubmitModalProps {
  unitId: string
}

export function DefectSubmitModal({ unitId }: DefectSubmitModalProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" weight="bold" />
          Pranešti defektą
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Naujas defektas</DialogTitle>
        </DialogHeader>
        <DefectForm unitId={unitId} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
