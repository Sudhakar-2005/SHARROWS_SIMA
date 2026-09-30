import { Badge, EmptyState, Surface, Tag } from '@/design/primitives'
import type { MarketEvent } from '@/engine/types'
import { KIND_LABEL, KIND_VARIANT, untilLabel } from './markets-data'

interface EventsListProps {
  events: MarketEvent[]
  /** Reference time — the latest intelligence cycle. */
  now: number
}

/** Scheduled market events ahead of the last cycle (simulated calendar). */
export function EventsList({ events, now }: EventsListProps) {
  const upcoming = [...events]
    .filter((e) => e.date >= now)
    .sort((a, b) => a.date - b.date)
    .slice(0, 5)

  return (
    <Surface level="base" radius="lg" className="p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">
          Event calendar
        </span>
        <span className="text-2xs text-ink-3">next scheduled</span>
      </div>

      {upcoming.length === 0 ? (
        <EmptyState
          size="sm"
          title="No events ahead"
          body="Nothing is scheduled on the simulated calendar after the latest cycle."
        />
      ) : (
        <ul className="mt-3 space-y-3">
          {upcoming.map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs leading-snug text-ink">{e.label}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {e.symbols.slice(0, 3).map((s) => (
                    <Tag key={s}>{s}</Tag>
                  ))}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <Badge variant={KIND_VARIANT[e.kind]} size="sm" shape="chip">
                  {KIND_LABEL[e.kind]}
                </Badge>
                <p className="mt-1 text-2xs text-ink-3">{untilLabel(e.date, now)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Surface>
  )
}
