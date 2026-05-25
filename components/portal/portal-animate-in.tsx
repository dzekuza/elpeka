'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

interface PortalAnimateInProps {
  children: React.ReactNode
  className?: string
}

export function PortalAnimateIn({ children, className }: PortalAnimateInProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const els = Array.from(containerRef.current?.children ?? [])
      if (els.length === 0) return

      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(els, {
          y: 12,
          autoAlpha: 0,
          duration: 0.45,
          stagger: 0.06,
          ease: 'power2.out',
          clearProps: 'all',
        })
      })
      return () => mm.revert()
    },
    { scope: containerRef }
  )

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}
