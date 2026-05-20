'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { InviteEmail } from '@/components/email/invite-email'

export async function inviteOwner(
  unitId: string,
  email: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Neprisijungęs' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Nėra teisių' }
    }

    const adminClient = createAdminClient()

    // Check if unit already has an accepted owner
    const { data: existingOwner } = await supabase
      .from('unit_owners')
      .select('id, accepted_at')
      .eq('unit_id', unitId)
      .not('accepted_at', 'is', null)
      .maybeSingle()

    if (existingOwner) {
      return { error: 'Šis butas jau turi savininką' }
    }

    // Fetch unit + estate info for the email
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

    // Invite via Supabase Auth
    const { data: inviteData, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(email, {
        data: { role: 'owner', unit_id: unitId },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/invite`,
      })

    if (inviteError || !inviteData.user) {
      return { error: inviteError?.message ?? 'Klaida kviečiant vartotoją' }
    }

    const invitedUserId = inviteData.user.id

    // Upsert unit_owners record
    const { error: upsertError } = await adminClient
      .from('unit_owners')
      .upsert(
        {
          unit_id: unitId,
          user_id: invitedUserId,
          invited_at: new Date().toISOString(),
          accepted_at: null,
        },
        { onConflict: 'unit_id,user_id' }
      )

    if (upsertError) {
      return { error: upsertError.message }
    }

    // Send branded invite email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY)
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite`

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: `Kvietimas į ELPEKAS portalą — ${estateName}`,
      react: InviteEmail({ unitNumber, estateName, inviteUrl }),
    })

    revalidatePath('/admin/estates')

    return {}
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Nežinoma klaida'
    return { error: message }
  }
}
