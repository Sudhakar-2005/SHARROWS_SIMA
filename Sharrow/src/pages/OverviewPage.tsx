import { useEffect, useMemo } from 'react'
import { PageLayout } from '@/components/shell/PageLayout'
import {
  Button,
  ErrorState,
  ProvenanceBadge,
  SectionHeader,
  Skeleton,
  Surface,
} from '@/design/primitives'
import { Radar } from 'lucide-react'
import { useMarketStore } from '@/store/market-store'
import { useIntelligenceStore } from '@/store/intelligence-store'
import { computePortfolio } from '@/engine/cycle'
import { IntelligenceBrief } from './overview/IntelligenceBrief'
import { MetricStrip } from './overview/MetricStrip'
import { ConvictionTable } from './overview/ConvictionTable'
import { InsightStream } from './overview/InsightStream'
import { ScenarioFeed } from './overview/ScenarioFeed'
import { PortfolioCard } from './overview/PortfolioCard'
import { SectorHeat } from './overview/SectorHeat'
import { ActivityTimeline } from './overview/ActivityTimeline'
import { NewsBrief } from './overview/NewsBrief'

function OverviewSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Building your intelligence modules">
      <Skeleton className="h-40 w-full" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_var(--sh-rail-w)]">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    </div>
  )
}

export default function OverviewPage() {
  const status = useIntelligenceStore((s) => s.status)
  const error = useIntelligenceStore((s) => s.error)
  const snapshot = useIntelligenceStore((s) => s.snapshot)
  const analyses = useIntelligenceStore((s) => s.analyses)
  const insights = useIntelligenceStore((s) => s.insights)
  const predictions = useIntelligenceStore((s) => s.predictions)
  const cycleCount = useIntelligenceStore((s) => s.cycleCount)
  const lastCycleAt = useIntelligenceStore((s) => s.lastCycleAt)

  const quotes = useMarketStore((s) => s.quotes)
  const news = useMarketStore((s) => s.news)

  useEffect(() => {
    void useIntelligenceStore.getState().initialize()
  }, [])

  const analysisList = useMemo(() => Object.values(analyses), [analyses])
  const portfolio = useMemo(() => computePortfolio(quotes), [quotes])
  const topInsight = useMemo(
    () =>
      [...insights].sort(
        (a, b) =>
          ({ critical: 0, important: 1, informational: 2 })[a.importance] -
          ({ critical: 0, important: 1, informational: 2 })[b.importance],
      )[0],
    [insights],
  )

  const retry = () => {
    useIntelligenceStore.getState().reset()
    void useIntelligenceStore.getState().initialize()
  }

  return (
    <PageLayout
      eyebrow="Market command center"
      title="Overview"
      subtitle="Regime, conviction, scenarios and learning — every claim on this page carries its evidence and provenance."
      provenance="simulated"
      actions={
        <div className="flex items-center gap-3">
          <span className="hidden text-2xs text-ink-3 sm:inline">
            Cycle #{cycleCount || '—'}
          </span>
          <ProvenanceBadge kind="ai" />
        </div>
      }
      rail={
        status === 'ready' && snapshot && portfolio ? (
          <div className="space-y-4">
            <PortfolioCard summary={portfolio} benchmarkChangePct={snapshot.indexChangePct} />
            <SectorHeat sectors={snapshot.sectorPerformance} />
            <ActivityTimeline />
          </div>
        ) : undefined
      }
    >
      {status === 'error' ? (
        <ErrorState
          title="The intelligence cycle could not start"
          body={error ?? 'SHARROW could not assemble the overview. Market data itself may still be fine.'}
          onRetry={retry}
        />
      ) : status !== 'ready' || !snapshot ? (
        <OverviewSkeleton />
      ) : (
        <div className="space-y-4">
          <IntelligenceBrief
            regime={snapshot.regime.regime}
            regimeConfidence={snapshot.regime.confidence}
            compositeScore={snapshot.regime.score}
            breadth={snapshot.breadth}
            cycleCount={cycleCount}
            lastCycleAt={lastCycleAt}
            topInsight={topInsight}
          />

          <MetricStrip
            indexSymbol={snapshot.indexSymbol}
            indexQuote={quotes[snapshot.indexSymbol]}
            indexChangePct={snapshot.indexChangePct}
            breadth={snapshot.breadth}
            advancing={snapshot.advancing}
            total={snapshot.advancing + snapshot.declining + snapshot.unchanged}
            volatilityPct={snapshot.volatilityPct}
            volatilityBaselinePct={snapshot.volatilityBaselinePct}
            predictions={predictions}
          />

          <Surface level="base" radius="lg" className="p-4">
            <SectionHeader
              title="Signals radar"
              context="Highest one-sided conviction across the universe this cycle."
              actions={<ProvenanceBadge kind="derived" />}
            />
            <div className="mt-3">
              <ConvictionTable analyses={analysisList} />
            </div>
          </Surface>

          <div className="grid gap-4 xl:grid-cols-2">
            <Surface level="base" radius="lg" className="p-4">
              <SectionHeader
                title="Scenarios in motion"
                context="Conditional scenarios the engine is tracking and how resolved calls landed."
                actions={<ProvenanceBadge kind="ai" />}
              />
              <div className="mt-3">
                <ScenarioFeed predictions={predictions} />
              </div>
            </Surface>

            <Surface level="base" radius="lg" className="p-4">
              <SectionHeader
                title="What changed, and why"
                context="Ranked by importance with evidence, confidence and invalidation."
                actions={<ProvenanceBadge kind="ai" />}
              />
              <div className="mt-3">
                <InsightStream insights={insights} limit={4} />
              </div>
            </Surface>
          </div>

          <NewsBrief news={news} />

          <div className="flex items-center gap-2 pt-1">
            <Radar className="size-3.5 text-ink-3" aria-hidden="true" />
            <p className="text-2xs text-ink-3">
              Simulated market data for demonstration. SHARROW describes scenarios and observed
              patterns — it does not promise outcomes.
            </p>
            <Button variant="ghost" size="sm" onClick={() => useIntelligenceStore.getState().runCycle()}>
              Run cycle now
            </Button>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
