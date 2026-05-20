'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { TechnicalData, FinancialData } from '@/lib/types'

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

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

export async function updateUnitTechnicalData(
  unitId: string,
  data: TechnicalData
): Promise<void> {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('units')
    .update({ technical_data: data })
    .eq('id', unitId)

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/estates`)
}

export async function updateUnitFinancialData(
  unitId: string,
  data: FinancialData
): Promise<void> {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('units')
    .update({ financial_data: data })
    .eq('id', unitId)

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/estates`)
}

export async function uploadUnitDocument(
  unitId: string,
  formData: FormData
): Promise<void> {
  const { supabase, user } = await requireAdmin()
  const adminClient = createAdminClient()

  const file = formData.get('file') as File | null
  const category = formData.get('category') as string | null
  const name = formData.get('name') as string | null

  if (!file || !category || !name) {
    throw new Error('Trūksta duomenų')
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${file.name}`
  const storagePath = `documents/${unitId}/${fileName}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { error: uploadError } = await adminClient.storage
    .from('unit-files')
    .upload(storagePath, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (uploadError) throw new Error(uploadError.message)

  const { error: dbError } = await supabase.from('documents').insert({
    unit_id: unitId,
    category,
    name,
    storage_path: storagePath,
    uploaded_by: (await supabase.auth.getUser()).data.user!.id,
  })

  if (dbError) {
    await adminClient.storage.from('unit-files').remove([storagePath])
    throw new Error(dbError.message)
  }

  revalidatePath(`/admin/estates`)
}

export async function uploadUnitPhoto(
  unitId: string,
  formData: FormData
): Promise<void> {
  const { supabase, user } = await requireAdmin()
  const adminClient = createAdminClient()

  const file = formData.get('file') as File | null

  if (!file) {
    throw new Error('Trūksta failo')
  }

  const fileName = `${Date.now()}-${file.name}`
  const storagePath = `photos/${unitId}/${fileName}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { error: uploadError } = await adminClient.storage
    .from('unit-files')
    .upload(storagePath, buffer, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    })

  if (uploadError) throw new Error(uploadError.message)

  const { error: dbError } = await supabase.from('documents').insert({
    unit_id: unitId,
    category: 'photo',
    name: file.name,
    storage_path: storagePath,
    uploaded_by: user.id,
  })

  if (dbError) {
    await adminClient.storage.from('unit-files').remove([storagePath])
    throw new Error(dbError.message)
  }

  revalidatePath(`/admin/estates`)
}

export async function deleteDocument(
  documentId: string,
  storagePath: string
): Promise<void> {
  const { supabase } = await requireAdmin()
  const adminClient = createAdminClient()

  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId)

  if (dbError) throw new Error(dbError.message)

  const { error: storageError } = await adminClient.storage
    .from('unit-files')
    .remove([storagePath])

  if (storageError) throw new Error(storageError.message)

  revalidatePath(`/admin/estates`)
}
