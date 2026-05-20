'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

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
    <div className="relative min-h-screen overflow-hidden bg-[#f2f1f0]">
      {/* Logo — top left */}
      <div className="absolute left-4 top-4 z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logotype-dark.svg" alt="ELPEKAS" width={102} height={41} />
      </div>

      {/* Decorative background element */}
      <div
        className="pointer-events-none absolute"
        style={{
          left: '58%',
          top: '50%',
          transform: 'translate(0, -50%) rotate(-12.5deg)',
          width: '900px',
          opacity: 0.08,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/login-bg.svg" alt="" className="w-full" />
      </div>

      {/* Centered card */}
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="relative z-10 flex w-full max-w-[412px] flex-col gap-8 rounded-3xl bg-white p-6 shadow-sm">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-[28px] font-medium leading-8 tracking-[-0.02em] text-foreground">
              Pamiršote slaptažodį?
            </h1>
            <p className="text-sm leading-6 text-foreground/80">
              Įveskite savo el pašto adresą ir atsųsime jums nuorodą slaptažodžiui atkurti
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
      </div>
    </div>
  )
}
