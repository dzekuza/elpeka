'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Camera,
  CaretDown,
  FileText,
  Gear,
  HouseSimple,
  Phone,
  SidebarSimple,
  SignOut,
  UserCircle,
  WarningCircle,
} from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/portal/pagrindinis', label: 'Pagrindinis', icon: HouseSimple },
  { href: '/portal/defektai', label: 'Defektai ir pastabos', icon: WarningCircle, badge: true },
  { href: '/portal/nuotraukos', label: 'Objekto nuotraukos', icon: Camera },
  { href: '/portal/sutartys', label: 'Paslaugų sutartys', icon: FileText },
  { href: '/portal/kontaktai', label: 'Rangovai ir kontaktai', icon: Phone },
]

function getDisplayName(email: string) {
  const username = email.split('@')[0]
  return username
    .split(/[._-]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

interface PortalSidebarProps {
  userEmail: string
  activeDefectCount: number
}

export function PortalSidebar({ userEmail, activeDefectCount }: PortalSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [expanded, setExpanded] = useState(() => {
    if (typeof window === 'undefined') return true
    const stored = localStorage.getItem('portal-sidebar-expanded')
    return stored !== null ? stored === 'true' : true
  })
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem('portal-sidebar-expanded', String(expanded))
  }, [expanded])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const displayName = getDisplayName(userEmail)

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col justify-between shrink-0 h-screen py-2 px-2 transition-[width] duration-200 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] bg-sidebar',
        expanded ? 'w-[260px]' : 'w-14'
      )}
    >
      {/* Top: header + nav — overflow-hidden here clips labels during width transition */}
      <div className={cn('flex flex-col gap-8 overflow-hidden', expanded ? 'items-start' : 'items-center')}>
        {/* Header */}
        <div
          className={cn(
            'flex items-center shrink-0 w-full',
            expanded ? 'justify-between' : 'justify-center'
          )}
        >
          {expanded && (
            <div className="pl-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logotype.svg" alt="ELPEKAS" width={102} height={41} />
            </div>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label={expanded ? 'Sutraukti' : 'Išplėsti'}
          >
            <SidebarSimple size={24} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-1 w-full">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const showBadge = item.badge && activeDefectCount > 0

            return (
              <Link
                key={item.href}
                href={item.href}
                title={!expanded ? item.label : undefined}
                className={cn(
                  'relative flex items-center gap-2 p-2 rounded-lg transition-colors',
                  expanded ? 'w-full' : 'w-10 justify-center',
                  isActive ? 'text-white bg-sidebar-accent' : 'text-sidebar-foreground hover:bg-white/10'
                )}
              >
                <item.icon size={24} className="shrink-0" />
                {expanded && (
                  <span className="flex-1 text-sm font-medium whitespace-nowrap overflow-hidden">
                    {item.label}
                  </span>
                )}
                {/* Badge */}
                {showBadge && expanded && (
                  <span className="ml-auto flex min-w-[22px] h-[22px] items-center justify-center rounded-full [background:var(--status-sprendziama)] px-1.5 text-[11px] font-semibold text-white tabular-nums shrink-0">
                    {activeDefectCount}
                  </span>
                )}
                {showBadge && !expanded && (
                  <span className="absolute top-1 right-1 size-2 rounded-full [background:var(--status-sprendziama)]" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Bottom: profile */}
      <div ref={profileRef} className="relative">
        {profileOpen && (
          <div role="menu" className="absolute bottom-full mb-2 left-0 w-44 bg-white rounded-xl shadow-lg p-1 flex flex-col gap-1 z-50">
            <Link
              href="/portal/nustatymai"
              role="menuitem"
              className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-foreground text-sm font-medium hover:bg-gray-100 transition-colors"
              onClick={() => setProfileOpen(false)}
            >
              <Gear size={20} />
              Nustatymai
            </Link>
            <button
              role="menuitem"
              className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
              onClick={handleSignOut}
            >
              <SignOut size={20} />
              Atsijungti
            </button>
          </div>
        )}

        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className={cn(
            'flex items-center p-2 rounded-lg w-full hover:bg-white/10 transition-colors duration-150 ease-out',
            expanded ? 'gap-2 justify-between' : 'justify-center'
          )}
        >
          <div className={cn('flex items-center', expanded ? 'gap-2' : '')}>
            <div className="size-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <UserCircle size={24} className="text-white" />
            </div>
            {expanded && (
              <div className="flex flex-col items-start text-left overflow-hidden">
                <span className="text-white text-sm font-medium truncate max-w-[120px] leading-5">
                  {displayName}
                </span>
                <span className="text-white/90 text-xs truncate max-w-[120px] leading-4">
                  {userEmail}
                </span>
              </div>
            )}
          </div>
          {expanded && (
            <CaretDown
              size={16}
              className={cn(
                'text-white/70 shrink-0 transition-transform duration-200 ease-out',
                profileOpen ? 'rotate-180' : ''
              )}
            />
          )}
        </button>
      </div>
    </aside>
  )
}
