import { ArrowDownRight, ArrowUpRight, FlaskConical, Repeat } from 'lucide-react'
import { Badge, EmptyState, SectionHeader, Surface, Tag } from '@/design/primitives'
import { timeAgo } from '@/lib/format'
import { cn } from '@/lib/cn'
import { DIRECTION_LABEL, OUTCOME_LABEL, OUTCOME_VARIANT } from '../overview/overview-data'
import type { WatchFeedItem } from './watchlist-data'

interface ChangesFeedProps {
  items: WatchFeedItem[]
  /** Reference time — the latest intelligence cycle. */
  now: number
}

function Row({ item, now }: { item: WatchFeedItem; now: number }) {
  if (item.kind === 'flip') {
    const up = item.to === 'bullish'
    return (
      <li className="flex items-start justify-between gap-3 border-b border-line/70 py-2.5 last:border-0">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            className={cn(
              'mt-0.5 shrink-0 rounded-md p-1',
              up ? 'bg-pos-soft text-pos' : 'bg-neg-soft text-neg',
            )}
          >
            {up ? (
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            ) : (
              <ArrowDownRight className="size-3.5" aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-xs leading-snug text-ink">
              <span className="font-medium">{item.symbol}</span> read flipped{' '}
              {DIRECTION_LABEL[item.from].replace('-leaning', '')} →{' '}
              {DIRECTION_LABEL[item.to].replace('-leaning', '')}
            </p>
            <p className="mt-0.5 text-2xs text-ink-3">Direction changed on the latest cycle.</p>
          </div>
        </div>
        <span className="shrink-0 text-2xs text-ink-3">{timeAgo(item.at, now)}</span>
      </li>
    )
  }

  if (item.kind === 'shift') {
    const up = item.delta > 0
    return (
      <li className="flex items-start justify-between gap-3 border-b border-line/70 py-2.5 last:border-0">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            className={cn(
              'mt-0.5 shrink-0 rounded-md p-1',
              up ? 'bg-pos-soft text-pos' : 'bg-neg-soft text-neg',
            )}
          >
            {up ? (
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            ) : (
              <ArrowDownRight className="size-3.5" aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-xs leading-snug text-ink">
              <span className="font-medium">{item.symbol}</span> conviction moved{' '}
              <span className={up ? 'text-pos' : 'text-neg'}>
                {up ? '+' : ''}
                {item.delta}
              </span>{' '}
              to {item.score}
            </p>
            <p className="mt-0.5 text-2xs text-ink-3">Confidence shifted across the last cycle.</p>
          </div>
        </div>
        <span className="shrink-0 text-2xs text-ink-3">{timeAgo(item.at, now)}</span>
      </li>
    )
  }

  return (
    <li className="flex items-start justify-between gap-3 border-b border-line/70 py-2.5 last:border-0">
      <div className="flex min-w-0 items-start gap-2.5">
        <span className="mt-0.5 shrink-0 rounded-md bg-surface-3 p-1 text-ink-2">
          <FlaskConical className="size-3.5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Tag>{item.symbol}</Tag>
            {item.status === 'evaluated' && item.outcome ? (
              <Badge variant={OUTCOME_VARIANT[item.outcome]} size="sm" shape="chip">
                {OUTCOME_LABEL[item.outcome]}
              </Badge>
            ) : (
              <Badge variant="outline" size="sm" shape="chip">
                Opened
              </Badge>
            )}
            {item.status === 'evaluated' && (
              <span className="font-mono text-2xs uppercase tracking-[0.1em] text-ink-3">
                backtested
              </span>
            )}
          </div>
          <p className="mt-1 text-xs leading-snug text-ink">{item.headline}</p>
        </div>
      </div>
      <span className="shrink-0 text-2xs text-ink-3">{timeAgo(item.at, now)}</span>
    </li>
  )
}

/** Signal shifts, confidence moves and scenario status on monitored assets. */
export function ChangesFeed({ items, now }: ChangesFeedProps) {
  return (
    <Surface level="base" radius="lg" className="p-4">
      <SectionHeader
        title="Worth your attention"
        context="Read flips, conviction moves and scenario status on your monitored assets — newest first."
        actions={
          <span className="flex items-center gap-1.5 text-2xs text-ink-3">
            <Repeat className="size-3" aria-hidden="true" />
            this session
          </span>
        }
      />

      {items.length === 0 ? (
        <div className="mt-2">
          <EmptyState
            size="sm"
            icon={<Repeat className="size-5" aria-hidden="true" />}
            title="No shifts since the last cycle"
            body="Confidence moves and read flips appear here as cycles run — scenario status updates as well."
          />
        </div>
      ) : (
        <ul className="mt-2">
          {items.map((item) => (
            <Row key={item.id} item={item} now={now} />
          ))}
        </ul>
      )}
    </Surface>
  )
}
