'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { RegisterDefectTab } from '@/components/portal/register-defect-tab'
import { DefectCard, type EnrichedReply } from '@/components/portal/defect-card'
import type { DefectWithDetails, DefectStatus } from '@/lib/types'

type EnrichedDefect = Omit<DefectWithDetails, 'replies'> & {
  attachmentUrls: string[]
  replies: EnrichedReply[]
}

interface DefektaiTabsProps {
  unitId: string
  defects: EnrichedDefect[]
}

export function DefektaiTabs({ unitId, defects }: DefektaiTabsProps) {
  const [tab, setTab] = useState('register')

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="self-start">
        <TabsTrigger value="register">Registruoti defektą</TabsTrigger>
        <TabsTrigger value="track" badge={defects.length}>
          Sekti eigą
        </TabsTrigger>
      </TabsList>

      <TabsContent value="register">
        <RegisterDefectTab unitId={unitId} onSuccess={() => setTab('track')} />
      </TabsContent>

      <TabsContent value="track">
        {defects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <p className="text-muted-foreground text-sm">Kol kas defektų nėra.</p>
              <p className="text-muted-foreground text-xs">
                Pastebėję defektą, pereikite į &ldquo;Registruoti defektą&rdquo; kortelę.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {defects.map((defect) => (
              <DefectCard key={defect.id} defect={defect} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
