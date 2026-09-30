import { Link } from 'react-router-dom'
import { Newspaper } from 'lucide-react'
import { Badge, Button, EmptyState, ProvenanceBadge, SectionHeader, Surface } from '@/design/primitives'
import type { NewsItem } from '@/engine/types'
import { timeAgo } from '@/lib/format'
import { IMPACT_VARIANT, RELEVANCE_VARIANT, SENTIMENT_VARIANT, sectorNames } from './research-data'

interface NewsFeedProps {
  items: NewsItem[]
  /** Reference time — the latest feed tick. */
  now: number
  /** True when any filter is narrowing the set. */
  filtered: boolean
  onClearFilters: () => void
}

/** Contextualized news: sentiment, impact, relevance, affected assets, confidence. */
export function NewsFeed({ items, now, filtered, onClearFilters }: NewsFeedProps) {
  return (
    <Surface level="base" radius="lg" className="p-4">
      <SectionHeader
        title="News intelligence"
        context="Each item scored for sentiment, market impact, affected assets and relevance to what you hold."
        actions={<span className="text-2xs text-ink-3">{items.length} items</span>}
      />

      {items.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            size="sm"
            icon={<Newspaper className="size-5" aria-hidden="true" />}
            title={filtered ? 'No headlines match these filters' : 'No headlines in the window'}
            body={
              filtered
                ? 'Widen the search or clear the filters to see the full scored set.'
                : 'News intelligence refreshes with the simulated feed — every item arrives scored and labeled.'
            }
            action={
              filtered ? (
                <Button size="sm" variant="soft" onClick={onClearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map((n) => (
            <li
              key={n.id}
              className="rounded-md border border-line bg-surface-1 p-4 transition-colors hover:border-line-strong"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={SENTIMENT_VARIANT[n.sentiment]} size="sm">
                  {n.sentiment}
                </Badge>
                <Badge variant={IMPACT_VARIANT[n.marketImpact]} size="sm" shape="chip">
                  {n.marketImpact} impact
                </Badge>
                <Badge variant={RELEVANCE_VARIANT[n.portfolioRelevance]} size="sm" shape="chip">
                  {n.portfolioRelevance} to holdings
                </Badge>
                <ProvenanceBadge kind={n.provenance} bare />
                <span className="ml-auto text-2xs text-ink-3">{timeAgo(n.publishedAt, now)}</span>
              </div>

              <h3 className="mt-2 text-sm font-medium leading-snug text-ink">{n.headline}</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-3">{n.summary}</p>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <span className="font-mono text-2xs uppercase tracking-[0.1em] text-ink-3">
                    Affected
                  </span>
                  {n.affectedSymbols.map((s) => (
                    <Link
                      key={s}
                      to={`/asset/${s}`}
                      className="rounded-sm border border-line px-1.5 py-0.5 font-mono text-2xs text-ink-2 transition-colors hover:border-line-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      {s}
                    </Link>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {sectorNames(n.affectedSectors).map((name) => (
                    <Badge key={name} variant="solid" size="sm" shape="chip">
                      {name}
                    </Badge>
                  ))}
                </div>

                <div className="ml-auto flex items-center gap-3">
                  <span className="text-2xs text-ink-3">{n.source}</span>
                  <span className="text-2xs text-ink-3">
                    confidence <span className="num text-ink-2">{n.confidence}</span>
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Surface>
  )
}
