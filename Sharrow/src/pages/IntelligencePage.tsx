import { useEffect, useMemo } from 'react'
import { PageLayout } from '@/components/shell/PageLayout'
import { Button, ErrorState, SectionHeader, Skeleton, Surface } from '@/design/primitives'
import { RefreshCw, Sparkles } from 'lucide-react'
import { timeAgo } from '@/lib/format'
import { useAIStore } from '@/store/ai-store'
import { useIntelligenceStore } from '@/store/intelligence-store'
import { ActivityTimeline } from './intelligence/ActivityTimeline'
import { CycleStatusCard } from './intelligence/CycleStatusCard'
import { IntelligenceStrip } from './intelligence/IntelligenceStrip'
import { ObservationFeed } from './intelligence/ObservationFeed'
import { ObservationMixCard } from './intelligence/ObservationMixCard'
import { SourcesCard } from './intelligence/SourcesCard'
import {
  averageConfidence,
  criticalCount,
  observations,
} from './intelligence/intelligence-data'

function IntelligenceSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading observations">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export default function IntelligencePage() {
  const status = useIntelligenceStore((s) => s.status)
  const error = useIntelligenceStore((s) => s.error)
  const snapshot = useIntelligenceStore((s) => s.snapshot)
  const insights = useIntelligenceStore((s) => s.insights)
  const activity = useIntelligenceStore((s) => s.activity)
  const cycleCount = useIntelligenceStore((s) => s.cycleCount)
  const lastCycleAt = useIntelligenceStore((s) => s.lastCycleAt)
  const aiState = useAIStore((s) => s.state)
  const aiLabel = useAIStore((s) => s.label)

  useEffect(() => {
    void useIntelligenceStore.getState().initialize()
  }, [])

  const ordered = useMemo(() => observations(insights), [insights])
  const avg = useMemo(() => averageConfidence(insights), [insights])
  const critical = useMemo(() => criticalCount(insights), [insights])

  const retry = () => {
    useIntelligenceStore.getState().reset()
    void useIntelligenceStore.getState().initialize()
  }

  const runCycle = () => useIntelligenceStore.getState().runCycle()

  return (
    <PageLayout
      eyebrow="Observe · Understand · Explain"
      title="Intelligence"
      subtitle="Structured observations with what, why, importance, confidence and what changed."
      provenance="ai"
      actions={
        <div className="flex items-center gap-3">
          {snapshot && (
            <span className="text-2xs text-ink-3">
              {cycleCount} {cycleCount === 1 ? 'cycle' : 'cycles'}
              {lastCycleAt !== null && ` · last ${timeAgo(lastCycleAt, snapshot.at)}`}
            </span>
          )}
          <Button size="sm" variant="soft" onClick={runCycle} disabled={status !== 'ready'}>
            <RefreshCw className="size-3.5" aria-hidden="true" strokeWidth={2.25} />
            Run cycle
          </Button>
        </div>
      }
      rail={
        status === 'ready' && snapshot ? (
          <div className="space-y-4">
            <CycleStatusCard
              cycleCount={cycleCount}
              lastCycleAt={lastCycleAt}
              regime={snapshot.regime.regime}
              aiState={aiState}
              aiLabel={aiLabel}
              now={snapshot.at}
            />
            <ObservationMixCard insights={insights} />
            <SourcesCard insights={insights} />
          </div>
        ) : undefined
      }
    >
      {status === 'error' ? (
        <ErrorState
          title="The observation cycle could not start"
          body={error ?? 'The engine that observes, analyzes and drafts observations did not come up.'}
          onRetry={retry}
        />
      ) : status !== 'ready' || !snapshot ? (
        <IntelligenceSkeleton />
      ) : (
        <div className="space-y-4">
          <IntelligenceStrip
            observationCount={insights.length}
            avgConfidence={avg}
            cycleCount={cycleCount}
            critical={critical}
          />

          <ObservationFeed insights={ordered} now={snapshot.at} />

          <Surface level="base" radius="lg" className="p-4">
            <SectionHeader
              title="Engine activity"
              context="What the loop observed, generated and learned — newest first."
              actions={<span className="text-2xs text-ink-3">{activity.length} events</span>}
            />
            <div className="mt-4">
              <ActivityTimeline events={activity} now={snapshot.at} />
            </div>
          </Surface>

          <div className="flex items-center gap-2 pt-1">
            <Sparkles className="size-3.5 text-ink-3" aria-hidden="true" />
            <p className="text-2xs text-ink-3">
              Observations are engine-authored reads of simulated and historical inputs — every one
              carries its evidence, confidence and what would invalidate it.
            </p>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
