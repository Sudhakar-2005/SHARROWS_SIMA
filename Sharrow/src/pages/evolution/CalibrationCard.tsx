import { LineChart } from 'lucide-react'
import { EmptyState, ProgressBar, SectionHeader, Surface } from '@/design/primitives'
import type { CalibrationBand } from './evolution-data'
import { hitTextTone, hitTone } from './evolution-data'

interface CalibrationCardProps {
  bands: CalibrationBand[]
  totalSamples: number
}

/** Observed hit rate by confidence band — what each score band actually delivered. */
export function CalibrationCard({ bands, totalSamples }: CalibrationCardProps) {
  return (
    <Surface level="base" radius="lg" className="p-4">
      <SectionHeader
        title="Confidence calibration"
        context="Observed hit rate by conviction band — matched outcomes over conclusive samples."
        actions={<span className="text-2xs text-ink-3">{totalSamples} conclusive</span>}
      />

      {bands.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            size="sm"
            icon={<LineChart className="size-5" aria-hidden="true" />}
            title="No calibrated bands yet"
            body="Bands populate once scenarios resolve with conclusive outcomes."
          />
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {bands.map((b) => (
            <div key={b.band}>
              <ProgressBar
                value={b.hitRate ?? 0}
                label={b.label}
                valueLabel={`${b.hitRate ?? 0}%`}
                tone={hitTone(b.hitRate)}
              />
              <div className="mt-1 flex items-center justify-between text-2xs">
                <span className="text-ink-3">
                  n={b.samples} · {b.matched} matched
                </span>
                <span className={hitTextTone(b.hitRate)}>
                  {b.hitRate === null
                    ? 'no sample'
                    : b.hitRate >= 60
                      ? 'held up in sample'
                      : b.hitRate >= 40
                        ? 'mixed in sample'
                        : 'weak in sample'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 border-t border-line pt-3 text-2xs leading-relaxed text-ink-3">
        Hit rate is matched ÷ conclusive samples in the band — partial and inconclusive outcomes are
        excluded, so the number only moves on clear results.
      </p>
    </Surface>
  )
}
