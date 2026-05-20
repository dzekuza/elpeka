import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PortalSidebar } from '@/components/portal/portal-sidebar'
import { PortalBottomNav } from '@/components/portal/portal-bottom-nav'

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
    <div className="flex h-screen overflow-hidden">
      <PortalSidebar userEmail={user.email ?? ''} activeDefectCount={activeDefectCount} />
      <main className="flex-1 overflow-y-auto">
        <div className="px-4 pt-6 pb-24 md:px-10 md:pt-7 md:pb-10">{children}</div>
      </main>
      <PortalBottomNav activeDefectCount={activeDefectCount} />
    </div>
  )
}
