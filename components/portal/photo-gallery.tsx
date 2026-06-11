'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { X, ArrowLeft, ArrowRight } from '@phosphor-icons/react'

interface Photo {
  id: string
  name: string
  signedUrl: string
}

interface PhotoGalleryProps {
  photos: Photo[]
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

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

  const visible = photos.slice(0, 6)
  const rest = photos.length - 6

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {visible.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => open(i)}
            className="relative aspect-square overflow-hidden rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <Image
              src={photo.signedUrl}
              alt={photo.name}
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              className="object-cover transition-opacity hover:opacity-90"
            />
            {i === 5 && rest > 0 && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                <span className="text-lg font-semibold text-white">+{rest}</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={close}
        >
          {/* Counter */}
          <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
            {lightboxIndex + 1} / {photos.length}
          </div>

          {/* Close */}
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 rounded-full bg-black/60 p-2 text-white transition-opacity hover:opacity-80"
            aria-label="Uždaryti"
          >
            <X size={20} />
          </button>

          {/* Prev */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prev() }}
              className="absolute left-4 rounded-full bg-black/60 p-3 text-white transition-opacity hover:opacity-80"
              aria-label="Ankstesnė"
            >
              <ArrowLeft size={20} />
            </button>
          )}

          {/* Image */}
          <div
            className="relative max-h-[85vh] max-w-[85vw]"
            onClick={(e) => e.stopPropagation()}
            style={{ aspectRatio: 'auto' }}
          >
            <img
              src={photos[lightboxIndex].signedUrl}
              alt={photos[lightboxIndex].name}
              className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain"
            />
          </div>

          {/* Next */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); next() }}
              className="absolute right-4 rounded-full bg-black/60 p-3 text-white transition-opacity hover:opacity-80"
              aria-label="Kita"
            >
              <ArrowRight size={20} />
            </button>
          )}
        </div>
      )}
    </>
  )
}
