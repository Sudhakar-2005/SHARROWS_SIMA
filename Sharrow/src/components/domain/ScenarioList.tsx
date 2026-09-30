import { Link } from 'react-router-dom'
import { FlaskConical } from 'lucide-react'
import { Badge, EmptyState, Surface, Tag } from '@/design/primitives'
import type { Prediction } from '@/engine/types'
import { timeAgo } from '@/lib/format'
import { DIRECTION_VARIANT } from '@/pages/overview/overview-data'

interface ScenarioListProps {
  predictions: Prediction[]
  /** Only scenarios on these symbols are shown. */
  symbols: string[]
  /** Reference time — the latest intelligence cycle. */
  now: number
  title?: string
}

const DIRECTION_CHIP = {
  bullish: 'Upside',
  bearish: 'Downside',
  neutral: 'Two-sided',
} as const

/** Open scenarios filtered to a symbol set (watchlist, holdings…). */
export function ScenarioList({ predictions, symbols, now, title = 'Scenarios on your list' }: ScenarioListProps) {
  const set = new Set(symbols)
  const active = predictions
    .filter((p) => set.has(p.symbol) && (p.status === 'active' || p.status === 'created') && !p.evaluation)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5)

  return (
    <Surface level="base" radius="lg" className="p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">{title}</span>
        <span className="text-2xs text-ink-3">{active.length} open</span>
      </div>

      {active.length === 0 ? (
        <EmptyState
          size="sm"
          icon={<FlaskConical className="size-5" aria-hidden="true" />}
          title="No open scenarios"
          body="The engine frames scenarios when directional evidence clears its threshold — nothing is open on these names right now."
        />
      ) : (
        <ul className="mt-3 space-y-3">
          {active.map((p) => (
            <li key={p.id}>
              <Link
                to={`/asset/${p.symbol}`}
                className="-m-1 block rounded-md p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Tag>{p.symbol}</Tag>
                      <Badge variant={DIRECTION_VARIANT[p.direction]} size="sm">
                        {DIRECTION_CHIP[p.direction]}
                      </Badge>
                    </div>
                    <p className="mt-1.5 truncate text-xs text-ink">{p.title}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-2xs text-ink-3">{p.horizon}</p>
                    <p className="mt-1 text-2xs text-ink-3">{timeAgo(p.createdAt, now)}</p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Surface>
  )
}
