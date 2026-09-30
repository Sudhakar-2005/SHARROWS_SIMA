import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageLayout } from '@/components/shell/PageLayout'
import { Button, EmptyState, ErrorState, ProvenanceBadge, Skeleton } from '@/design/primitives'
import { Star } from 'lucide-react'
import { ScenarioList } from '@/components/domain/ScenarioList'
import { EventList } from '@/components/domain/EventList'
import { useIntelligenceStore } from '@/store/intelligence-store'
import { useMarketStore } from '@/store/market-store'
import { useWatchlistStore } from '@/store/watchlist-store'
import { WatchStrip } from './watchlist/WatchStrip'
import { WatchlistTable } from './watchlist/WatchlistTable'
import { ChangesFeed } from './watchlist/ChangesFeed'
import { watchFeed, watchStats } from './watchlist/watchlist-data'

function WatchlistSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading watched assets">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
      <Skeleton className="h-72 w-full" />
      <Skeleton className="h-56 w-full" />
    </div>
  )
}

export default function WatchlistPage() {
  const status = useIntelligenceStore((s) => s.status)
  const error = useIntelligenceStore((s) => s.error)
  const snapshot = useIntelligenceStore((s) => s.snapshot)
  const analyses = useIntelligenceStore((s) => s.analyses)
  const history = useIntelligenceStore((s) => s.history)
  const predictions = useIntelligenceStore((s) => s.predictions)

  const quotes = useMarketStore((s) => s.quotes)
  const events = useMarketStore((s) => s.events)

  const watched = useWatchlistStore((s) => s.symbols)

  useEffect(() => {
    void useIntelligenceStore.getState().initialize()
  }, [])

  const stats = useMemo(
    () => watchStats(watched, analyses, predictions),
    [watched, analyses, predictions],
  )
  const feed = useMemo(
    () => watchFeed(watched, history, predictions),
    [watched, history, predictions],
  )

  const add = (symbol: string) => useWatchlistStore.getState().add(symbol)

  const retry = () => {
    useIntelligenceStore.getState().reset()
    void useIntelligenceStore.getState().initialize()
  }

  return (
    <PageLayout
      eyebrow="Monitor"
      title="Watchlist"
      subtitle="Only meaningful changes — signal shifts, confidence moves and events worth your attention."
      provenance="simulated"
      actions={
        <div className="flex items-center gap-3">
          <span className="text-2xs text-ink-3">{watched.length} assets monitored</span>
          <ProvenanceBadge kind="derived" />
        </div>
      }
      rail={
        status === 'ready' && snapshot ? (
          <div className="space-y-4">
            <ScenarioList predictions={predictions} symbols={watched} now={snapshot.at} />
            <EventList events={events} symbols={watched} now={snapshot.at} />
          </div>
        ) : undefined
      }
    >
      {status === 'error' ? (
        <ErrorState
          title="Your watchlist could not start"
          body={error ?? 'The engine that powers watchlist reads did not come up.'}
          onRetry={retry}
        />
      ) : status !== 'ready' || !snapshot ? (
        <WatchlistSkeleton />
      ) : watched.length === 0 ? (
        <div className="rounded-md border border-line bg-surface-1">
          <EmptyState
            size="lg"
            icon={<Star className="size-5" aria-hidden="true" />}
            title="Nothing on the watchlist"
            body="Star assets from any screen — or add them from Markets — and their quotes, conviction and meaningful changes will stream here."
            action={
              <Link to="/markets">
                <Button size="sm">Browse markets</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          <WatchStrip stats={stats} />
          <WatchlistTable
            watched={watched}
            analyses={analyses}
            quotes={quotes}
            history={history}
            onAdd={add}
          />
          <ChangesFeed items={feed} now={snapshot.at} />

          <div className="flex items-center gap-2 pt-1">
            <Star className="size-3.5 text-ink-3" aria-hidden="true" />
            <p className="text-2xs text-ink-3">
              Your watchlist is stored on this device. Prices, conviction and reads are simulated
              and labeled — nothing here is a live market feed.
            </p>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
