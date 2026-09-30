import type { ReactNode } from 'react'
import { Eye, Gauge, Layers, ShieldAlert } from 'lucide-react'
import { Surface } from '@/design/primitives'

interface IntelligenceStripProps {
  observationCount: number
  avgConfidence: number | null
  cycleCount: number
  critical: number
}

function StripCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  sub: ReactNode
}) {
  return (
    <Surface level="base" radius="lg" className="p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">{label}</span>
        <span className="text-ink-3">{icon}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="num text-xl font-semibold tracking-[-0.01em] text-ink">{value}</span>
        <span className="text-xs text-ink-3">{sub}</span>
      </div>
    </Surface>
  )
}

/** Observations drafted, mean confidence, cycles run and critical reads. */
export function IntelligenceStrip({
  observationCount,
  avgConfidence,
  cycleCount,
  critical,
}: IntelligenceStripProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StripCard
        icon={<Eye className="size-3.5" aria-hidden="true" />}
        label="Observations"
        value={observationCount}
        sub="this cycle"
      />
      <StripCard
        icon={<Gauge className="size-3.5" aria-hidden="true" />}
        label="Avg confidence"
        value={avgConfidence === null ? '—' : `${avgConfidence}`}
        sub={avgConfidence === null ? 'no observations yet' : 'of 100, across reads'}
      />
      <StripCard
        icon={<Layers className="size-3.5" aria-hidden="true" />}
        label="Cycles run"
        value={cycleCount}
        sub="since launch"
      />
      <StripCard
        icon={<ShieldAlert className="size-3.5" aria-hidden="true" />}
        label="Critical"
        value={critical}
        sub={critical === 0 ? 'nothing critical' : critical === 1 ? 'needs attention' : 'need attention'}
      />
    </div>
  )
}
