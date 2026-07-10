'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

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
    <main className="flex min-h-screen bg-background">
      {/* Left — hero photo */}
      <div className="relative hidden md:block md:w-1/2" aria-hidden="true">
        <Image
          src="/images/login-hero.jpg"
          alt="Elpekas"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
      </div>

      {/* Right — form */}
      <div className="flex w-full flex-col items-center justify-center gap-8 px-6 py-12 md:w-1/2">
        <div className="flex w-full max-w-[412px] flex-col gap-8 rounded-3xl bg-card p-6 shadow-sm">
          {/* Logo */}
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logotype-dark.svg" alt="ELPEKAS" width={102} height={41} />
          </div>
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-[28px] font-medium leading-8 tracking-[-0.02em] text-foreground">
              Sveiki!
            </h1>
            <p className="text-sm leading-6 text-foreground/80">
              Įveskite savo el. pašto adresą ir slaptažodį, kad prisijungtumėte.
              Jungiantis pirmą kartą, naudokite Elpekas suteiktus prisijungimo duomenis.
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
                className="w-full rounded-lg bg-primary px-4 py-3 text-base font-medium text-primary-foreground transition-[opacity,transform] duration-150 ease-out hover:opacity-90 active:scale-[0.97] disabled:opacity-60 disabled:active:scale-100"
              >
                {loading ? 'Jungiamasi...' : 'Prisijungti'}
              </button>

              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary transition-opacity duration-150 ease-out hover:opacity-80"
              >
                Pamiršote slaptažodį?
              </Link>
            </div>

          </form>
        </div>

        {/* Social icons footer */}
        <footer className="flex gap-4">
          <a href="https://www.facebook.com/elpekas" aria-label="Elpekas Facebook" className="text-muted-foreground transition-colors duration-150 hover:text-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          </a>
          <a href="https://www.instagram.com/elpekas" aria-label="Elpekas Instagram" className="text-muted-foreground transition-colors duration-150 hover:text-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
          </a>
          <a href="https://www.linkedin.com/company/elpekas" aria-label="Elpekas LinkedIn" className="text-muted-foreground transition-colors duration-150 hover:text-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
          </a>
        </footer>
      </div>
    </main>
  )
}
