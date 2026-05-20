'use client'

import { useRef, useTransition } from 'react'
import { toast } from 'sonner'
import { File, Trash, UploadSimple } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { uploadContactDocument, deleteContactDocument } from '@/lib/actions/contacts'
import type { ContactDocument } from '@/lib/types'

interface ContactDocumentsSectionProps {
  contactId: string
  documents: ContactDocument[]
}

export function ContactDocumentsSection({
  contactId,
  documents,
}: ContactDocumentsSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.append('file', file)
        await uploadContactDocument(contactId, fd)
        toast.success('Dokumentas įkeltas')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Klaida įkeliant')
      } finally {
        if (inputRef.current) inputRef.current.value = ''
      }
    })
  }

  function handleDelete(doc: ContactDocument) {
    startTransition(async () => {
      try {
        await deleteContactDocument(doc.id, doc.storage_path)
        toast.success('Dokumentas ištrintas')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Klaida trinant')
      }
    })
  }

  return (
    <div className="flex flex-col gap-2">
      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">Dokumentų nėra</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5"
            >
              <File className="size-4 text-muted-foreground" />
              <span className="text-sm">{doc.name}</span>
              <button
                onClick={() => handleDelete(doc)}
                disabled={isPending}
                className="text-muted-foreground hover:text-destructive disabled:opacity-50"
              >
                <Trash className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleUpload}
          accept=".pdf,.doc,.docx,.xlsx,.png,.jpg"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
        >
          <UploadSimple className="size-4 mr-2" />
          {isPending ? 'Įkeliama…' : 'Pridėti dokumentą'}
        </Button>
      </div>
    </div>
  )
}
