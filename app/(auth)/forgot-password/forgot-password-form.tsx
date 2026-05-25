'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/portal/pagrindinis`,
    })

    setLoading(false)
    setSent(true)
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left — hero photo */}
      <div className="relative hidden md:block md:w-1/2">
        <Image
          src="/images/login-hero.jpg"
          alt="Elpekas"
          fill
          priority
          className="object-cover"
        />
      </div>

      {/* Right — form */}
      <div className="flex w-full flex-col items-center justify-between px-6 py-12 md:w-1/2">
        {/* Logo */}
        <div className="self-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logotype-dark.svg" alt="ELPEKAS" width={102} height={41} />
        </div>

        <div className="flex w-full max-w-[412px] flex-col gap-8 rounded-3xl bg-card p-6 shadow-sm">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-[28px] font-medium leading-8 tracking-[-0.02em] text-foreground">
              Pamiršote slaptažodį?
            </h1>
            <p className="text-sm leading-6 text-foreground/80">
              Nurodykite savo el. pašto adresą ir juo gausite nuorodą slaptažodžiui atkurti.
            </p>
          </div>

          {sent ? (
            <div className="flex flex-col gap-6">
              <p className="text-sm leading-6 text-foreground/60">
                Nuoroda išsiųsta į <span className="font-medium text-foreground">{email}</span>. Patikrinkite savo el. paštą.
              </p>
              <Link
                href="/login"
                className="text-center text-sm font-medium text-primary transition-opacity hover:opacity-80"
              >
                Grįžti į prisijungimo langą
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">El. paštas</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex flex-col items-center gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-primary px-4 py-3 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {loading ? 'Siunčiama...' : 'Siųsti'}
                </button>

                <Link
                  href="/login"
                  className="text-sm font-medium text-primary transition-opacity hover:opacity-80"
                >
                  Grįžti į prisijungimo langą
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Social icons footer */}
        <div className="flex gap-4">
          <a href="https://www.facebook.com/elpekas" aria-label="Elpekas Facebook" className="text-muted-foreground transition-colors hover:text-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          </a>
          <a href="https://www.instagram.com/elpekas" aria-label="Elpekas Instagram" className="text-muted-foreground transition-colors hover:text-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
          </a>
          <a href="https://www.linkedin.com/company/elpekas" aria-label="Elpekas LinkedIn" className="text-muted-foreground transition-colors hover:text-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
          </a>
        </div>
      </div>
    </div>
  )
}
