import { useEffect, useMemo, useState } from 'react'
import { PageLayout } from '@/components/shell/PageLayout'
import { Button, ErrorState, ProvenanceBadge, Skeleton } from '@/design/primitives'
import { Briefcase, Sparkles } from 'lucide-react'
import { ScenarioList } from '@/components/domain/ScenarioList'
import { useIntelligenceStore } from '@/store/intelligence-store'
import { useMarketStore } from '@/store/market-store'
import { INDEX_SYMBOLS, SECTOR_NAME } from '@/data/universe'
import { computePortfolio } from '@/engine/cycle'
import { PortfolioStrip } from './portfolio/PortfolioStrip'
import { HoldingsTable } from './portfolio/HoldingsTable'
import { AllocationCard } from './portfolio/AllocationCard'
import { ContributorsCard } from './portfolio/ContributorsCard'
import { NarrativeCard } from './portfolio/NarrativeCard'
import { ConcentrationCard } from './portfolio/ConcentrationCard'
import {
  concentration,
  holdingRows,
  portfolioNarrative,
  portfolioTotals,
  sectorAllocation,
} from './portfolio/portfolio-data'

function PortfolioSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Evaluating portfolio">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-96 w-full" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}

export default function PortfolioPage() {
  const status = useIntelligenceStore((s) => s.status)
  const error = useIntelligenceStore((s) => s.error)
  const snapshot = useIntelligenceStore((s) => s.snapshot)
  const analyses = useIntelligenceStore((s) => s.analyses)
  const predictions = useIntelligenceStore((s) => s.predictions)

  const quotes = useMarketStore((s) => s.quotes)
  const [narrativeOpen, setNarrativeOpen] = useState(true)

  useEffect(() => {
    void useIntelligenceStore.getState().initialize()
  }, [])

  const rows = useMemo(() => holdingRows(quotes), [quotes])
  const totals = useMemo(() => portfolioTotals(rows), [rows])
  const slices = useMemo(() => sectorAllocation(rows), [rows])
  const conc = useMemo(() => concentration(rows), [rows])
  const summary = useMemo(() => computePortfolio(quotes), [quotes])

  const holdingSymbols = useMemo(() => rows.map((r) => r.symbol), [rows])
  const benchmarkChangePct = quotes[INDEX_SYMBOLS[0]]?.changePct ?? 0

  const narrative = useMemo(() => {
    if (!totals || slices.length === 0) return null
    return portfolioNarrative(
      totals,
      rows,
      benchmarkChangePct,
      slices[0].sector,
      Math.round(slices[0].share),
    )
  }, [totals, rows, benchmarkChangePct, slices])

  const retry = () => {
    useIntelligenceStore.getState().reset()
    void useIntelligenceStore.getState().initialize()
  }

  return (
    <PageLayout
      eyebrow="Understand"
      title="Portfolio Intelligence"
      subtitle="Not a holdings list — risk concentration, contributors, scenario analysis and why your portfolio moved."
      provenance="simulated"
      actions={
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="soft"
            aria-expanded={narrativeOpen}
            onClick={() => setNarrativeOpen((v) => !v)}
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            Why did my portfolio move?
          </Button>
          <ProvenanceBadge kind="derived" />
        </div>
      }
      rail={
        status === 'ready' && snapshot ? (
          <div className="space-y-4">
            <ConcentrationCard concentration={conc} topSector={slices[0]} />
            <ScenarioList
              predictions={predictions}
              symbols={holdingSymbols}
              now={snapshot.at}
              title="Scenarios on your holdings"
            />
          </div>
        ) : undefined
      }
    >
      {status === 'error' ? (
        <ErrorState
          title="Portfolio intelligence could not start"
          body={error ?? 'Holdings are intact — the engine read is unavailable.'}
          onRetry={retry}
        />
      ) : status !== 'ready' || !snapshot || !totals || !summary || !narrative ? (
        <PortfolioSkeleton />
      ) : (
        <div className="space-y-4">
          <PortfolioStrip
            totals={totals}
            benchmarkChangePct={benchmarkChangePct}
            topSector={slices.length > 0 ? SECTOR_NAME[slices[0].sector] : '—'}
            topSectorShare={slices.length > 0 ? Math.round(slices[0].share) : 0}
          />

          {narrativeOpen && <NarrativeCard narrative={narrative} />}

          <HoldingsTable quotes={quotes} analyses={analyses} />

          <div className="grid gap-4 xl:grid-cols-2">
            <AllocationCard slices={slices} />
            <ContributorsCard rows={rows} />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Briefcase className="size-3.5 text-ink-3" aria-hidden="true" />
            <p className="text-2xs text-ink-3">
              Holdings are simulated fixtures priced off the same feed as Markets — P&L, weights and
              reads update every cycle and are never presented as live broker data.
            </p>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
