import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AccountSettingsForm } from '@/components/portal/account-settings-form'
import { PageHeader } from '@/components/page-header'

export default async function NustatymaiPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? ''
  const phone = (user.user_metadata?.phone as string | undefined) ?? ''

  return (
    <div className="space-y-6">
      <PageHeader title="Paskyros nustatymai" description="Tvarkykite savo asmeninę informaciją ir paskyros prieigą" />

      <AccountSettingsForm
        initialFullName={fullName}
        initialPhone={phone}
        email={user.email ?? ''}
      />
    </div>
  )
}
