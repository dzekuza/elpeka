'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AddressBook, Buildings, SignOut, WarningCircle } from '@phosphor-icons/react'
import { ElpekasLogo } from '@/components/elpekas-logo'
import { createClient } from '@/lib/supabase/client'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'

const navItems = [
  {
    label: 'Nekilnojamasis turtas',
    href: '/admin/estates',
    icon: Buildings,
  },
  {
    label: 'Defektai ir pastabos',
    href: '/admin/defects',
    icon: WarningCircle,
  },
  {
    label: 'Kontaktai',
    href: '/admin/contacts',
    icon: AddressBook,
  },
]

interface AdminSidebarProps {
  userEmail: string
}

export function AdminSidebar({ userEmail }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-5">
        <ElpekasLogo />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 gap-2">
        <p className="truncate text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
          {userEmail}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          onClick={handleSignOut}
        >
          <SignOut className="size-4 shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden">Atsijungti</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
