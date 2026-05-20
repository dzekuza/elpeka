'use client'

import { useState } from 'react'
import {
  AppWindow,
  ArrowUpRight,
  BuildingOffice,
  Buildings,
  CaretDown,
  DownloadSimple,
  Drop,
  EnvelopeOpen,
  File,
  Hammer,
  Lightning,
  Phone,
  Trash,
  WifiHigh,
} from '@phosphor-icons/react'
import type { ContactWithDocuments, ContactCategory } from '@/lib/types'

const CATEGORY_ICONS: Record<ContactCategory, React.ElementType> = {
  windows: AppWindow,
  heating: Drop,
  water: Drop,
  electrical: Lightning,
  waste: Trash,
  internet: WifiHigh,
  general: Buildings,
  construction: Hammer,
}

interface PortalContactCardProps {
  contact: ContactWithDocuments
  documentUrls: Record<string, string>
}

export function PortalContactCard({ contact, documentUrls }: PortalContactCardProps) {
  const [open, setOpen] = useState(false)
  const Icon = CATEGORY_ICONS[contact.category] ?? Buildings

  return (
    <div className="flex flex-col gap-4 sm:gap-8 overflow-hidden rounded-[24px] bg-white p-4 sm:p-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full cursor-pointer items-center gap-4 sm:gap-10 text-left${open ? ' border-b border-foreground/15 pb-4 sm:pb-6' : ''}`}
      >
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center gap-3">
            <Icon className="size-5 sm:size-6 shrink-0 text-foreground" />
            <span className="text-base sm:text-2xl font-medium sm:leading-8 sm:tracking-[-0.48px] text-foreground">
              {contact.title}
            </span>
          </div>
          {contact.description && (
            <p className="text-sm leading-5 text-foreground/75">{contact.description}</p>
          )}
        </div>
        <CaretDown
          className="size-6 shrink-0 text-foreground transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {open && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-x-16 gap-y-6">
            {contact.company_name && (
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center rounded-[8px] bg-foreground/6 p-2">
                  <BuildingOffice className="size-6 text-foreground" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs leading-4 text-foreground/75">Įmonė:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold leading-5 text-primary">
                      {contact.company_name}
                    </span>
                    <ArrowUpRight className="size-4 text-primary" />
                  </div>
                </div>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center rounded-[8px] bg-foreground/6 p-2">
                  <Phone className="size-6 text-foreground" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs leading-4 text-foreground/75">Telefonas:</span>
                  <span className="text-sm font-medium leading-5 text-foreground">
                    {contact.phone}
                  </span>
                </div>
              </div>
            )}
            {contact.email && (
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center rounded-[8px] bg-foreground/6 p-2">
                  <EnvelopeOpen className="size-6 text-foreground" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs leading-4 text-foreground/75">El. paštas:</span>
                  <span className="text-sm font-medium leading-5 text-foreground">
                    {contact.email}
                  </span>
                </div>
              </div>
            )}
          </div>

          {contact.documents.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium leading-5 text-foreground">Dokumentai:</span>
              <div className="flex flex-wrap gap-2">
                {contact.documents.map((doc) => {
                  const url = documentUrls[doc.id]
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-8 rounded-[8px] border border-foreground/15 py-2 pl-2 pr-3"
                    >
                      <div className="flex items-center gap-2">
                        <File className="size-5 text-foreground" />
                        <span className="text-sm leading-5 text-foreground">{doc.name}</span>
                      </div>
                      {url && (
                        <a
                          href={url}
                          download={doc.name}
                          className="text-foreground/75 hover:text-foreground"
                        >
                          <DownloadSimple className="size-5" />
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {contact.footnote && (
            <p className="text-xs font-semibold leading-4 text-foreground/75">
              {contact.footnote}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
