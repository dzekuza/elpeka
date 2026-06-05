import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = { title: 'Nuotraukos | ELPEKAS' }
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import type { Document } from '@/lib/types'
import { PortalAnimateIn } from '@/components/portal/portal-animate-in'

interface PhotoWithUrl extends Document {
  signedUrl: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('lt-LT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function PhotoGrid({ photos }: { photos: PhotoWithUrl[] }) {
  const visible = photos.slice(0, 6)
  const rest = photos.length - 6

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {visible.map((photo, i) => (
        <a
          key={photo.id}
          href={photo.signedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative aspect-square overflow-hidden rounded-lg"
        >
          <Image
            src={photo.signedUrl}
            alt={photo.name}
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            className="object-cover hover:opacity-90 transition-opacity"
          />
          {i === 5 && rest > 0 && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
              <span className="text-lg font-semibold text-white">+{rest}</span>
            </div>
          )}
        </a>
      ))}
    </div>
  )
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
          <>
            <PhotoGrid photos={photos} />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{photos.length} nuotrauka(-ų)</span>
              {latest && <span>{formatDate(latest.created_at)}</span>}
            </div>
            {photos.length > 6 && (
              <p className="text-xs text-muted-foreground">
                Rodoma {Math.min(6, photos.length)} iš {photos.length}. Atidarykite nuotrauką, kad peržiūrėtumėte visas.
              </p>
            )}
          </>
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
          const { data } = await adminClient.storage
            .from('unit-files')
            .createSignedUrl(doc.storage_path, 3600)
          return { ...doc, signedUrl: data?.signedUrl ?? '' } as PhotoWithUrl
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
        description="Statybų eigos ir galutinės buto nuotraukos."
      />

      <PortalAnimateIn className="flex flex-col gap-8">
      <GallerySection
        title="Statybų eigos nuotraukos"
        subtitle="Nuotraukos fiksuojančios statybų eigą"
        photos={progressPhotos}
      />

      <GallerySection
        title="Galutinės buto nuotraukos"
        subtitle="Baigtų darbų ir galutinės būklės nuotraukos"
        photos={finalPhotos}
      />
      </PortalAnimateIn>
    </div>
  )
}
