import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const storagePath = request.nextUrl.searchParams.get('path')

  if (!storagePath) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 })
  }

  if (user.user_metadata?.role !== 'admin') {
    // Derive unit_id from path (expected format: photos/{unitId}/... or documents/{unitId}/...)
    const segments = storagePath.split('/')
    const unitId = segments[1]

    if (!unitId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: ownership } = await supabase
      .from('unit_owners')
      .select('id')
      .eq('unit_id', unitId)
      .eq('user_id', user.id)
      .single()

    if (!ownership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const adminClient = createAdminClient()

  const { data: signedData, error: signedError } = await adminClient.storage
    .from('unit-files')
    .createSignedUrl(storagePath, 3600)

  if (signedError || !signedData?.signedUrl) {
    return NextResponse.json({ error: 'Could not generate preview URL' }, { status: 500 })
  }

  return NextResponse.redirect(signedData.signedUrl)
}
