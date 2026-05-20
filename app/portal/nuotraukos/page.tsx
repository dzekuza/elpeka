import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function NuotraukosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: ownership } = await supabase
    .from('unit_owners')
    .select('unit_id')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .maybeSingle()

  const unitId = ownership?.unit_id ?? null
  let photoUrls: string[] = []

  if (unitId) {
    const adminClient = createAdminClient()
    const { data: files } = await adminClient.storage
      .from('unit-files')
      .list(`photos/${unitId}`, { limit: 100 })

    if (files && files.length > 0) {
      const urls = await Promise.all(
        files.map(async (file) => {
          const { data } = await adminClient.storage
            .from('unit-files')
            .createSignedUrl(`photos/${unitId}/${file.name}`, 3600)
          return data?.signedUrl ?? ''
        })
      )
      photoUrls = urls.filter(Boolean)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Objekto nuotraukos</h1>
      {photoUrls.length === 0 ? (
        <p className="text-muted-foreground text-sm py-10 text-center">
          Nuotraukų kol kas nėra.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photoUrls.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Nuotrauka ${i + 1}`}
                className="aspect-square w-full rounded-md object-cover hover:opacity-90 transition-opacity"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
