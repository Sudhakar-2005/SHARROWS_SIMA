import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Badge, EmptyState, ProvenanceBadge } from '@/design/primitives'
import type { Insight } from '@/engine/types'
import { timeAgo } from '@/lib/format'
import { IMPORTANCE_VARIANT } from './overview-data'
import { cn } from '@/lib/cn'

interface InsightStreamProps {
  insights: Insight[]
  limit?: number
  className?: string
}

const IMPORTANCE_ORDER = { critical: 0, important: 1, informational: 2 } as const

/** Evidence-first insight feed: headline, why, how important, how sure, what changed. */
export function InsightStream({ insights, limit = 6, className }: InsightStreamProps) {
  const rows = [...insights]
    .sort((a, b) => IMPORTANCE_ORDER[a.importance] - IMPORTANCE_ORDER[b.importance])
    .slice(0, limit)

  if (rows.length === 0) {
    return (
      <EmptyState
        size="sm"
        title="No insights this cycle"
        body="Insights are drafted when the engine finds something worth surfacing with its evidence attached."
      />
    )
  }

  return (
    <ul className={cn('space-y-3', className)}>
      {rows.map((i) => (
        <li
          key={i.id}
          className="rounded-md border border-line bg-surface-1 p-4 transition-colors hover:border-line-strong"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={IMPORTANCE_VARIANT[i.importance]} size="sm" dot>
                  {i.importance}
                </Badge>
                <span className="font-mono text-2xs uppercase tracking-[0.1em] text-ink-3">
                  {i.kind}
                </span>
                <ProvenanceBadge kind={i.provenance} bare />
              </div>
              <h3 className="mt-2 text-sm font-medium leading-snug text-ink">{i.headline}</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-3">{i.why}</p>
            </div>
            <div className="shrink-0 text-right">
              <div className="num text-lg font-semibold text-ink">{i.confidence}</div>
              <div className="text-2xs text-ink-3">confidence</div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-2xs text-ink-3">
            <span>Changed: {i.changed}</span>
            {i.risk && <span className="text-warn">Risk: {i.risk}</span>}
            <span>{timeAgo(i.createdAt)}</span>
            {i.href && (
              <Link
                to={i.href}
                className="inline-flex items-center gap-1 font-medium text-accent transition-colors hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Evidence <ArrowRight className="size-3" aria-hidden="true" />
              </Link>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
