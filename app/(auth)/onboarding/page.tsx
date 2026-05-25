import Link from 'next/link'
import Image from 'next/image'
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
    <div className="relative flex min-h-screen flex-col bg-background md:flex-row">
      {/* Logo — top left */}
      <div className="absolute left-6 top-6 z-10 md:left-8 md:top-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logotype-dark.svg" alt="ELPEKAS" width={102} height={41} />
      </div>

      {/* Left: content */}
      <div className="flex w-full items-center px-6 pb-10 pt-24 md:w-1/2 md:px-20 md:py-0">
        <div className="flex w-full flex-col gap-8 md:max-w-lg">
          <h1 className="text-[24px] font-medium leading-9 tracking-[-0.02em] text-foreground md:text-[28px] md:leading-10">
            Sveiki atvykę į <strong className="font-bold">Elpekas</strong> kliento portalą
          </h1>

          <div className="flex flex-col gap-[18px] opacity-80">
            <p className="text-base leading-6 text-foreground">
              Prieigą prie šio portalo gavote įsigiję nekilnojamąjį turtą viename iš „Elpekas&#8220;
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
      <div className="flex flex-1 items-stretch p-4 md:w-1/2 md:flex-none md:items-center">
        <div className="relative w-full overflow-hidden rounded-3xl md:h-[780px]">
          <Image
            src="/onboarding-hero.png"
            alt="ELPEKAS portalo vizualas"
            fill
            priority
            className="object-cover"
          />
        </div>
      </div>
    </div>
  )
}
