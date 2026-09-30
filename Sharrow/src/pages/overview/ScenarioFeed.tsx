import { Link } from 'react-router-dom'
import { Clock, ShieldAlert } from 'lucide-react'
import { Badge, EmptyState, Pill } from '@/design/primitives'
import type { Prediction } from '@/engine/types'
import { selectActive, selectEvaluated } from '@/store/intelligence-store'
import { timeAgo } from '@/lib/format'
import { DIRECTION_VARIANT, OUTCOME_VARIANT } from './overview-data'
import { cn } from '@/lib/cn'

interface ScenarioFeedProps {
  predictions: Prediction[]
  className?: string
}

function statusLabel(p: Prediction): string {
  if (p.status === 'evaluated' || p.status === 'learned') return 'Evaluated'
  if (p.status === 'resolved') return 'Resolved'
  return 'Active'
}

/** Live scenario board: what the engine is tracking and how resolved calls landed. */
export function ScenarioFeed({ predictions, className }: ScenarioFeedProps) {
  const active = selectActive(predictions).slice(0, 4)
  const resolved = selectEvaluated(predictions).slice(0, 3)

  if (active.length === 0 && resolved.length === 0) {
    return (
      <EmptyState
        size="sm"
        title="No scenarios open"
        body="Scenarios are raised only when conviction crosses the threshold. The engine will populate this board as one-sided evidence builds."
      />
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      <ul className="space-y-2">
        {active.map((p) => (
          <li
            key={p.id}
            className="rounded-md border border-line bg-surface-1 p-3.5 transition-colors hover:border-line-strong"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={DIRECTION_VARIANT[p.direction]} size="sm">
                    {p.symbol}
                  </Badge>
                  <span className="text-xs font-medium text-ink">{p.horizon}</span>
                  <Pill variant="outline" size="sm" className="font-mono">
                    {p.confidence}/100
                  </Pill>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-3 line-clamp-2">{p.scenario}</p>
              </div>
              <Badge variant="accent" size="sm" shape="chip" className="shrink-0 font-mono">
                {statusLabel(p)}
              </Badge>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs text-ink-3">
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" aria-hidden="true" />
                Opened {timeAgo(p.createdAt)}
              </span>
              {p.invalidationLevel !== undefined && (
                <span className="inline-flex items-center gap-1">
                  <ShieldAlert className="size-3" aria-hidden="true" />
                  Invalidation below {p.invalidationLevel.toFixed(2)}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>

      {resolved.length > 0 && (
        <div>
          <p className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">
            Recently evaluated
          </p>
          <ul className="mt-2 divide-y divide-line/70 rounded-md border border-line bg-surface-1">
            {resolved.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                <div className="min-w-0">
                  <span className="text-xs font-medium text-ink">{p.symbol}</span>
                  <span className="ml-2 text-2xs text-ink-3">{p.horizon}</span>
                  <p className="mt-0.5 truncate text-2xs text-ink-3">
                    {p.evaluation?.headline ?? p.actualNarrative ?? ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {p.outcome && (
                    <Badge variant={OUTCOME_VARIANT[p.outcome]} size="sm">
                      {p.outcome}
                    </Badge>
                  )}
                  <span className="num text-2xs text-ink-3">
                    {p.actualMovePct !== undefined ? `${p.actualMovePct > 0 ? '+' : ''}${p.actualMovePct.toFixed(1)}%` : '—'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        to="/predictions"
        className="inline-block text-xs font-medium text-accent transition-colors hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        All scenarios →
      </Link>
    </div>
  )
}
