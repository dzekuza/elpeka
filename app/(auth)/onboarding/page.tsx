import Link from 'next/link'
import {
  Buildings,
  ListChecks,
  Camera,
  FileText,
  Headset,
} from '@phosphor-icons/react/dist/ssr'
import { Button } from '@/components/ui/button'

const features = [
  { icon: Buildings, label: 'Peržiūrėkite savo būsto informaciją' },
  { icon: ListChecks, label: 'Praneškite apie defektus ir sekite jų sprendimo eigą' },
  { icon: Camera, label: 'Peržiūrėkite objekto nuotraukas' },
  { icon: FileText, label: 'Valdykite su paslaugų sutartimis susijusią informaciją' },
  { icon: Headset, label: 'Susisiekite su administracija ar rangovais' },
]

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left — content */}
      <div className="relative flex flex-1 flex-col px-20 py-8">
        {/* Logo */}
        <div className="mb-auto">
          <span className="text-xl font-bold tracking-wide text-foreground">ELPEKAS</span>
        </div>

        {/* Centered content */}
        <div className="flex flex-1 flex-col justify-center gap-8 py-16">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground">
            Sveiki atvykę į{' '}
            <span className="font-bold">Elpekas</span>{' '}
            kliento portalą
          </h1>

          <div className="flex flex-col gap-5 text-foreground/80">
            <p className="text-base leading-relaxed">
              Prieigą prie šio portalo gavote įsigiję nekilnojamąjį turtą viename iš
              „Elpekas" projektų. Čia galite valdyti su jūsų būstu / patalpomis susijusią
              informaciją ir gauti pagalbą.
            </p>

            <ul className="flex flex-col gap-2">
              {features.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-base">
                  <Icon className="size-5 shrink-0 text-primary" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <Button asChild className="w-fit">
            <Link href="/portal/pagrindinis">Pradėti</Link>
          </Button>
        </div>
      </div>

      {/* Right — photo panel */}
      <div className="hidden p-4 lg:flex lg:w-[49%]">
        <div className="w-full overflow-hidden rounded-3xl bg-muted">
          {/*
            Replace with an actual property photo stored in Supabase Storage.
            Dimensions: roughly 680×748px.
          */}
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Buildings className="size-24 opacity-20" />
          </div>
        </div>
      </div>
    </div>
  )
}
