import { GraduationCap } from 'lucide-react'
import { Badge, EmptyState, Surface, Tag } from '@/design/primitives'
import type { LearningEvent } from '@/engine/types'
import { timeAgo } from '@/lib/format'
import { LEARNING_STATUS_VARIANT } from '../evolution/evolution-data'

interface LearningsListProps {
  learnings: LearningEvent[]
  /** Reference time — the latest intelligence cycle. */
  now: number
}

/** Learnings produced from evaluations — preview; Evolution holds the full story. */
export function LearningsList({ learnings, now }: LearningsListProps) {
  const recent = [...learnings].sort((a, b) => b.detectedAt - a.detectedAt).slice(0, 4)

  return (
    <Surface level="base" radius="lg" className="p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">
          Learnings produced
        </span>
        <span className="text-2xs text-ink-3">{learnings.length} total</span>
      </div>

      {recent.length === 0 ? (
        <EmptyState
          size="sm"
          icon={<GraduationCap className="size-5" aria-hidden="true" />}
          title="No learnings yet"
          body="Evaluations feed the learning loop — patterns, calibration fixes and regime behavior appear here as evidence accumulates."
        />
      ) : (
        <ul className="mt-3 space-y-3">
          {recent.map((l) => (
            <li key={l.id} className="border-b border-line/70 pb-3 last:border-0 last:pb-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs leading-snug text-ink">{l.title}</p>
                <Badge variant={LEARNING_STATUS_VARIANT[l.status]} size="sm" shape="chip">
                  {l.status}
                </Badge>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Tag>n={l.sampleSize}</Tag>
                {l.effectSize !== undefined && <Tag>effect {l.effectSize.toFixed(2)}</Tag>}
                <span className="text-2xs text-ink-3">{timeAgo(l.detectedAt, now)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Surface>
  )
}
