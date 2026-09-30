import { CalendarClock } from 'lucide-react'
import { Badge, EmptyState, Surface, Tag } from '@/design/primitives'
import type { MarketEvent } from '@/engine/types'
import { KIND_LABEL, KIND_VARIANT, untilLabel } from '@/pages/markets/markets-data'

interface EventListProps {
  events: MarketEvent[]
  /** Only events naming at least one of these symbols are shown. */
  symbols: string[]
  /** Reference time — the latest intelligence cycle. */
  now: number
  title?: string
}

/** Upcoming calendar events filtered to a symbol set. */
export function EventList({ events, symbols, now, title = 'Ahead on your list' }: EventListProps) {
  const set = new Set(symbols)
  const upcoming = [...events]
    .filter((e) => e.date >= now && e.symbols.some((s) => set.has(s)))
    .sort((a, b) => a.date - b.date)
    .slice(0, 5)

  return (
    <Surface level="base" radius="lg" className="p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">{title}</span>
        <span className="text-2xs text-ink-3">next scheduled</span>
      </div>

      {upcoming.length === 0 ? (
        <EmptyState
          size="sm"
          icon={<CalendarClock className="size-5" aria-hidden="true" />}
          title="Nothing scheduled"
          body="No upcoming calendar event names these assets in the simulated session ahead."
        />
      ) : (
        <ul className="mt-3 space-y-3">
          {upcoming.map((e) => {
            const onList = e.symbols.filter((s) => set.has(s))
            return (
              <li key={e.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs leading-snug text-ink">{e.label}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {onList.slice(0, 3).map((s) => (
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
            )
          })}
        </ul>
      )}
    </Surface>
  )
}
