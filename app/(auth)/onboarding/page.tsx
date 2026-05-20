import Link from 'next/link'
import {
  BuildingOffice,
  ListChecks,
  Camera,
  FileText,
  Headset,
} from '@phosphor-icons/react/dist/ssr'

const features = [
  { icon: BuildingOffice, label: 'Peržiūrėkite savo būsto informaciją' },
  { icon: ListChecks,     label: 'Praneškite apie defektus ir sekite jų sprendimo eigą' },
  { icon: Camera,         label: 'Peržiūrėkite objekto nuotraukas' },
  { icon: FileText,       label: 'Valdykite su paslaugų sutartimis susijusią informaciją' },
  { icon: Headset,        label: 'Susisiekite su administracija ar rangovais' },
]

export default function OnboardingPage() {
  return (
    <div className="relative flex min-h-screen bg-[#f2f1f0]">
      {/* Logo — top left */}
      <div className="absolute left-8 top-8 z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logotype-dark.svg" alt="ELPEKAS" width={102} height={41} />
      </div>

      {/* Left: content */}
      <div className="flex w-1/2 items-center px-20">
        <div className="flex flex-col gap-8 max-w-lg">
          <h1 className="text-[28px] font-medium leading-10 tracking-[-0.02em] text-foreground">
            Sveiki atvykę į <strong className="font-bold">Elpekas</strong> kliento portalą
          </h1>

          <div className="flex flex-col gap-[18px] opacity-80">
            <p className="text-base leading-6 text-foreground">
              Prieigą prie šio portalo gavote įsigiję nekilnojamąjį turtą viename iš „Elpekas"
              projektų. Čia galite valdyti su jūsų būstu / patalpomis susijusią informaciją ir
              gauti pagalbą.
            </p>

            <ul className="flex flex-col gap-2">
              {features.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3">
                  <Icon className="size-6 shrink-0 text-foreground" weight="regular" />
                  <span className="text-base leading-7 text-foreground">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <Link
            href="/portal/pagrindinis"
            className="inline-flex items-center justify-center self-start rounded-lg bg-primary px-4 py-3 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Pradėti
          </Link>
        </div>
      </div>

      {/* Right: hero image */}
      <div className="flex w-1/2 items-center p-4">
        <div className="relative h-[780px] w-full overflow-hidden rounded-3xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/onboarding-hero.png"
            alt="ELPEKAS portalo vizualas"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </div>
    </div>
  )
}
