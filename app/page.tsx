import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const role = user.user_metadata?.role
  if (role === 'admin') redirect('/admin/estates')
  if (role === 'owner') redirect('/portal/pagrindinis')

  redirect('/login')
}

