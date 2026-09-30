import { useEffect, useMemo } from 'react'
import { PageLayout } from '@/components/shell/PageLayout'
import {
  ErrorState,
  ProvenanceBadge,
  SectionHeader,
  Skeleton,
  Surface,
} from '@/design/primitives'
import { CandlestickChart } from 'lucide-react'
import { useMarketStore } from '@/store/market-store'
import { useIntelligenceStore } from '@/store/intelligence-store'
import { INDEX_SYMBOLS } from '@/data/universe'
import { IndexCards } from './markets/IndexCards'
import { BreadthPanel } from './markets/BreadthPanel'
import { RegimePanel } from './markets/RegimePanel'
import { SectorTable } from './markets/SectorTable'
import { UniverseTable } from './markets/UniverseTable'
import { MoversList } from './markets/MoversList'
import { EventsList } from './markets/EventsList'

function MarketsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Building market intelligence">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
      <Skeleton className="h-72 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

export default function MarketsPage() {
  const status = useIntelligenceStore((s) => s.status)
  const error = useIntelligenceStore((s) => s.error)
  const snapshot = useIntelligenceStore((s) => s.snapshot)
  const analyses = useIntelligenceStore((s) => s.analyses)
  const cycleCount = useIntelligenceStore((s) => s.cycleCount)

  const quotes = useMarketStore((s) => s.quotes)
  const events = useMarketStore((s) => s.events)

  useEffect(() => {
    void useIntelligenceStore.getState().initialize()
  }, [])

  const analysisList = useMemo(() => Object.values(analyses), [analyses])

  const retry = () => {
    useIntelligenceStore.getState().reset()
    void useIntelligenceStore.getState().initialize()
  }

  return (
    <PageLayout
      eyebrow="Observe · Understand"
      title="Markets"
      subtitle="Regime, breadth, sector rotation and the full simulated universe — every read carries its evidence and provenance."
      provenance="simulated"
      actions={
        <div className="flex items-center gap-3">
          <span className="hidden text-2xs text-ink-3 sm:inline">Cycle #{cycleCount || '—'}</span>
          <ProvenanceBadge kind="derived" />
        </div>
      }
      rail={
        status === 'ready' && snapshot ? (
          <div className="space-y-4">
            <MoversList quotes={quotes} />
            <EventsList events={events} now={snapshot.at} />
          </div>
        ) : undefined
      }
    >
      {status === 'error' ? (
        <ErrorState
          title="Market intelligence could not start"
          body={error ?? 'SHARROW could not assemble the markets view. The raw feed may still be fine.'}
          onRetry={retry}
        />
      ) : status !== 'ready' || !snapshot ? (
        <MarketsSkeleton />
      ) : (
        <div className="space-y-4">
          <IndexCards symbols={INDEX_SYMBOLS} quotes={quotes} />

          <div className="grid gap-4 xl:grid-cols-2">
            <BreadthPanel
              advancing={snapshot.advancing}
              declining={snapshot.declining}
              unchanged={snapshot.unchanged}
              breadth={snapshot.breadth}
              quotes={quotes}
              indexChangePct={snapshot.indexChangePct}
            />
            <RegimePanel assessment={snapshot.regime} />
          </div>

          <Surface level="base" radius="lg" className="p-4">
            <SectionHeader
              title="Sector rotation"
              context="Session change per sector versus the benchmark, with each sector's leading name."
              actions={<ProvenanceBadge kind="derived" />}
            />
            <div className="mt-3">
              <SectorTable sectors={snapshot.sectorPerformance} />
            </div>
          </Surface>

          <UniverseTable analyses={analysisList} quotes={quotes} />

          <div className="flex items-center gap-2 pt-1">
            <CandlestickChart className="size-3.5 text-ink-3" aria-hidden="true" />
            <p className="text-2xs text-ink-3">
              Simulated NSE session data for demonstration. Prices tick continuously and are not
              real market quotes.
            </p>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
