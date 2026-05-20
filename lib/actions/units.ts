'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { TechnicalData, FinancialData } from '@/lib/types'
import { validateImageUpload, validateDocumentUpload } from '@/lib/upload-validation'

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Unauthorized')
  }

  if (user.user_metadata?.role !== 'admin') {
    throw new Error('Forbidden')
  }

  return { supabase, user }
}

export async function deleteUnits(ids: string[], estateId: string) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('units').delete().in('id', ids)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/estates/${estateId}`)
}

export async function createUnit(data: {
  estate_id: string
  unit_number: string
  floor?: number | null
  area_sqm?: number | null
  technical_data?: TechnicalData
}) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase.from('units').insert({
    estate_id: data.estate_id,
    unit_number: data.unit_number,
    floor: data.floor ?? null,
    area_sqm: data.area_sqm ?? null,
    technical_data: data.technical_data ?? null,
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/estates/${data.estate_id}`)
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

  validateDocumentUpload(file)

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

  validateImageUpload(file)

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

export async function deleteOwnerDocument(
  documentId: string,
  storagePath: string,
  unitId: string
): Promise<void> {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Unauthorized')

  const { data: ownership } = await supabase
    .from('unit_owners')
    .select('unit_id')
    .eq('user_id', user.id)
    .eq('unit_id', unitId)
    .not('accepted_at', 'is', null)
    .maybeSingle()

  if (!ownership) throw new Error('Forbidden')

  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId)

  if (dbError) throw new Error(dbError.message)

  await adminClient.storage.from('unit-files').remove([storagePath])

  revalidatePath('/portal/pagrindinis')
}

export async function uploadOwnerDocument(
  unitId: string,
  category: string,
  formData: FormData
): Promise<void> {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Unauthorized')

  // Verify this user owns the unit
  const { data: ownership } = await supabase
    .from('unit_owners')
    .select('unit_id')
    .eq('user_id', user.id)
    .eq('unit_id', unitId)
    .not('accepted_at', 'is', null)
    .maybeSingle()

  if (!ownership) throw new Error('Forbidden')

  const file = formData.get('file') as File | null
  if (!file) throw new Error('Trūksta failo')

  validateDocumentUpload(file)

  const fileName = `${Date.now()}-${file.name}`
  const storagePath = `documents/${unitId}/${fileName}`
  const buffer = new Uint8Array(await file.arrayBuffer())

  const { error: uploadError } = await adminClient.storage
    .from('unit-files')
    .upload(storagePath, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (uploadError) throw new Error(uploadError.message)

  const { error: dbError } = await adminClient.from('documents').insert({
    unit_id: unitId,
    category,
    name: file.name,
    storage_path: storagePath,
    uploaded_by: user.id,
  })

  if (dbError) {
    await adminClient.storage.from('unit-files').remove([storagePath])
    throw new Error(dbError.message)
  }

  revalidatePath('/portal/pagrindinis')
}
