'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Contact, ContactDocument, ContactCategory } from '@/lib/types'
import { validateDocumentUpload, sanitizeFileName } from '@/lib/upload-validation'

const ContactSchema = z.object({
  category: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  company_name: z.string().max(200).nullable(),
  phone: z.string().max(50).nullable(),
  email: z.string().email().max(254).nullable(),
  description: z.string().max(2000).nullable(),
  footnote: z.string().max(1000).nullable(),
})

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  if (user.user_metadata?.role !== 'admin') throw new Error('Forbidden')
  return { supabase, user }
}

export async function createContact(data: {
  category: ContactCategory
  title: string
  company_name: string | null
  phone: string | null
  email: string | null
  description: string | null
  footnote: string | null
}): Promise<Contact> {
  const { supabase } = await requireAdmin()
  const parsed = ContactSchema.parse(data)

  const { data: contact, error } = await supabase
    .from('contacts')
    .insert(parsed)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/admin/contacts')
  return contact as Contact
}

export async function updateContact(
  id: string,
  data: {
    category: ContactCategory
    title: string
    company_name: string | null
    phone: string | null
    email: string | null
    description: string | null
    footnote: string | null
  }
): Promise<Contact> {
  const { supabase } = await requireAdmin()
  const parsed = ContactSchema.parse(data)

  const { data: contact, error } = await supabase
    .from('contacts')
    .update(parsed)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/admin/contacts')
  return contact as Contact
}

export async function deleteContact(id: string): Promise<void> {
  const { supabase } = await requireAdmin()
  const adminClient = createAdminClient()

  const { data: docs } = await supabase
    .from('contact_documents')
    .select('storage_path')
    .eq('contact_id', id)

  if (docs && docs.length > 0) {
    await adminClient.storage
      .from('unit-files')
      .remove(docs.map((d) => d.storage_path))
  }

  const { error } = await supabase.from('contacts').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/contacts')
}

export async function uploadContactDocument(
  contactId: string,
  formData: FormData
): Promise<ContactDocument> {
  const { supabase } = await requireAdmin()
  const adminClient = createAdminClient()

  const file = formData.get('file') as File | null
  if (!file) throw new Error('Trūksta failo')

  validateDocumentUpload(file)

  const fileName = `${Date.now()}-${sanitizeFileName(file.name)}`
  const storagePath = `contacts/${contactId}/${fileName}`
  const buffer = new Uint8Array(await file.arrayBuffer())

  const { error: uploadError } = await adminClient.storage
    .from('unit-files')
    .upload(storagePath, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (uploadError) throw new Error(uploadError.message)

  const { data: doc, error: dbError } = await supabase
    .from('contact_documents')
    .insert({ contact_id: contactId, name: file.name, storage_path: storagePath })
    .select()
    .single()

  if (dbError) {
    await adminClient.storage.from('unit-files').remove([storagePath])
    throw new Error(dbError.message)
  }

  revalidatePath('/admin/contacts')
  return doc as ContactDocument
}

export async function deleteContactDocument(
  id: string,
  storagePath: string
): Promise<void> {
  const { supabase } = await requireAdmin()
  const adminClient = createAdminClient()

  const { error: dbError } = await supabase
    .from('contact_documents')
    .delete()
    .eq('id', id)

  if (dbError) throw new Error(dbError.message)

  await adminClient.storage.from('unit-files').remove([storagePath])
  revalidatePath('/admin/contacts')
}

export async function assignContactToEstate(
  estateId: string,
  contactId: string
): Promise<void> {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('estate_contacts')
    .upsert({ estate_id: estateId, contact_id: contactId })

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/estates/${estateId}`)
}

export async function removeContactFromEstate(
  estateId: string,
  contactId: string
): Promise<void> {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('estate_contacts')
    .delete()
    .eq('estate_id', estateId)
    .eq('contact_id', contactId)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/estates/${estateId}`)
}
