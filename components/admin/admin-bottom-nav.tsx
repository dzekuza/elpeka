'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AddressBook, Buildings, SignOut, WarningCircle } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { label: 'Objektai', href: '/admin/estates', icon: Buildings },
  { label: 'Defektai', href: '/admin/defects', icon: WarningCircle },
  { label: 'Kontaktai', href: '/admin/contacts', icon: AddressBook },
]

export function AdminBottomNav() {
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
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[11px] font-medium transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="size-5" weight={isActive ? 'fill' : 'regular'} />
              {label}
            </Link>
          )
        })}
        <button
          onClick={handleSignOut}
          className="flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <SignOut className="size-5" />
          Atsijungti
        </button>
      </div>
    </nav>
  )
}
