'use client'

import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-semibold">Klaida</h1>
      {process.env.NODE_ENV === 'development' && (
        <p className="max-w-md text-sm text-muted-foreground">{error.message}</p>
      )}
      <Button variant="outline" onClick={reset}>
        Bandyti dar kartą
      </Button>
    </div>
  )
}
