import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const { data: document, error: docError } = await supabase
    .from('documents')
    .select('id, unit_id, storage_path, name')
    .eq('id', id)
    .single()

  if (docError || !document) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    const { data: ownership } = await supabase
      .from('unit_owners')
      .select('id')
      .eq('unit_id', document.unit_id)
      .eq('user_id', user.id)
      .single()

    if (!ownership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const adminClient = createAdminClient()

  const { data: signedData, error: signedError } = await adminClient.storage
    .from('unit-files')
    .createSignedUrl(document.storage_path, 3600)

  if (signedError || !signedData?.signedUrl) {
    return NextResponse.json({ error: 'Could not generate download URL' }, { status: 500 })
  }

  return NextResponse.redirect(signedData.signedUrl)
}
