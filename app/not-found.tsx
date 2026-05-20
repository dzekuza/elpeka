import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <p className="text-8xl font-bold tracking-tight text-foreground">404</p>
      <h1 className="text-2xl font-semibold text-muted-foreground">Puslapis nerastas</h1>
      <Button asChild variant="outline">
        <Link href="/">Grįžti į pradžią</Link>
      </Button>
    </div>
  )
}
