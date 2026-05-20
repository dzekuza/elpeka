'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Camera, FileText, HouseSimple, Phone, WarningCircle } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/portal/pagrindinis', label: 'Pagrindinis', icon: HouseSimple },
  { href: '/portal/defektai', label: 'Defektai', icon: WarningCircle, isBadge: true },
  { href: '/portal/nuotraukos', label: 'Nuotraukos', icon: Camera },
  { href: '/portal/sutartys', label: 'Sutartys', icon: FileText },
  { href: '/portal/kontaktai', label: 'Kontaktai', icon: Phone },
]

interface PortalBottomNavProps {
  activeDefectCount: number
}

export function PortalBottomNav({ activeDefectCount }: PortalBottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-card border-t border-border">
      <div className="flex items-stretch" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {navItems.map(({ href, label, icon: Icon, isBadge }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="relative">
                <Icon className="size-5" weight={isActive ? 'fill' : 'regular'} />
                {isBadge && activeDefectCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex min-w-[16px] h-[16px] items-center justify-center rounded-full bg-[var(--notification)] px-1 text-[9px] font-semibold leading-none text-white">
                    {activeDefectCount}
                  </span>
                )}
              </span>
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
