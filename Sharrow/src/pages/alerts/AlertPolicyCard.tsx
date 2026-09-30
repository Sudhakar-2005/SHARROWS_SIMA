import { SectionHeader, Surface } from '@/design/primitives'
import type { Alert, AlertPriority } from './alerts-data'
import { PRIORITY_LABEL, PRIORITY_VARIANT } from './alerts-data'

interface AlertPolicyCardProps {
  alerts: Alert[]
}

const MEANING: Record<AlertPriority, string> = {
  'high-risk': 'Act now — regime escalation, extreme concentration or a benchmark shock.',
  important: 'Review soon — conviction shifts, material news, evaluated misses.',
  informational: 'Context only — events ahead, validated learnings, confirmed outcomes.',
}

/** What each tier means and how many are currently open. */
export function AlertPolicyCard({ alerts }: AlertPolicyCardProps) {
  const tiers: AlertPriority[] = ['high-risk', 'important', 'informational']

  return (
    <Surface level="raised" radius="lg" className="p-4">
      <SectionHeader title="How alerts are raised" context="Three tiers, each with a job." />
      <ul className="mt-3 space-y-3">
        {tiers.map((p) => {
          const count = alerts.filter((a) => a.priority === p).length
          return (
            <li key={p} className="rounded-md border border-line bg-surface-1 p-3">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`font-mono text-2xs uppercase tracking-[0.1em] ${
                    PRIORITY_VARIANT[p] === 'neg'
                      ? 'text-neg'
                      : PRIORITY_VARIANT[p] === 'warn'
                        ? 'text-warn'
                        : 'text-flow'
                  }`}
                >
                  {PRIORITY_LABEL[p]}
                </span>
                <span className="num text-2xs text-ink-3">{count} open</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-ink-3">{MEANING[p]}</p>
            </li>
          )
        })}
      </ul>
      <p className="mt-4 border-t border-line pt-3 text-2xs leading-relaxed text-ink-3">
        Alerts are generated from the simulated engine and labeled — they explain state, never
        instruct a trade.
      </p>
    </Surface>
  )
}
