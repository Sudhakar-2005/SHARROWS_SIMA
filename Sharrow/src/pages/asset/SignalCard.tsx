import { Badge, ProgressBar, Tag } from '@/design/primitives'
import type { Signal } from '@/engine/types'
import { timeAgo } from '@/lib/format'
import { DIRECTION_LABEL, DIRECTION_VARIANT } from '../overview/overview-data'

interface SignalCardProps {
  signal: Signal
}

const KIND_LABEL: Record<Signal['kind'], string> = {
  technical: 'Technical',
  fundamental: 'Fundamental',
  news: 'News',
  context: 'Context',
  sentiment: 'Sentiment',
}

/** One engine signal with its evidence, strength and source. */
export function SignalCard({ signal }: SignalCardProps) {
  return (
    <div className="rounded-md border border-line bg-surface-2 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Badge variant={DIRECTION_VARIANT[signal.direction]} size="sm">
            {DIRECTION_LABEL[signal.direction]}
          </Badge>
          <Tag>{KIND_LABEL[signal.kind]}</Tag>
        </div>
        <span className="text-2xs text-ink-3">{signal.confidence}% confidence</span>
      </div>

      <p className="mt-2 text-sm font-medium leading-snug text-ink">{signal.title}</p>
      <p className="mt-1 text-xs leading-relaxed text-ink-2">{signal.summary}</p>

      {signal.evidence.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {signal.evidence.map((e) => (
            <Tag key={e.label} className="num">
              {e.label}: {e.value}
            </Tag>
          ))}
        </div>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <div className="flex items-center gap-2">
          <ProgressBar
            value={signal.strength * 100}
            tone={DIRECTION_VARIANT[signal.direction]}
            className="w-20"
            srLabel={`Strength of ${signal.title}`}
          />
          <span className="text-2xs text-ink-3">strength</span>
        </div>
        <span className="ml-auto truncate text-2xs text-ink-3">
          {signal.sources[0]?.label} · {timeAgo(signal.observedAt)}
        </span>
      </div>
    </div>
  )
}
