'use client'

import { useRef, useState, useTransition } from 'react'
import { CaretDown, Eye, Plus, Trash, UploadSimple } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { uploadOwnerDocument, deleteOwnerDocument } from '@/lib/actions/units'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

export type PurchaseStep = {
  number: number
  key: string
  title: string
  description: string
  canOwnerUpload: boolean
  category: string
  documents: { id: string; name: string; storage_path: string }[]
}

type Props = {
  steps: PurchaseStep[]
  unitId: string
}


function StepPanel({ id, children }: { id: string; children: React.ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(panelRef.current!, {
          y: -6,
          autoAlpha: 0,
          duration: 0.25,
          ease: 'power2.out',
          clearProps: 'all',
        })
      })
      return () => mm.revert()
    },
    { scope: panelRef }
  )

  return (
    <div ref={panelRef} id={id} className="pt-6 space-y-4">
      {children}
    </div>
  )
}

export function StepsAccordion({ steps, unitId }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()
  const [uploadingStep, setUploadingStep] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingStepRef = useRef<PurchaseStep | null>(null)
  const stepsListRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const els = Array.from(stepsListRef.current?.children ?? [])
      if (els.length === 0) return
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(els, {
          y: 10,
          autoAlpha: 0,
          duration: 0.4,
          stagger: 0.05,
          ease: 'power2.out',
          clearProps: 'all',
        })
      })
      return () => mm.revert()
    },
    { scope: stepsListRef }
  )

  const completedCount = steps.filter((s) => s.documents.length > 0).length
  const percentage = Math.round((completedCount / steps.length) * 100)

  const firstPendingStep = steps.find((s) => s.documents.length === 0)
  const lastPendingStep = [...steps].reverse().find((s) => s.documents.length === 0)
  const pendingRange =
    firstPendingStep && lastPendingStep
      ? firstPendingStep.number === lastPendingStep.number
        ? `${firstPendingStep.number}`
        : `${firstPendingStep.number}–${lastPendingStep.number}`
      : null

  function triggerUpload(step: PurchaseStep) {
    pendingStepRef.current = step
    if (fileInputRef.current) fileInputRef.current.value = ''
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const step = pendingStepRef.current
    if (!files.length || !step) return

    setUploadingStep(step.number)
    startTransition(async () => {
      try {
        for (const file of files) {
          const fd = new FormData()
          fd.append('file', file)
          await uploadOwnerDocument(unitId, step.category, fd)
        }
        toast.success(files.length === 1 ? 'Dokumentas įkeltas' : `${files.length} dokumentai įkelti`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Klaida įkeliant dokumentą')
      } finally {
        setUploadingStep(null)
        pendingStepRef.current = null
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    })
  }

  function handleDelete(doc: { id: string; name: string; storage_path: string }) {
    setDeletingId(doc.id)
    startTransition(async () => {
      try {
        await deleteOwnerDocument(doc.id, unitId)
        toast.success('Dokumentas ištrintas')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Klaida trinant dokumentą')
      } finally {
        setDeletingId(null)
      }
    })
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Progress card */}
      <div className="bg-card rounded-3xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Žingsniai</h2>
          <Badge className="bg-notification/10 text-notification border-notification/20 px-3 py-1.5 text-xs font-medium">
            Vykdoma
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Žalia spalva pažymėti žingsniai reikš, kad visi būtini dokumentai yra sėkmingai įkelti ir pasiekiami peržiūrai.
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">
              {pendingRange ? (
                <>
                  Atlikite žingsnius{' '}
                  <span className="font-semibold">{pendingRange}</span>
                </>
              ) : (
                'Visi žingsniai atlikti'
              )}
            </span>
            <span className="text-foreground">{percentage} % baigta</span>
          </div>
          <div className="h-3 rounded-full bg-border overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-[width] duration-300 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step list */}
      <div ref={stepsListRef} className="space-y-3">
        {steps.map((step) => {
          const isComplete = step.documents.length > 0
          const isOpen = expanded === step.number
          const isUploading = uploadingStep === step.number

          return (
            <div key={step.number} className="bg-card rounded-3xl overflow-hidden">
              <div className="p-4 sm:p-6">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`step-panel-${step.number}`}
                  className={cn(
                    'w-full flex items-center justify-between gap-4 text-left',
                    isOpen && 'border-b border-border pb-6'
                  )}
                  onClick={() => setExpanded(isOpen ? null : step.number)}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'size-9 sm:size-12 rounded-lg flex items-center justify-center shrink-0',
                        isComplete ? 'bg-step-completed/20' : 'bg-muted'
                      )}
                    >
                      <span
                        className={cn(
                          'text-base sm:text-2xl font-semibold leading-none',
                          isComplete ? 'text-step-completed' : 'text-foreground'
                        )}
                      >
                        {step.number}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-base sm:text-2xl font-semibold tracking-tight">{step.title}</span>
                      {isComplete && (
                        <span className="text-xs text-muted-foreground">
                          {step.documents.length} {step.documents.length === 1 ? 'dokumentas' : 'dokumentai'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {!isComplete && (
                      <Badge className="bg-muted text-foreground border-border text-xs font-medium px-3 py-1.5">
                        Laukiama
                      </Badge>
                    )}
                    <CaretDown
                      className={cn('size-6 transition-transform duration-200 ease-out shrink-0', isOpen && 'rotate-180')}
                    />
                  </div>
                </button>

                {isOpen && (
                  <StepPanel id={`step-panel-${step.number}`}>
                    <p className="text-base text-foreground">{step.description}</p>

                    {/* Document list */}
                    {step.documents.length > 0 && (
                      <div className="space-y-2">
                        {step.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 px-4 py-2.5"
                          >
                            <span className="text-sm truncate text-foreground">{doc.name}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                asChild
                              >
                                <a href={`/api/documents/${doc.id}/download`} target="_blank" rel="noreferrer">
                                  <Eye className="size-4" />
                                </a>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-destructive hover:text-destructive"
                                disabled={isPending && deletingId === doc.id}
                                onClick={() => handleDelete(doc)}
                              >
                                <Trash className="size-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload button */}
                    {step.canOwnerUpload && (
                      <Button
                        variant={isComplete ? 'outline' : 'default'}
                        className={cn(!isComplete && 'bg-primary text-primary-foreground hover:bg-primary/90')}
                        disabled={isPending && isUploading}
                        onClick={() => triggerUpload(step)}
                      >
                        {isComplete ? (
                          <>
                            <Plus className="size-4 mr-2" />
                            {isUploading ? 'Įkeliama…' : 'Pridėti dokumentą'}
                          </>
                        ) : (
                          <>
                            <UploadSimple className="size-4 mr-2" />
                            {isUploading ? 'Įkeliama…' : 'Pasirinkti failus'}
                          </>
                        )}
                      </Button>
                    )}

                    {!step.canOwnerUpload && step.documents.length === 0 && (
                      <span className="text-sm text-muted-foreground">
                        Laukiama administratoriaus
                      </span>
                    )}
                  </StepPanel>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
