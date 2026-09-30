import { ProgressBar, SectionHeader, Surface } from '@/design/primitives'
import type { LearningStats } from './evolution-data'

interface LearningStatusCardProps {
  stats: LearningStats
}

const ROWS: { key: keyof LearningStats; label: string; tone: 'accent' | 'pos' | 'warn' | 'flow' }[] =
  [
    { key: 'validated', label: 'Validated', tone: 'accent' },
    { key: 'detected', label: 'Detected', tone: 'flow' },
    { key: 'proposed', label: 'Proposed', tone: 'warn' },
    { key: 'deployed', label: 'Deployed', tone: 'pos' },
  ]

/** Learnings by lifecycle status — detected → validated → deployed. */
export function LearningStatusCard({ stats }: LearningStatusCardProps) {
  const max = Math.max(stats.total, 1)

  return (
    <Surface level="base" radius="lg" className="p-4">
      <SectionHeader
        title="Learning lifecycle"
        context="Where learnings sit between detected and deployed."
        actions={<span className="text-2xs text-ink-3">{stats.total} total</span>}
      />
      {stats.total === 0 ? (
        <p className="mt-3 text-2xs text-ink-3">No learnings recorded yet.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {ROWS.map((r) => (
            <ProgressBar
              key={r.key}
              value={stats[r.key]}
              max={max}
              label={r.label}
              valueLabel={String(stats[r.key])}
              tone={r.tone}
            />
          ))}
        </div>
      )}
    </Surface>
  )
}
