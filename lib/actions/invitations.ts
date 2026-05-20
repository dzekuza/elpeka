'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { InviteEmail } from '@/components/email/invite-email'

export interface OwnerEntry {
  email: string
  firstName: string
  lastName: string
  phone: string
}

export async function inviteOwner(
  unitId: string,
  owners: OwnerEntry[]
): Promise<{ error?: string; invited: number }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) return { error: 'Neprisijungęs', invited: 0 }
    if (user.user_metadata?.role !== 'admin') return { error: 'Nėra teisių', invited: 0 }

    const adminClient = createAdminClient()

    const { data: unit } = await supabase
      .from('units')
      .select('unit_number, estates(name)')
      .eq('id', unitId)
      .single()

    const unitNumber = unit?.unit_number ?? unitId
    const estatesRaw = unit?.estates as unknown
    const estateName =
      estatesRaw && !Array.isArray(estatesRaw) && typeof estatesRaw === 'object'
        ? (estatesRaw as { name: string }).name
        : 'Nežinomas objektas'

    const resend = new Resend(process.env.RESEND_API_KEY)
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite`
    let invited = 0

    for (const owner of owners) {
      const { data: inviteData, error: inviteError } =
        await adminClient.auth.admin.inviteUserByEmail(owner.email, {
          data: { role: 'owner', unit_id: unitId },
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/invite`,
        })

      if (inviteError || !inviteData.user) continue

      await adminClient.from('unit_owners').upsert(
        {
          unit_id: unitId,
          user_id: inviteData.user.id,
          first_name: owner.firstName || null,
          last_name: owner.lastName || null,
          phone: owner.phone || null,
          invited_at: new Date().toISOString(),
          accepted_at: null,
        },
        { onConflict: 'unit_id,user_id' }
      )

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: owner.email,
        subject: `Kvietimas į ELPEKAS portalą — ${estateName}`,
        react: InviteEmail({ unitNumber, estateName, inviteUrl }),
      })

      invited++
    }

    revalidatePath('/admin/estates')
    return { invited }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Nežinoma klaida'
    return { error: message, invited: 0 }
  }
}
