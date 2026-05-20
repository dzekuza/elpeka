'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function InviteForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Supabase redirects invite links to /auth/callback which exchanges
    // the token, then redirects here. By this point the session is set.
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setReady(true)
    })
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Slaptažodžiai nesutampa')
      return
    }
    if (password.length < 8) {
      setError('Slaptažodis turi būti bent 8 simbolių')
      return
    }

    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('Klaida nustatant slaptažodį. Bandykite dar kartą.')
      setLoading(false)
      return
    }

    router.push('/portal/pagrindinis')
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center text-muted-foreground">
            Tikrinamas pakvietimas...
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-xl font-bold">
            Nustatykite slaptažodį
          </CardTitle>
          <CardDescription>
            Sukurkite slaptažodį savo ELPEKAS paskyrai
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Slaptažodis</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Pakartokite slaptažodį</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Išsaugoma...' : 'Nustatyti slaptažodį'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
