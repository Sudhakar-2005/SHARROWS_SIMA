import { useEffect, useMemo, useState } from 'react'
import { PageLayout } from '@/components/shell/PageLayout'
import { ErrorState, ProvenanceBadge, Skeleton } from '@/design/primitives'
import { useIntelligenceStore } from '@/store/intelligence-store'
import { useMarketStore } from '@/store/market-store'
import { NewsControls } from './research/NewsControls'
import { NewsFeed } from './research/NewsFeed'
import { NewsSourcesCard } from './research/NewsSourcesCard'
import { RelevanceMixCard } from './research/RelevanceMixCard'
import { ResearchStrip } from './research/ResearchStrip'
import {
  DEFAULT_FILTERS,
  type NewsFilters,
  filterNews,
  newsStats,
} from './research/research-data'

function ResearchSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading news intelligence">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

export default function ResearchPage() {
  const status = useIntelligenceStore((s) => s.status)
  const error = useIntelligenceStore((s) => s.error)
  const snapshot = useIntelligenceStore((s) => s.snapshot)
  const news = useMarketStore((s) => s.news)
  const lastTickAt = useMarketStore((s) => s.lastTickAt)

  const [filters, setFilters] = useState<NewsFilters>(DEFAULT_FILTERS)

  useEffect(() => {
    void useIntelligenceStore.getState().initialize()
  }, [])

  const rows = useMemo(() => filterNews(news, filters), [news, filters])
  const stats = useMemo(() => newsStats(rows), [rows])
  const filtered =
    filters.text !== '' || filters.impact !== 'all' || filters.relevance !== 'all'

  const now = lastTickAt ?? snapshot?.at ?? 0

  const retry = () => {
    useIntelligenceStore.getState().reset()
    void useIntelligenceStore.getState().initialize()
  }

  return (
    <PageLayout
      eyebrow="Context · Impact"
      title="Research"
      subtitle="News intelligence: context, market impact, affected assets and portfolio relevance — not a raw feed."
      provenance="simulated"
      actions={
        <div className="flex items-center gap-3">
          <span className="text-2xs text-ink-3">{news.length} headlines scored</span>
          <ProvenanceBadge kind="simulated" bare />
        </div>
      }
      rail={
        status === 'ready' && snapshot ? (
          <div className="space-y-4">
            <RelevanceMixCard items={rows} />
            <NewsSourcesCard items={rows} />
          </div>
        ) : undefined
      }
    >
      {status === 'error' ? (
        <ErrorState
          title="News intelligence could not start"
          body={error ?? 'The contextualizer that scores headlines did not come up.'}
          onRetry={retry}
        />
      ) : status !== 'ready' || !snapshot ? (
        <ResearchSkeleton />
      ) : (
        <div className="space-y-4">
          <ResearchStrip stats={stats} />
          <NewsControls
            filters={filters}
            shown={rows.length}
            total={news.length}
            onChange={setFilters}
          />
          <NewsFeed
            items={rows}
            now={now}
            filtered={filtered}
            onClearFilters={() => setFilters(DEFAULT_FILTERS)}
          />

          <div className="flex items-center gap-2 pt-1">
            <p className="text-2xs text-ink-3">
              Sentiment, impact and relevance scores are produced by the simulated engine and
              labeled on every item — context to weigh, never an instruction to trade.
            </p>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
