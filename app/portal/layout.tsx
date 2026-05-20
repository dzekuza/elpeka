import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PortalSidebar } from '@/components/portal/portal-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: ownership } = await supabase
    .from('unit_owners')
    .select('unit_id')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .maybeSingle()

  const unitId = ownership?.unit_id ?? null

  let activeDefectCount = 0
  if (unitId) {
    const { count } = await supabase
      .from('defects')
      .select('id', { count: 'exact', head: true })
      .eq('unit_id', unitId)
      .neq('status', 'atlikta')
    activeDefectCount = count ?? 0
  }

  return (
    <SidebarProvider>
      <PortalSidebar userEmail={user.email ?? ''} activeDefectCount={activeDefectCount} />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
        </header>
        <div className="flex-1 p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
