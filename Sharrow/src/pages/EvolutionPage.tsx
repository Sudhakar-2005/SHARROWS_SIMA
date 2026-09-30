import { useEffect, useMemo } from 'react'
import { PageLayout } from '@/components/shell/PageLayout'
import { ErrorState, Skeleton } from '@/design/primitives'
import { Dna } from 'lucide-react'
import { ENGINE_VERSION } from '@/engine/learning'
import { useIntelligenceStore } from '@/store/intelligence-store'
import { EvolutionStrip } from './evolution/EvolutionStrip'
import { VersionTimeline } from './evolution/VersionTimeline'
import { CalibrationCard } from './evolution/CalibrationCard'
import { LearningLedger } from './evolution/LearningLedger'
import { EvolutionNarrative } from './evolution/EvolutionNarrative'
import { LearningStatusCard } from './evolution/LearningStatusCard'
import {
  calibrationBands,
  learningStats,
  learningTimeline,
  overallAccuracy,
  versionTimeline,
} from './evolution/evolution-data'

function EvolutionSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading evolution history">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-72 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  )
}

export default function EvolutionPage() {
  const status = useIntelligenceStore((s) => s.status)
  const error = useIntelligenceStore((s) => s.error)
  const snapshot = useIntelligenceStore((s) => s.snapshot)
  const versions = useIntelligenceStore((s) => s.versions)
  const learnings = useIntelligenceStore((s) => s.learnings)
  const predictions = useIntelligenceStore((s) => s.predictions)

  useEffect(() => {
    void useIntelligenceStore.getState().initialize()
  }, [])

  const orderedVersions = useMemo(() => versionTimeline(versions), [versions])
  const orderedLearnings = useMemo(() => learningTimeline(learnings), [learnings])
  const stats = useMemo(() => learningStats(learnings), [learnings])
  const bands = useMemo(() => calibrationBands(predictions), [predictions])
  const accuracy = useMemo(() => overallAccuracy(predictions), [predictions])
  const conclusive = useMemo(() => bands.reduce((sum, b) => sum + b.samples, 0), [bands])
  const deployed = useMemo(
    () => versions.filter((v) => v.status === 'deployed').length,
    [versions],
  )

  const retry = () => {
    useIntelligenceStore.getState().reset()
    void useIntelligenceStore.getState().initialize()
  }

  return (
    <PageLayout
      eyebrow="Evaluate · Learn · Improve"
      title="SHARROW Evolution"
      subtitle="Prediction accuracy, confidence calibration, learning events, validated improvements and the current intelligence version."
      provenance="ai"
      actions={
        <span className="num text-sm text-accent">SHARROW INTELLIGENCE {ENGINE_VERSION}</span>
      }
      rail={
        status === 'ready' && snapshot ? (
          <div className="space-y-4">
            <EvolutionNarrative />
            <LearningStatusCard stats={stats} />
          </div>
        ) : undefined
      }
    >
      {status === 'error' ? (
        <ErrorState
          title="Evolution history could not load"
          body={error ?? 'The records behind accuracy, learnings and versions did not come up.'}
          onRetry={retry}
        />
      ) : status !== 'ready' || !snapshot ? (
        <EvolutionSkeleton />
      ) : (
        <div className="space-y-4">
          <EvolutionStrip
            engineVersion={ENGINE_VERSION}
            accuracy={accuracy}
            learningCount={stats.total}
            validatedCount={stats.validated}
            deployedVersions={deployed}
          />

          <VersionTimeline versions={orderedVersions} now={snapshot.at} />

          <CalibrationCard bands={bands} totalSamples={conclusive} />

          <LearningLedger learnings={orderedLearnings} now={snapshot.at} />

          <div className="flex items-center gap-2 pt-1">
            <Dna className="size-3.5 text-ink-3" aria-hidden="true" />
            <p className="text-2xs text-ink-3">
              Accuracy and calibration are measured on simulated, backtested fixtures — labeled as
              such, never presented as live market performance.
            </p>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
