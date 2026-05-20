'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { DefectStatus } from '@/lib/types'

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

async function requireOwner() {
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

  if (profile?.role !== 'owner') {
    throw new Error('Forbidden')
  }

  return { supabase, user }
}

export async function updateDefectStatus(
  defectId: string,
  status: DefectStatus
): Promise<void> {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('defects')
    .update({ status })
    .eq('id', defectId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/defects')
  revalidatePath(`/admin/defects/${defectId}`)
}

export async function addDefectReply(
  defectId: string,
  body: string,
  photoFormData?: FormData
): Promise<void> {
  const { supabase, user } = await requireAdmin()

  const { data: reply, error: replyError } = await supabase
    .from('defect_replies')
    .insert({
      defect_id: defectId,
      author_id: user.id,
      body,
    })
    .select('id')
    .single()

  if (replyError || !reply) throw new Error(replyError?.message ?? 'Failed to insert reply')

  if (photoFormData) {
    const file = photoFormData.get('file') as File | null
    if (file) {
      const adminClient = createAdminClient()
      const fileName = `${Date.now()}-${file.name}`
      const storagePath = `defects/${defectId}/replies/${fileName}`

      const arrayBuffer = await file.arrayBuffer()
      const buffer = new Uint8Array(arrayBuffer)

      const { error: uploadError } = await adminClient.storage
        .from('unit-files')
        .upload(storagePath, buffer, {
          contentType: file.type || 'image/jpeg',
          upsert: false,
        })

      if (uploadError) throw new Error(uploadError.message)

      const { error: attachError } = await supabase
        .from('defect_reply_attachments')
        .insert({
          reply_id: reply.id,
          storage_path: storagePath,
        })

      if (attachError) {
        await adminClient.storage.from('unit-files').remove([storagePath])
        throw new Error(attachError.message)
      }
    }
  }

  revalidatePath('/admin/defects')
  revalidatePath(`/admin/defects/${defectId}`)
}

export async function submitDefect(
  unitId: string,
  title: string,
  description: string,
  photoFormData?: FormData
): Promise<void> {
  const { supabase, user } = await requireOwner()

  const { data: ownership } = await supabase
    .from('unit_owners')
    .select('id')
    .eq('unit_id', unitId)
    .eq('user_id', user.id)
    .single()

  if (!ownership) {
    throw new Error('Forbidden: you do not own this unit')
  }

  const { data: defect, error: defectError } = await supabase
    .from('defects')
    .insert({
      unit_id: unitId,
      submitted_by: user.id,
      title,
      description,
      status: 'pateikta' as DefectStatus,
    })
    .select('id')
    .single()

  if (defectError || !defect) throw new Error(defectError?.message ?? 'Failed to submit defect')

  if (photoFormData) {
    const file = photoFormData.get('file') as File | null
    if (file) {
      const adminClient = createAdminClient()
      const fileName = `${Date.now()}-${file.name}`
      const storagePath = `defects/${defect.id}/${fileName}`

      const arrayBuffer = await file.arrayBuffer()
      const buffer = new Uint8Array(arrayBuffer)

      const { error: uploadError } = await adminClient.storage
        .from('unit-files')
        .upload(storagePath, buffer, {
          contentType: file.type || 'image/jpeg',
          upsert: false,
        })

      if (uploadError) throw new Error(uploadError.message)

      const { error: attachError } = await supabase
        .from('defect_attachments')
        .insert({
          defect_id: defect.id,
          storage_path: storagePath,
          uploaded_by: user.id,
        })

      if (attachError) {
        await adminClient.storage.from('unit-files').remove([storagePath])
        throw new Error(attachError.message)
      }
    }
  }

  revalidatePath('/portal/defects')
}
