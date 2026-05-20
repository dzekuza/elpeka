'use client'

import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { UploadSimple, Trash, DownloadSimple } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { uploadUnitDocument, deleteDocument } from '@/lib/actions/units'
import type { Document } from '@/lib/types'

const CATEGORY_OPTIONS = [
  { value: 'preliminari_sutartis',  label: 'Preliminari sutartis' },
  { value: 'mokejimai',             label: 'Mokėjimai' },
  { value: 'banko_sutartis',        label: 'Banko sutartis ir turto vertinimas' },
  { value: 'kadastro_byla',         label: 'Kadastrinių matavimų byla' },
  { value: 'notarine_sutartis',     label: 'Notarinė pirkimo-pardavimo sutartis' },
  { value: 'registru_israsas',      label: 'Registrų centro išrašas' },
  { value: 'pakvitavimas',          label: 'Pakvitavimas' },
  { value: 'papildomi_dokumentai',  label: 'Papildomi dokumentai' },
  { value: 'kita',                  label: 'Kita' },
]

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORY_OPTIONS.map((o) => [o.value, o.label])
)

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('lt-LT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

interface DocumentsTabProps {
  unitId: string
  documents: Document[]
}

export function DocumentsTab({ unitId, documents }: DocumentsTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('preliminari_sutartis')
  const [isPending, startTransition] = useTransition()

  function handleUploadClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('category', selectedCategory)
        fd.append('name', file.name)
        await uploadUnitDocument(unitId, fd)
        toast.success('Dokumentas įkeltas')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Klaida įkeliant dokumentą')
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    })
  }

  function handleDelete(doc: Document) {
    startTransition(async () => {
      try {
        await deleteDocument(doc.id, doc.storage_path)
        toast.success('Dokumentas ištrintas')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Klaida trinant dokumentą')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-4">
        <div className="space-y-1.5">
          <Label>Kategorija</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Pasirinkite kategoriją" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleUploadClick} disabled={isPending}>
          <UploadSimple className="size-4 mr-2" />
          {isPending ? 'Įkeliama…' : 'Įkelti dokumentą'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pavadinimas</TableHead>
            <TableHead>Kategorija</TableHead>
            <TableHead>Įkėlimo data</TableHead>
            <TableHead className="text-right">Veiksmai</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                Nėra dokumentų
              </TableCell>
            </TableRow>
          ) : (
            documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.name}</TableCell>
                <TableCell>{CATEGORY_LABEL[doc.category] ?? doc.category}</TableCell>
                <TableCell>{formatDate(doc.created_at)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button asChild variant="ghost" size="icon">
                      <a
                        href={`/api/documents/${doc.id}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Atsisiųsti"
                      >
                        <DownloadSimple className="size-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(doc)}
                      disabled={isPending}
                      aria-label="Ištrinti"
                    >
                      <Trash className="size-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
