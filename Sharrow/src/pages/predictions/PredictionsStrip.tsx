import type { ReactNode } from 'react'
import { Activity, BadgeCheck, GraduationCap, Target } from 'lucide-react'
import { Surface } from '@/design/primitives'

interface PredictionsStripProps {
  activeCount: number
  evaluatedCount: number
  matchPct: number | null
  matchSample: number
  learningCount: number
}

function StripCard({
  icon,
  label,
  value,
  sub,
  children,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  sub?: ReactNode
  children?: ReactNode
}) {
  return (
    <Surface level="base" radius="lg" className="p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">{label}</span>
        <span className="text-ink-3">{icon}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="num text-xl font-semibold tracking-[-0.01em] text-ink">{value}</span>
        {sub}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </Surface>
  )
}

/** Open scenarios, evaluated samples, strict match rate and learnings. */
export function PredictionsStrip({
  activeCount,
  evaluatedCount,
  matchPct,
  matchSample,
  learningCount,
}: PredictionsStripProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StripCard
        icon={<Target className="size-3.5" aria-hidden="true" />}
        label="Open scenarios"
        value={activeCount}
        sub={<span className="text-xs text-ink-3">tracked live</span>}
      />

      <StripCard
        icon={<Activity className="size-3.5" aria-hidden="true" />}
        label="Evaluated"
        value={evaluatedCount}
        sub={<span className="text-xs text-ink-3">backtested samples</span>}
      />

      <StripCard
        icon={<BadgeCheck className="size-3.5" aria-hidden="true" />}
        label="Match rate"
        value={matchPct === null ? '—' : `${matchPct}%`}
        sub={
          <span className="text-xs text-ink-3">
            {matchPct === null ? 'no conclusive sample' : `${matchMatched(matchPct, matchSample)}`}
          </span>
        }
      />

      <StripCard
        icon={<GraduationCap className="size-3.5" aria-hidden="true" />}
        label="Learnings"
        value={learningCount}
        sub={<span className="text-xs text-ink-3">produced from evaluations</span>}
      />
    </div>
  )
}

function matchMatched(pct: number, sample: number): string {
  const matched = Math.round((pct / 100) * sample)
  return `${matched} of ${sample} matched`
}
