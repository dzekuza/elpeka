'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Neteisingas el. paštas arba slaptažodis')
      setLoading(false)
      return
    }

    const role = data.user?.user_metadata?.role
    if (role === 'admin') {
      router.push('/admin/estates')
    } else if (role === 'owner') {
      router.push('/portal/pagrindinis')
    } else {
      router.push('/')
    }
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
              Sveiki!
            </h1>
            <p className="text-sm leading-6 text-foreground/80">
              Įveskite savo el. pašto adresą ir slaptažodį, kad prisijungtumėte.
              Jei jungiatės pirmą kartą, naudokite Elpekas suteiktus prisijungimo duomenis.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-6">
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

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Slaptažodis</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex flex-col items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-primary px-4 py-3 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {loading ? 'Jungiamasi...' : 'Prisijungti'}
              </button>

              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary transition-opacity hover:opacity-80"
              >
                Pamiršote slaptažodį?
              </Link>
            </div>

            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <p className="text-center text-xs text-foreground/40">Greitas prisijungimas (dev)</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setEmail('admin@admin.com'); setPassword('Admin123.'); }}
                  className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground/60 transition-colors hover:bg-muted"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('owner@test.com'); setPassword('Admin123.'); }}
                  className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground/60 transition-colors hover:bg-muted"
                >
                  Owner
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
