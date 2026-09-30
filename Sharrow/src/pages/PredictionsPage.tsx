import { useEffect, useMemo } from 'react'
import { PageLayout } from '@/components/shell/PageLayout'
import { ErrorState, ProvenanceBadge, Skeleton } from '@/design/primitives'
import { Target } from 'lucide-react'
import { useIntelligenceStore } from '@/store/intelligence-store'
import { PredictionsStrip } from './predictions/PredictionsStrip'
import { ActiveScenarios } from './predictions/ActiveScenarios'
import { EvaluationLedger } from './predictions/EvaluationLedger'
import { OutcomeMix } from './predictions/OutcomeMix'
import { LearningsList } from './predictions/LearningsList'
import {
  activePredictions,
  evaluatedPredictions,
  matchRate,
  outcomeCounts,
} from './predictions/predictions-data'

function PredictionsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading scenarios">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
      <Skeleton className="h-72 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

export default function PredictionsPage() {
  const status = useIntelligenceStore((s) => s.status)
  const error = useIntelligenceStore((s) => s.error)
  const snapshot = useIntelligenceStore((s) => s.snapshot)
  const predictions = useIntelligenceStore((s) => s.predictions)
  const learnings = useIntelligenceStore((s) => s.learnings)

  useEffect(() => {
    void useIntelligenceStore.getState().initialize()
  }, [])

  const active = useMemo(() => activePredictions(predictions), [predictions])
  const evaluated = useMemo(() => evaluatedPredictions(predictions), [predictions])
  const counts = useMemo(() => outcomeCounts(predictions), [predictions])
  const rate = useMemo(() => matchRate(counts), [counts])

  const retry = () => {
    useIntelligenceStore.getState().reset()
    void useIntelligenceStore.getState().initialize()
  }

  return (
    <PageLayout
      eyebrow="Predict · Track · Evaluate"
      title="Predictions"
      subtitle="Every prediction is a trackable object: created, active, resolved, evaluated, learned."
      provenance="simulated"
      actions={
        <div className="flex items-center gap-3">
          <span className="text-2xs text-ink-3">
            {evaluated.length} evaluated · {active.length} open
          </span>
          <ProvenanceBadge kind="backtest" />
        </div>
      }
      rail={
        status === 'ready' && snapshot ? (
          <div className="space-y-4">
            <OutcomeMix counts={counts} />
            <LearningsList learnings={learnings} now={snapshot.at} />
          </div>
        ) : undefined
      }
    >
      {status === 'error' ? (
        <ErrorState
          title="Scenario tracking could not start"
          body={error ?? 'The engine that frames and evaluates scenarios did not come up.'}
          onRetry={retry}
        />
      ) : status !== 'ready' || !snapshot ? (
        <PredictionsSkeleton />
      ) : (
        <div className="space-y-4">
          <PredictionsStrip
            activeCount={active.length}
            evaluatedCount={evaluated.length}
            matchPct={rate?.pct ?? null}
            matchSample={rate?.sample ?? 0}
            learningCount={learnings.length}
          />

          <ActiveScenarios predictions={active} now={snapshot.at} />

          <EvaluationLedger predictions={evaluated} now={snapshot.at} />

          <div className="flex items-center gap-2 pt-1">
            <Target className="size-3.5 text-ink-3" aria-hidden="true" />
            <p className="text-2xs text-ink-3">
              Scenarios are conditional and labeled — evaluated rows are backtests on simulated
              fixtures, never claims about live market outcomes.
            </p>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
