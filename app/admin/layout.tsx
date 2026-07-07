import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/supabase/server'
import { AdminSidebarCompact } from '@/components/admin/admin-sidebar-compact'
import { AdminBottomNav } from '@/components/admin/admin-bottom-nav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser()

  if (!user) {
    redirect('/login')
  }

  const userEmail = user.email ?? ''

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebarCompact userEmail={userEmail} />
      <main className="flex-1 overflow-y-auto">
        <div className="px-4 pt-6 pb-24 md:px-10 md:pt-7 md:pb-10">{children}</div>
      </main>
      <AdminBottomNav />
    </div>
  )
}
