import type { ReactNode } from 'react'
import { BellRing, CircleAlert, Info, Siren } from 'lucide-react'
import { Surface } from '@/design/primitives'
import type { AlertPriority } from './alerts-data'

interface AlertStripProps {
  counts: Record<AlertPriority, number>
}

function StripCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  sub: ReactNode
  tone?: string
}) {
  return (
    <Surface level="base" radius="lg" className="p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">{label}</span>
        <span className={tone ?? 'text-ink-3'}>{icon}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={`num text-xl font-semibold tracking-[-0.01em] ${tone ?? 'text-ink'}`}>
          {value}
        </span>
        <span className="text-xs text-ink-3">{sub}</span>
      </div>
    </Surface>
  )
}

/** Needs-attention total plus the three priority tiers. */
export function AlertStrip({ counts }: AlertStripProps) {
  const attention = counts['high-risk'] + counts.important
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StripCard
        icon={<BellRing className="size-3.5" aria-hidden="true" />}
        label="Needs attention"
        value={attention}
        sub={attention === 1 ? 'review item' : 'review items'}
        tone={attention > 0 ? 'text-warn' : undefined}
      />
      <StripCard
        icon={<Siren className="size-3.5" aria-hidden="true" />}
        label="High risk"
        value={counts['high-risk']}
        sub="escalated now"
        tone={counts['high-risk'] > 0 ? 'text-neg' : undefined}
      />
      <StripCard
        icon={<CircleAlert className="size-3.5" aria-hidden="true" />}
        label="Important"
        value={counts.important}
        sub="worth a look"
        tone={counts.important > 0 ? 'text-warn' : undefined}
      />
      <StripCard
        icon={<Info className="size-3.5" aria-hidden="true" />}
        label="Informational"
        value={counts.informational}
        sub="context, no action"
      />
    </div>
  )
}
