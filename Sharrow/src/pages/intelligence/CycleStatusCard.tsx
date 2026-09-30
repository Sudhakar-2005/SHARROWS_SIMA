import type { ReactNode } from 'react'
import { Badge, SectionHeader, Surface } from '@/design/primitives'
import type { AIState } from '@/design/tokens'
import type { MarketRegime } from '@/engine/types'
import { timeAgo } from '@/lib/format'
import { AI_STATE_VARIANT } from './intelligence-data'
import { REGIME_LABEL, REGIME_VARIANT } from '../overview/overview-data'

interface CycleStatusCardProps {
  cycleCount: number
  lastCycleAt: number | null
  regime: MarketRegime
  aiState: AIState
  aiLabel: string
  /** Reference time — the latest intelligence cycle. */
  now: number
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-2xs text-ink-3">{label}</dt>
      <dd className="text-right text-xs font-medium text-ink">{children}</dd>
    </div>
  )
}

/** Where the intelligence loop is right now — state, cycles, regime, cadence. */
export function CycleStatusCard({
  cycleCount,
  lastCycleAt,
  regime,
  aiState,
  aiLabel,
  now,
}: CycleStatusCardProps) {
  return (
    <Surface level="base" radius="lg" className="p-4">
      <SectionHeader
        title="Cycle status"
        context="One observe → understand → analyze → generate pass."
      />
      <dl className="mt-3 space-y-2.5">
        <Row label="State">
          <Badge variant={AI_STATE_VARIANT[aiState]} size="sm" dot>
            {aiLabel}
          </Badge>
        </Row>
        <Row label="Cycles run">{cycleCount}</Row>
        <Row label="Last cycle">{lastCycleAt === null ? 'not run yet' : timeAgo(lastCycleAt, now)}</Row>
        <Row label="Regime">
          <Badge variant={REGIME_VARIANT[regime]} size="sm">
            {REGIME_LABEL[regime]}
          </Badge>
        </Row>
        <Row label="Cadence">every 20s</Row>
      </dl>
      <p className="mt-3 border-t border-line pt-3 text-2xs leading-relaxed text-ink-3">
        Cycles run on their own; the button on the header runs one immediately. Each pass refreshes
        conviction, observations, scenarios and learnings together.
      </p>
    </Surface>
  )
}
