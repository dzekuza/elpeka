import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DownloadSimple } from '@phosphor-icons/react/dist/ssr'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('lt-LT', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export default async function SutartysPage() {
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
  let documents: { id: string; name: string; category: string; created_at: string }[] = []

  if (unitId) {
    const { data } = await supabase
      .from('documents')
      .select('id, name, category, created_at')
      .eq('unit_id', unitId)
      .order('created_at', { ascending: false })
    documents = data ?? []
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Paslaugų sutartys</h1>
      {documents.length === 0 ? (
        <p className="text-muted-foreground text-sm py-10 text-center">Dokumentų kol kas nėra.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-medium">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">{doc.category}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(doc.created_at)}</span>
                    </div>
                  </div>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <a href={`/api/documents/${doc.id}/download`} target="_blank" rel="noopener noreferrer">
                    <DownloadSimple className="size-4 mr-1" />
                    Atsisiųsti
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
