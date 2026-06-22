'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

import { Button } from '@/components/ui/button'
import { updateOwnerVisibleSteps, updateOwnerNotifications } from '@/lib/actions/units'

const ALL_STEPS = [
  { key: 'preliminari-sutartis', label: 'Preliminari sutartis' },
  { key: 'mokėjimai', label: 'Mokėjimai' },
  { key: 'banko-sutartis', label: 'Banko sutartis ir turto vertinimas' },
  { key: 'kadastras', label: 'Kadastrinių matavimų byla' },
  { key: 'notarinė-sutartis', label: 'Notarinė pirkimo–pardavimo sutartis' },
  { key: 'registrų-centras', label: 'Registrų centro išrašas' },
  { key: 'pakvitavimas', label: 'Pakvitavimas' },
  { key: 'papildomi', label: 'Papildomi dokumentai' },
]

const DEFAULT_VISIBLE = ALL_STEPS.map((s) => s.key)

interface OwnerStepsEditorProps {
  unitOwnerId: string
  initialVisibleSteps: string[] | null
  initialNotificationsEnabled: boolean
}

export function OwnerStepsEditor({
  unitOwnerId,
  initialVisibleSteps,
  initialNotificationsEnabled,
}: OwnerStepsEditorProps) {
  const [selected, setSelected] = useState<string[]>(
    initialVisibleSteps ?? DEFAULT_VISIBLE
  )
  const [notifEnabled, setNotifEnabled] = useState(initialNotificationsEnabled)
  const [isPending, startTransition] = useTransition()

  function toggleStep(key: string) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  function handleSaveSteps() {
    startTransition(async () => {
      try {
        await updateOwnerVisibleSteps(unitOwnerId, selected)
        toast.success('Žingsniai išsaugoti')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Klaida')
      }
    })
  }

  function handleToggleNotifications(enabled: boolean) {
    setNotifEnabled(enabled)
    startTransition(async () => {
      try {
        await updateOwnerNotifications(unitOwnerId, enabled)
        toast.success(enabled ? 'Pranešimai įjungti' : 'Pranešimai išjungti')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Klaida')
        setNotifEnabled(!enabled)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm font-medium">Matomi žingsniai savininko portale</p>
        {ALL_STEPS.map((step) => (
          <div key={step.key} className="flex items-center gap-3">
            <Checkbox
              id={`step-${step.key}`}
              checked={selected.includes(step.key)}
              onCheckedChange={() => toggleStep(step.key)}
            />
            <Label htmlFor={`step-${step.key}`} className="cursor-pointer">
              {step.label}
            </Label>
          </div>
        ))}
        <Button onClick={handleSaveSteps} disabled={isPending} size="sm" className="mt-2">
          {isPending ? 'Saugoma…' : 'Išsaugoti žingsnius'}
        </Button>
      </div>

      <div className="flex items-center gap-3 rounded-lg border p-4">
        <Checkbox
          id="notifications"
          checked={notifEnabled}
          onCheckedChange={(checked) => handleToggleNotifications(!!checked)}
          disabled={isPending}
        />
        <div className="flex-1">
          <Label htmlFor="notifications" className="cursor-pointer text-sm font-medium">
            Pranešimai el. paštu
          </Label>
          <p className="text-xs text-muted-foreground">
            Savininkas gauna priminimus apie neužbaigtas paslaugas
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open('/api/cron/service-reminders/preview', '_blank')}
          type="button"
        >
          Peržiūrėti laišką
        </Button>
      </div>
    </div>
  )
}
