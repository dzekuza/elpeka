import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Layers, Ruler, Hash } from 'lucide-react'

export default async function PagrindiniPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: ownership } = await supabase
    .from('unit_owners')
    .select('unit_id, accepted_at')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .maybeSingle()

  if (!ownership) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Pagrindinis</h1>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            Jūsų paskyra dar nėra susieta su jokiu butu. Susisiekite su administratoriumi.
          </CardContent>
        </Card>
      </div>
    )
  }

  const { data: unit } = await supabase
    .from('units')
    .select('id, unit_number, floor, area_sqm, estate_id, estates(name, address)')
    .eq('id', ownership.unit_id)
    .single()

  type EstateShape = { name: string; address: string } | null
  const estate = (unit?.estates as unknown as EstateShape)

  const stats = [
    { label: 'Kompleksas', value: estate?.name ?? '—', icon: Building2 },
    { label: 'Adresas', value: estate?.address ?? '—', icon: Hash },
    { label: 'Buto nr.', value: unit?.unit_number ?? '—', icon: Hash },
    { label: 'Aukštas', value: unit?.floor != null ? `${unit.floor} aukštas` : '—', icon: Layers },
    { label: 'Plotas', value: unit?.area_sqm != null ? `${unit.area_sqm} m²` : '—', icon: Ruler },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pagrindinis</h1>
        <Badge variant="secondary">Savininkas</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Jūsų objektas</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="mt-0.5 rounded-md bg-primary/10 p-1.5">
                  <Icon className="size-4 text-primary" />
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="text-sm font-medium">{value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
