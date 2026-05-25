'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { DefectStatus } from '@/lib/types'
import { Resend } from 'resend'
import { sanitizeFileName } from '@/lib/upload-validation'

const EXT_MIME: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.webm': 'video/webm',
}

function resolveContentType(file: File): string {
  const declared = file.type
  if (declared && declared !== 'application/octet-stream') return declared
  const ext = file.name.match(/(\.[^.]+)$/)?.[1]?.toLowerCase() ?? ''
  return EXT_MIME[ext] ?? declared
}

function isAllowedMediaFile(file: File): boolean {
  const type = resolveContentType(file)
  return type.startsWith('image/') || type.startsWith('video/')
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

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

async function requireOwner() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Unauthorized')
  }

  if (user.user_metadata?.role !== 'owner') {
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

  // REMOVED: owner no longer notified on status change per client request 2026-05-25

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
      if (!isAllowedMediaFile(file)) {
        throw new Error('Leistini tik vaizdo arba video failai')
      }
      if (file.size > 50 * 1024 * 1024) throw new Error('Failas per didelis (max 50MB)')
      const adminClient = createAdminClient()
      const fileName = `${Date.now()}-${sanitizeFileName(file.name)}`
      const storagePath = `defects/${defectId}/replies/${fileName}`

      const arrayBuffer = await file.arrayBuffer()
      const buffer = new Uint8Array(arrayBuffer)

      const { error: uploadError } = await adminClient.storage
        .from('unit-files')
        .upload(storagePath, buffer, {
          contentType: resolveContentType(file),
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
    const files = photoFormData.getAll('files') as File[]
    if (files.length > 0) {
      const MAX_SIZE = 50 * 1024 * 1024
      const adminClient = createAdminClient()
      const uploadedPaths: string[] = []

      for (const file of files) {
        if (!isAllowedMediaFile(file)) {
          throw new Error('Netinkamas failo formatas. Leistini: nuotraukos ir vaizdo įrašai.')
        }
        if (file.size > MAX_SIZE) throw new Error(`Failas "${file.name}" per didelis (maks. 50 MB)`)

        const fileName = `${Date.now()}-${sanitizeFileName(file.name)}`
        const storagePath = `defects/${defect.id}/${fileName}`

        const arrayBuffer = await file.arrayBuffer()
        const buffer = new Uint8Array(arrayBuffer)

        const { error: uploadError } = await adminClient.storage
          .from('unit-files')
          .upload(storagePath, buffer, {
            contentType: resolveContentType(file),
            upsert: false,
          })

        if (uploadError) {
          await adminClient.storage.from('unit-files').remove(uploadedPaths)
          throw new Error(uploadError.message)
        }

        uploadedPaths.push(storagePath)

        const { error: attachError } = await supabase
          .from('defect_attachments')
          .insert({
            defect_id: defect.id,
            storage_path: storagePath,
            uploaded_by: user.id,
          })

        if (attachError) {
          await adminClient.storage.from('unit-files').remove(uploadedPaths)
          throw new Error(attachError.message)
        }
      }
    }
  }

  // Notify admin about new defect — non-blocking
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://elpeka.vercel.app'
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'noreply@elpekas.lt',
      to: 'administracija@elpekas.lt',
      subject: `Naujas defektas: ${title}`,
      html: `
        <p>Pateiktas naujas defektas.</p>
        <p><strong>Pavadinimas:</strong> ${escapeHtml(title)}</p>
        <p><strong>Aprašymas:</strong> ${escapeHtml(description)}</p>
        <p><a href="${appUrl}/admin/defects/${defect.id}">Peržiūrėti defektą</a></p>
      `,
    })
  } catch (emailErr) {
    console.error('Failed to send admin defect notification:', emailErr)
  }

  revalidatePath('/portal/defektai')
}
