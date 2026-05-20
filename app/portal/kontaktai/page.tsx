import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, EnvelopeOpen, MapPin, Clock } from '@phosphor-icons/react'

const contacts = [
  { icon: MapPin, label: 'Adresas', value: 'Gedimino pr. 1, Vilnius, Lietuva' },
  { icon: Phone, label: 'Telefonas', value: '+370 600 00000' },
  { icon: EnvelopeOpen, label: 'El. paštas', value: 'info@elpekas.lt' },
  { icon: Clock, label: 'Darbo laikas', value: 'I–V: 8:00–17:00' },
]

export default function KontaktaiPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Kontaktai</h1>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">ELPEKAS, UAB</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            {contacts.map(({ icon: Icon, label, value }) => (
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
