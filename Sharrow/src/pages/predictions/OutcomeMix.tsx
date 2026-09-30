import { BarChart3 } from 'lucide-react'
import { ProgressBar, Surface } from '@/design/primitives'
import { OUTCOME_LABEL } from '../overview/overview-data'
import { OUTCOME_ORDER, type OutcomeCounts } from './predictions-data'

interface OutcomeMixProps {
  counts: OutcomeCounts
}

const BAR_TONE = {
  matched: 'pos',
  partial: 'warn',
  missed: 'neg',
  inconclusive: 'flow',
} as const

/** Verdict distribution across evaluated scenarios. */
export function OutcomeMix({ counts }: OutcomeMixProps) {
  return (
    <Surface level="base" radius="lg" className="p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">
          Outcome mix
        </span>
        <BarChart3 className="size-3.5 text-ink-3" aria-hidden="true" />
      </div>

      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
        {counts.total > 0 &&
          OUTCOME_ORDER.map((outcome) => {
            const share = (counts[outcome] / counts.total) * 100
            if (share === 0) return null
            const fill =
              outcome === 'matched'
                ? 'bg-pos'
                : outcome === 'partial'
                  ? 'bg-warn'
                  : outcome === 'missed'
                    ? 'bg-neg'
                    : 'bg-flow'
            return (
              <span
                key={outcome}
                className={fill}
                style={{ width: `${share}%` }}
              />
            )
          })}
      </div>

      <div className="mt-3 space-y-2">
        {OUTCOME_ORDER.map((outcome) => (
          <div key={outcome} className="flex items-center justify-between gap-3">
            <span className="text-xs text-ink-2">{OUTCOME_LABEL[outcome]}</span>
            <div className="flex items-center gap-3">
              <ProgressBar
                value={counts.total > 0 ? (counts[outcome] / counts.total) * 100 : 0}
                tone={BAR_TONE[outcome]}
                className="w-20"
                srLabel={`${OUTCOME_LABEL[outcome]} share of evaluated scenarios`}
                hideAria
              />
              <span className="num w-5 text-right text-xs text-ink">{counts[outcome]}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-2xs leading-relaxed text-ink-3">
        {counts.total} scenario{counts.total === 1 ? '' : 's'} evaluated — a sample, not a track
        record. Backtested results are labeled as such throughout.
      </p>
    </Surface>
  )
}
