import { Badge, EmptyState, SectionHeader, Surface, Tag } from '@/design/primitives'
import type { NewsItem } from '@/engine/types'
import { timeAgo } from '@/lib/format'
import { cn } from '@/lib/cn'

interface AssetNewsProps {
  news: NewsItem[]
}

const SENTIMENT_VARIANT = {
  positive: 'pos',
  negative: 'neg',
  neutral: 'flow',
} as const

/** Headlines that name this symbol, newest first. */
export function AssetNews({ news }: AssetNewsProps) {
  const items = [...news].sort((a, b) => b.publishedAt - a.publishedAt)

  return (
    <Surface level="base" radius="lg" className="p-4">
      <SectionHeader
        title="News flow"
        context="Simulated headlines naming this symbol, with sentiment and impact."
        actions={<span className="text-2xs text-ink-3">{items.length} {items.length === 1 ? 'item' : 'items'}</span>}
      />
      {items.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            size="sm"
            title="No headlines on this symbol"
            body="Nothing in the simulated newswire names this asset right now. News signals stay neutral until flow arrives."
          />
        </div>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map((n) => (
            <li key={n.id} className="border-b border-line/70 pb-3 last:border-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={SENTIMENT_VARIANT[n.sentiment]} size="sm">
                  {n.sentiment}
                </Badge>
                <span className="truncate text-2xs text-ink-3">{n.source}</span>
                <span className="ml-auto shrink-0 text-2xs text-ink-3">
                  {timeAgo(n.publishedAt)}
                </span>
              </div>
              <p className="mt-1.5 text-sm font-medium leading-snug text-ink">{n.headline}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-2">{n.summary}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                <Tag>impact: {n.marketImpact}</Tag>
                <Tag>relevance: {n.portfolioRelevance}</Tag>
                <Tag className={cn('num')}>confidence {n.confidence}%</Tag>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Surface>
  )
}
