'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Unauthorized')
  }

  if (user.user_metadata?.role !== 'admin') {
    throw new Error('Forbidden')
  }

  return { supabase, user }
}

export async function createEstate(data: {
  name: string
  address: string
  description?: string
}): Promise<{ id: string }> {
  const { supabase } = await requireAdmin()

  const { data: row, error } = await supabase
    .from('estates')
    .insert({
      name: data.name,
      address: data.address,
      description: data.description ?? null,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/admin/estates')
  return { id: row.id }
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

export async function setEstateCoverPhoto(
  estateId: string,
  formData: FormData
): Promise<void> {
  await requireAdmin()
  const adminClient = createAdminClient()

  const file = formData.get('file') as File | null
  if (!file) throw new Error('Trūksta failo')

  const ext = file.name.split('.').pop() ?? 'jpg'
  const storagePath = `estate-photos/${estateId}/cover.${ext}`

  const buffer = new Uint8Array(await file.arrayBuffer())

  const { error: uploadError } = await adminClient.storage
    .from('unit-files')
    .upload(storagePath, buffer, { contentType: file.type || 'image/jpeg', upsert: true })

  if (uploadError) throw new Error(uploadError.message)

  const { error: dbError } = await adminClient
    .from('estates')
    .update({ cover_photo_path: storagePath })
    .eq('id', estateId)

  if (dbError) throw new Error(dbError.message)

  revalidatePath('/admin/estates')
  revalidatePath(`/admin/estates/${estateId}`)
}

export async function uploadEstatePhoto(
  estateId: string,
  formData: FormData
): Promise<void> {
  await requireAdmin()
  const adminClient = createAdminClient()

  const file = formData.get('file') as File | null
  if (!file) throw new Error('Trūksta failo')

  const fileName = `${Date.now()}-${file.name}`
  const storagePath = `estate-photos/${estateId}/${fileName}`

  const buffer = new Uint8Array(await file.arrayBuffer())

  const { error } = await adminClient.storage
    .from('unit-files')
    .upload(storagePath, buffer, { contentType: file.type || 'image/jpeg', upsert: false })

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/estates/${estateId}`)
}

export async function deleteEstatePhoto(
  estateId: string,
  storagePath: string
): Promise<void> {
  await requireAdmin()
  const adminClient = createAdminClient()

  const { error } = await adminClient.storage.from('unit-files').remove([storagePath])

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/estates/${estateId}`)
}
