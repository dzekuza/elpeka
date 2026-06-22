import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serviceReminderEmailHtml } from '@/lib/emails/service-reminder'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const html = serviceReminderEmailHtml({
    ownerName: 'Jonas Jonaitis',
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    incompleteServices: [
      { name: 'Vandentiekio įrengimas', dueDate: null },
      { name: 'Elektros instaliacijos patikrinimas', dueDate: null },
      { name: 'Balkonų apdaila', dueDate: null },
    ],
  })

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
