import { ProgressBar, SectionHeader, Surface } from '@/design/primitives'
import type { Insight } from '@/engine/types'
import { INSIGHT_KIND_LABEL, mixTone, observationMix } from './intelligence-data'

interface ObservationMixCardProps {
  insights: Insight[]
}

/** Observation counts by kind — what the cycle spent its attention on. */
export function ObservationMixCard({ insights }: ObservationMixCardProps) {
  const mix = observationMix(insights)
  const max = mix.length > 0 ? Math.max(...mix.map((m) => m.count), 1) : 1

  return (
    <Surface level="base" radius="lg" className="p-4">
      <SectionHeader
        title="Observation mix"
        context="Reads by kind in the current cycle."
        actions={<span className="text-2xs text-ink-3">{insights.length} total</span>}
      />
      {mix.length === 0 ? (
        <p className="mt-3 text-2xs text-ink-3">No observations in this cycle yet.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {mix.map((m) => (
            <ProgressBar
              key={m.kind}
              value={m.count}
              max={max}
              label={INSIGHT_KIND_LABEL[m.kind]}
              valueLabel={String(m.count)}
              tone={mixTone(m.kind)}
            />
          ))}
        </div>
      )}
    </Surface>
  )
}
