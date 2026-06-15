'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { ServiceCategory } from '@/lib/types'

const UpsertServiceSchema = z.object({
  unitId: z.string().uuid(),
  meter_number: z.string().max(100).nullable(),
  description: z.string().max(2000).nullable(),
})

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  if (user.user_metadata?.role !== 'admin') throw new Error('Forbidden')
  return { supabase, user }
}

async function requireOwner() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  if (user.user_metadata?.role !== 'owner') throw new Error('Forbidden')
  return { supabase, user }
}

export async function upsertUnitService(
  unitId: string,
  category: ServiceCategory,
  data: { meter_number: string | null; description: string | null }
): Promise<void> {
  UpsertServiceSchema.parse({ unitId, ...data })
  const { supabase } = await requireAdmin()
  const { error } = await supabase
    .from('unit_services')
    .upsert(
      { unit_id: unitId, category, meter_number: data.meter_number, description: data.description },
      { onConflict: 'unit_id,category' }
    )
  if (error) throw new Error(error.message)
  revalidatePath('/admin/estates', 'layout')
}

export async function markServiceCompleted(serviceId: string): Promise<void> {
  const { supabase } = await requireOwner()

  const { error } = await supabase
    .from('unit_services')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', serviceId)
    .is('completed_at', null)

  if (error) throw new Error(error.message)
  revalidatePath('/portal/sutartys')
}

// TODO: cron job — send reminder emails to owners with incomplete unit_services; respect unit_owners.notifications_enabled
export async function sendServiceContractReminders(): Promise<void> {
  // stub — implement as a Vercel cron at /api/cron/service-reminders
}
