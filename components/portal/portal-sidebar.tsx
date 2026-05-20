'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { HouseSimple, WarningCircle, Camera, FileText, Phone, SignOut, UserCircle, CaretDown, Gear } from '@phosphor-icons/react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/portal/pagrindinis', label: 'Pagrindinis', icon: HouseSimple },
  { href: '/portal/defektai', label: 'Defektai ir pastabos', icon: WarningCircle, badgeKey: 'defects' },
  { href: '/portal/nuotraukos', label: 'Objekto nuotraukos', icon: Camera },
  { href: '/portal/sutartys', label: 'Paslaugų sutartys', icon: FileText },
  { href: '/portal/kontaktai', label: 'Kontaktai', icon: Phone },
]

interface PortalSidebarProps {
  userEmail: string
  activeDefectCount: number
}

function getDisplayName(email: string) {
  const username = email.split('@')[0]
  return username
    .split(/[._-]/)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

export function PortalSidebar({ userEmail, activeDefectCount }: PortalSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [profileOpen, setProfileOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const displayName = getDisplayName(userEmail)

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-5">
        <span className="text-lg font-bold tracking-tight text-sidebar-foreground">
          ELPEKAS
        </span>
        <span className="text-xs text-sidebar-foreground/60">Savininko portalas</span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.badgeKey === 'defects' && activeDefectCount > 0 && (
                      <SidebarMenuBadge>{activeDefectCount}</SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <div className="relative">
          {profileOpen && (
            <div className="absolute bottom-full left-0 mb-1 w-full rounded-xl bg-white py-1 shadow-[0px_0px_6px_rgba(0,0,0,0.12)] group-data-[collapsible=icon]:hidden">
              <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors">
                <Gear className="size-5 shrink-0" />
                Nustatymai
              </button>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-accent transition-colors"
              >
                <SignOut className="size-5 shrink-0" />
                Atsijungti
              </button>
            </div>
          )}

          <button
            onClick={() => setProfileOpen(v => !v)}
            className="flex w-full items-center justify-between gap-2 rounded-lg p-2 hover:bg-sidebar-accent transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent">
                <UserCircle className="size-5 text-sidebar-foreground" />
              </div>
              <div className="flex flex-col items-start min-w-0 group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-medium leading-5 text-sidebar-foreground truncate max-w-[128px]">
                  {displayName}
                </span>
                <span className="text-xs leading-4 text-sidebar-foreground/70 truncate max-w-[128px]">
                  {userEmail}
                </span>
              </div>
            </div>
            <CaretDown
              className={`size-4 shrink-0 text-sidebar-foreground/60 transition-transform group-data-[collapsible=icon]:hidden ${profileOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
