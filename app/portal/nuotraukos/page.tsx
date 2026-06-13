import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = { title: 'Nuotraukos | ELPEKAS' }
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Document } from '@/lib/types'
import { PortalAnimateIn } from '@/components/portal/portal-animate-in'
import { PhotoGallery } from '@/components/portal/photo-gallery'

interface PhotoWithUrl extends Document {
  thumbUrl: string
  fullUrl: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('lt-LT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function GallerySection({
  title,
  subtitle,
  photos,
}: {
  title: string
  subtitle: string
  photos: PhotoWithUrl[]
}) {
  const latest = photos[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {photos.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nuotraukų nėra</p>
        ) : (
          <PhotoGallery
            photos={photos}
            updatedLabel={latest ? `Atnaujinta ${formatDate(latest.created_at)}` : undefined}
          />
        )}
      </CardContent>
    </Card>
  )
}

export default async function NuotraukosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: ownership } = await supabase
    .from('unit_owners')
    .select('unit_id')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .maybeSingle()

  const unitId = ownership?.unit_id ?? null
  let progressPhotos: PhotoWithUrl[] = []
  let finalPhotos: PhotoWithUrl[] = []

  if (unitId) {
    const adminClient = createAdminClient()

    const { data: docs } = await supabase
      .from('documents')
      .select('*')
      .eq('unit_id', unitId)
      .eq('category', 'photo')
      .order('created_at', { ascending: false })

    if (docs && docs.length > 0) {
      const withUrls = await Promise.all(
        (docs as Document[]).map(async (doc) => {
          // Resize at the source so the browser/Next optimizer never has to
          // download multi-MB originals (the optimizer was timing out on them).
          const [thumb, full] = await Promise.all([
            adminClient.storage
              .from('unit-files')
              .createSignedUrl(doc.storage_path, 3600, { transform: { width: 500, quality: 60 } }),
            adminClient.storage
              .from('unit-files')
              .createSignedUrl(doc.storage_path, 3600, { transform: { width: 1440, quality: 75 } }),
          ])
          return {
            ...doc,
            thumbUrl: thumb.data?.signedUrl ?? '',
            fullUrl: full.data?.signedUrl ?? '',
          } as PhotoWithUrl
        })
      )

      progressPhotos = withUrls.filter((p) => p.photo_category === 'progress' || p.photo_category == null)
      finalPhotos = withUrls.filter((p) => p.photo_category === 'final')
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Objekto nuotraukos"
        description="Statybų eigos ir galutinės objekto nuotraukos."
      />

      <PortalAnimateIn className="flex flex-col gap-8">
        <GallerySection
          title="Statybų eigos nuotraukos"
          subtitle="Nuotraukos fiksuojančios statybų eigą"
          photos={progressPhotos}
        />

        <GallerySection
          title="Galutinės objekto nuotraukos"
          subtitle="Baigtų darbų ir galutinės būklės nuotraukos"
          photos={finalPhotos}
        />
      </PortalAnimateIn>
    </div>
  )
}
