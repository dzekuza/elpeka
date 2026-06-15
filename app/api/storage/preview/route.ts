import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateStoragePath } from '@/lib/upload-validation'
import { checkRateLimit } from '@/lib/ratelimit'

// Paths owned by a unit — prefix is folder name, segment[1] is the unitId
const UNIT_OWNED_PREFIXES = ['photos/', 'documents/', 'defects/']

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rateLimitResponse = await checkRateLimit(request, user.id)
  if (rateLimitResponse) return rateLimitResponse

  const storagePath = request.nextUrl.searchParams.get('path')

  if (!storagePath) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 })
  }

  // Reject path traversal and unknown prefixes before any further processing
  try {
    validateStoragePath(storagePath)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (user.user_metadata?.role !== 'admin') {
    const isUnitPath = UNIT_OWNED_PREFIXES.some((p) => storagePath.startsWith(p))

    if (!isUnitPath) {
      // contacts/ and estates/ paths are admin-only
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let unitId: string | null = null

    if (storagePath.startsWith('defects/')) {
      // defects/{defectId}/... — segment[1] is defectId, not unitId
      const defectId = storagePath.split('/')[1]
      if (!defectId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

      const { data: defect } = await supabase
        .from('defects')
        .select('unit_id')
        .eq('id', defectId)
        .maybeSingle()

      unitId = defect?.unit_id ?? null
    } else {
      // photos/{unitId}/... and documents/{unitId}/... — segment[1] is unitId
      unitId = storagePath.split('/')[1] ?? null
    }

    if (!unitId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: ownership } = await supabase
      .from('unit_owners')
      .select('id')
      .eq('unit_id', unitId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!ownership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const adminClient = createAdminClient()

  const { data: signedData, error: signedError } = await adminClient.storage
    .from('unit-files')
    .createSignedUrl(storagePath, 300)

  if (signedError || !signedData?.signedUrl) {
    return NextResponse.json({ error: 'Could not generate preview URL' }, { status: 500 })
  }

  return NextResponse.redirect(signedData.signedUrl)
}
