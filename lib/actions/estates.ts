'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Unauthorized')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Forbidden')
  }

  return { supabase, user }
}

export async function createEstate(data: {
  name: string
  address: string
  description?: string
}) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase.from('estates').insert({
    name: data.name,
    address: data.address,
    description: data.description ?? null,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/admin/estates')
}

export async function updateEstate(
  id: string,
  data: { name: string; address: string; description?: string }
) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('estates')
    .update({
      name: data.name,
      address: data.address,
      description: data.description ?? null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/estates')
}

export async function deleteEstate(id: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase.from('estates').delete().eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/estates')
}
