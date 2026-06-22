import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

// Vercel cron: runs every Monday at 08:00 UTC (see vercel.json)
// Sends reminder emails to owners with incomplete unit_services
// Respects unit_owners.notifications_enabled

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // TODO: implement
  // 1. Query unit_owners where notifications_enabled = true and accepted_at is not null
  // 2. For each owner, find unit_services where completed_at is null
  // 3. If any incomplete services exist, send reminder email via Resend
  // 4. Log sent count

  const _adminClient = createAdminClient()
  const _resend = new Resend(process.env.RESEND_API_KEY)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://elpeka.vercel.app'

  // Stub — remove this line when implementing
  void appUrl

  return NextResponse.json({ ok: true, sent: 0 })
}
