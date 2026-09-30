import { Link } from 'react-router-dom'
import { Badge, EmptyState, ProvenanceBadge, Surface } from '@/design/primitives'
import type { NewsItem } from '@/engine/types'
import { timeAgo } from '@/lib/format'
import { cn } from '@/lib/cn'

interface NewsBriefProps {
  news: NewsItem[]
  limit?: number
  className?: string
}

const SENTIMENT_VARIANT = {
  positive: 'pos',
  negative: 'neg',
  neutral: 'outline',
} as const

/** Headline intelligence with sentiment and provenance attached. */
export function NewsBrief({ news, limit = 5, className }: NewsBriefProps) {
  const rows = news.slice(0, limit)

  if (rows.length === 0) {
    return (
      <EmptyState size="sm" title="No headlines in the window" body="News intelligence refreshes with each data cycle." />
    )
  }

  return (
    <Surface level="base" radius="lg" className={cn('p-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">
          News intelligence
        </span>
        <Link
          to="/research"
          className="text-2xs font-medium text-accent transition-colors hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Research →
        </Link>
      </div>

      <ul className="mt-3 divide-y divide-line/70">
        {rows.map((n) => (
          <li key={n.id} className="py-2.5 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 text-xs font-medium leading-snug text-ink-2">{n.headline}</p>
              <Badge variant={SENTIMENT_VARIANT[n.sentiment]} size="sm" className="shrink-0">
                {n.sentiment}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-ink-3">
              <span>{n.source}</span>
              <span>{timeAgo(n.publishedAt)}</span>
              <span className="capitalize">impact: {n.marketImpact}</span>
              <ProvenanceBadge kind={n.provenance} bare />
            </div>
          </li>
        ))}
      </ul>
    </Surface>
  )
}
