import { useAIStore } from '@/store/ai-store'
import { Surface } from '@/design/primitives'
import { timeAgo } from '@/lib/format'
import { cn } from '@/lib/cn'

interface ActivityTimelineProps {
  limit?: number
  className?: string
}

const PRIORITY_DOT = ['bg-flow', 'bg-accent', 'bg-warn'] as const

/** The engine's own log — what it did, in order, with timestamps. */
export function ActivityTimeline({ limit = 8, className }: ActivityTimelineProps) {
  const events = useAIStore((s) => s.activity).slice(0, limit)

  return (
    <Surface level="base" radius="lg" className={cn('p-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">
          Engine activity
        </span>
        <span className="text-2xs text-ink-3">{events.length} recent</span>
      </div>

      {events.length === 0 ? (
        <p className="mt-3 text-xs text-ink-3">Activity appears as the observation cycle runs.</p>
      ) : (
        <ol className="mt-3 space-y-2.5">
          {events.map((e) => (
            <li key={e.id} className="flex items-start gap-2.5">
              <span
                className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', PRIORITY_DOT[e.priority])}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-xs font-medium text-ink-2">{e.title}</p>
                  <span className="shrink-0 text-2xs text-ink-3">{timeAgo(e.at)}</span>
                </div>
                {e.detail && <p className="mt-0.5 truncate text-2xs text-ink-3">{e.detail}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </Surface>
  )
}
