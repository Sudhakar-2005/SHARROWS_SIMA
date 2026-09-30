import { ProgressBar, SectionHeader, Surface } from '@/design/primitives'
import type { Alert, AlertPriority } from './alerts-data'
import { PRIORITY_LABEL } from './alerts-data'

interface PriorityMixCardProps {
  alerts: Alert[]
}

const ORDER: AlertPriority[] = ['high-risk', 'important', 'informational']

const TONE: Record<AlertPriority, 'neg' | 'warn' | 'flow'> = {
  'high-risk': 'neg',
  important: 'warn',
  informational: 'flow',
}

/** Share of the queue at each priority tier. */
export function PriorityMixCard({ alerts }: PriorityMixCardProps) {
  const total = Math.max(alerts.length, 1)

  return (
    <Surface level="raised" radius="lg" className="p-4">
      <SectionHeader
        title="Priority mix"
        context="How the current queue splits across the three tiers."
      />
      <div className="mt-3 space-y-3">
        {ORDER.map((p) => (
          <ProgressBar
            key={p}
            value={alerts.filter((a) => a.priority === p).length}
            max={total}
            label={PRIORITY_LABEL[p]}
            valueLabel={String(alerts.filter((a) => a.priority === p).length)}
            tone={TONE[p]}
          />
        ))}
      </div>
      <p className="mt-4 border-t border-line pt-3 text-2xs leading-relaxed text-ink-3">
        {alerts.length === 0
          ? 'Nothing is escalated in the current cycle — routine price moves are never raised here.'
          : `Escalation is deliberate: ${alerts.length} of ${alerts.length} item${alerts.length === 1 ? '' : 's'} above routine threshold.`}
      </p>
    </Surface>
  )
}
