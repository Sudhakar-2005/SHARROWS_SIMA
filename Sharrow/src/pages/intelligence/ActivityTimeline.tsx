import { EmptyState } from '@/design/primitives'
import type { ActivityEvent } from '@/engine/types'
import { timeAgo } from '@/lib/format'
import { ACTIVITY_LABEL, activityTone } from './intelligence-data'

interface ActivityTimelineProps {
  events: ActivityEvent[]
  /** Reference time — the latest intelligence cycle. */
  now: number
}

/** Recent engine activity, newest first, on a vertical rail. */
export function ActivityTimeline({ events, now }: ActivityTimelineProps) {
  if (events.length === 0) {
    return (
      <EmptyState
        size="sm"
        title="No engine activity yet"
        body="Every observation pass records what the engine observed, analyzed, generated and learned."
      />
    )
  }

  return (
    <ol className="relative ml-1 space-y-5 border-l border-line pl-5">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span
            className={`absolute -left-[23px] top-1.5 size-2 rounded-full ${activityTone(e.priority)}`}
            aria-hidden="true"
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-2xs uppercase tracking-[0.1em] text-accent">
              {ACTIVITY_LABEL[e.kind]}
            </span>
            <span className="text-2xs text-ink-3">{timeAgo(e.at, now)}</span>
            {e.priority >= 2 && (
              <span className="font-mono text-2xs uppercase tracking-[0.1em] text-neg">high</span>
            )}
          </div>
          <p className="mt-1 text-xs font-medium text-ink">{e.title}</p>
          {e.detail && <p className="mt-0.5 text-2xs leading-relaxed text-ink-3">{e.detail}</p>}
        </li>
      ))}
    </ol>
  )
}
