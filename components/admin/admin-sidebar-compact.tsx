'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  AddressBook,
  Buildings,
  CaretDown,
  Gear,
  SidebarSimple,
  SignOut,
  UserCircle,
  WarningCircle,
} from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Nekilnojamasis turtas', href: '/admin/estates', icon: Buildings },
  { label: 'Defektai ir pastabos', href: '/admin/defects', icon: WarningCircle },
  { label: 'Kontaktai', href: '/admin/contacts', icon: AddressBook },
]

interface AdminSidebarCompactProps {
  userEmail: string
}

export function AdminSidebarCompact({ userEmail }: AdminSidebarCompactProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [expanded, setExpanded] = useState(() => {
    if (typeof window === 'undefined') return true
    const stored = localStorage.getItem('admin-sidebar-expanded')
    return stored !== null ? stored === 'true' : true
  })
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem('admin-sidebar-expanded', String(expanded))
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

  const displayName = userEmail.split('@')[0]

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col justify-between shrink-0 h-screen py-2 px-2 transition-[width] duration-200 ease-in-out',
        expanded ? 'w-[260px]' : 'w-14'
      )}
      style={{ background: '#52596b' }}
    >
      {/* Top: header + nav — overflow-hidden here clips labels during width transition */}
      <div className={cn('flex flex-col gap-8 overflow-hidden', expanded ? 'items-start' : 'items-center')}>
        {/* Header */}
        <div className={cn('flex items-center shrink-0 w-full', expanded ? 'justify-between' : 'justify-center')}>
          {expanded && (
            <div className="pl-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logotype.svg" alt="ELPEKAS" width={102} height={41} />
            </div>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <SidebarSimple size={24} weight={expanded ? 'regular' : 'regular'} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-1 w-full">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-lg transition-colors',
                  expanded ? 'w-full' : 'w-10 justify-center',
                  isActive
                    ? 'text-[#c2a475]'
                    : 'text-white hover:bg-white/10'
                )}
                style={isActive ? { background: 'rgba(194,164,117,0.1)' } : undefined}
                title={!expanded ? item.label : undefined}
              >
                <item.icon size={24} className="shrink-0" />
                {expanded && (
                  <span className="text-sm font-medium whitespace-nowrap overflow-hidden">{item.label}</span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Bottom: profile */}
      <div ref={profileRef} className="relative">
        {profileOpen && (
          <div className="absolute bottom-full mb-2 left-0 w-44 bg-white rounded-xl shadow-lg p-1 flex flex-col gap-1 z-50">
            <button
              className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-[#1d1e20] text-sm font-medium hover:bg-gray-100 transition-colors"
              onClick={() => { setProfileOpen(false); router.push('/admin/settings') }}
            >
              <Gear size={20} />
              Nustatymai
            </button>
            <button
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
            'flex items-center p-2 rounded-lg w-full hover:bg-white/10 transition-colors',
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
          {expanded && <CaretDown size={16} className="text-white/70 shrink-0" />}
        </button>
      </div>
    </aside>
  )
}
