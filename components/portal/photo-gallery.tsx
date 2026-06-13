'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { X, ArrowLeft, ArrowRight, Images } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Photo {
  id: string
  name: string
  signedUrl: string
}

interface PhotoGalleryProps {
  photos: Photo[]
  /** e.g. "Atnaujinta 2026 m. birželio 11 d." — shown in the footer */
  updatedLabel?: string
}

export function PhotoGallery({ photos, updatedLabel }: PhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const stripRef = useRef<HTMLDivElement>(null)

  const open = useCallback((index: number) => setLightboxIndex(index), [])
  const close = useCallback(() => setLightboxIndex(null), [])

  const prev = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length))
  }, [photos.length])

  const next = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i + 1) % photos.length))
  }, [photos.length])

  useEffect(() => {
    if (lightboxIndex === null) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightboxIndex, close, prev, next])

  // Preload adjacent images so navigation is instant
  useEffect(() => {
    if (lightboxIndex === null || photos.length < 2) return
    const neighbours = [
      (lightboxIndex + 1) % photos.length,
      (lightboxIndex - 1 + photos.length) % photos.length,
    ]
    neighbours.forEach((i) => {
      const img = new window.Image()
      img.src = photos[i].signedUrl
    })
  }, [lightboxIndex, photos])

  // Keep the active thumbnail in view in the lightbox strip
  useEffect(() => {
    if (lightboxIndex === null) return
    const strip = stripRef.current
    const active = strip?.querySelector<HTMLElement>('[data-active="true"]')
    active?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [lightboxIndex])

  if (photos.length === 0) return null

  const featured = photos[0]
  const thumbs = photos.slice(1, 7)
  const rest = photos.length - 7

  return (
    <div className="flex flex-col gap-4">
      {/* Bento grid: large featured image + small thumbnails */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:grid-rows-2">
        <button
          type="button"
          onClick={() => open(0)}
          className="group relative col-span-2 aspect-square overflow-hidden rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary sm:row-span-2 sm:aspect-auto"
        >
          <Image
            src={featured.signedUrl}
            alt={featured.name}
            fill
            sizes="(max-width: 640px) 100vw, 40vw"
            priority
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </button>

        {thumbs.map((photo, i) => {
          const index = i + 1
          const isLastVisible = i === thumbs.length - 1 && rest > 0
          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => open(index)}
              className="group relative aspect-square overflow-hidden rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              <Image
                src={photo.signedUrl}
                alt={photo.name}
                fill
                sizes="(max-width: 640px) 50vw, 20vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
              />
              {isLastVisible && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                  <span className="text-lg font-semibold text-white">+{rest}</span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Footer: count + updated date, with View All */}
      <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
        <span>
          {photos.length} nuotrauka(-ų)
          {updatedLabel && <span className="hidden sm:inline"> · {updatedLabel}</span>}
        </span>
        <Button type="button" variant="outline" size="sm" onClick={() => open(0)}>
          <Images weight="bold" />
          Peržiūrėti visas
        </Button>
      </div>

      {/* Lightbox — rendered via portal to escape transformed ancestors */}
      {lightboxIndex !== null && createPortal(
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/90"
          onClick={close}
        >
          {/* Top bar */}
          <div className="relative flex shrink-0 items-center justify-center py-4">
            <div className="rounded-full bg-black/60 px-3 py-1 text-sm text-white">
              {lightboxIndex + 1} / {photos.length}
            </div>
            <button
              type="button"
              onClick={close}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition-opacity hover:opacity-80"
              aria-label="Uždaryti"
            >
              <X size={20} />
            </button>
          </div>

          {/* Main image area */}
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4">
            {photos.length > 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev() }}
                className="absolute left-4 z-10 rounded-full bg-black/60 p-3 text-white transition-opacity hover:opacity-80"
                aria-label="Ankstesnė"
              >
                <ArrowLeft size={20} />
              </button>
            )}

            <img
              src={photos[lightboxIndex].signedUrl}
              alt={photos[lightboxIndex].name}
              onClick={(e) => e.stopPropagation()}
              className="max-h-full max-w-full rounded-lg object-contain"
            />

            {photos.length > 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next() }}
                className="absolute right-4 z-10 rounded-full bg-black/60 p-3 text-white transition-opacity hover:opacity-80"
                aria-label="Kita"
              >
                <ArrowRight size={20} />
              </button>
            )}
          </div>

          {/* Thumbnail strip */}
          {photos.length > 1 && (
            <div
              ref={stripRef}
              onClick={(e) => e.stopPropagation()}
              className="flex shrink-0 justify-start gap-2 overflow-x-auto px-4 py-4 sm:justify-center"
            >
              {photos.map((photo, i) => (
                <button
                  key={photo.id}
                  type="button"
                  data-active={i === lightboxIndex}
                  onClick={() => setLightboxIndex(i)}
                  className={cn(
                    'relative h-14 w-14 shrink-0 overflow-hidden rounded-md transition-opacity sm:h-16 sm:w-16',
                    i === lightboxIndex
                      ? 'opacity-100 ring-2 ring-white'
                      : 'opacity-50 hover:opacity-90'
                  )}
                  aria-label={`Nuotrauka ${i + 1}`}
                >
                  <Image
                    src={photo.signedUrl}
                    alt={photo.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}
