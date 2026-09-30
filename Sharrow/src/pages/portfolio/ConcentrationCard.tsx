import { Layers } from 'lucide-react'
import { ProgressBar, Surface } from '@/design/primitives'
import { SECTOR_NAME } from '@/data/universe'
import type { SectorSlice } from './portfolio-data'
import type { Concentration } from './portfolio-data'

interface ConcentrationCardProps {
  concentration: Concentration
  topSector: SectorSlice | undefined
}

/** Position-level concentration: top holding, top-3 share, exposure count. */
export function ConcentrationCard({ concentration, topSector }: ConcentrationCardProps) {
  const top = concentration.top

  return (
    <Surface level="base" radius="lg" className="p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">
          Concentration
        </span>
        <Layers className="size-3.5 text-ink-3" aria-hidden="true" />
      </div>

      <div className="mt-3 space-y-3">
        <ProgressBar
          value={top?.weight ?? 0}
          tone={(top?.weight ?? 0) > 25 ? 'warn' : 'accent'}
          label="Largest position"
          valueLabel={top ? `${top.symbol} · ${top.weight.toFixed(1)}%` : '—'}
        />
        <ProgressBar
          value={concentration.top3Share}
          tone={concentration.top3Share > 60 ? 'warn' : 'accent'}
          label="Top 3 positions"
          valueLabel={`${concentration.top3Share.toFixed(0)}%`}
        />
        {topSector && (
          <ProgressBar
            value={topSector.share}
            tone={topSector.share > 40 ? 'warn' : 'accent'}
            label={`Largest sector · ${SECTOR_NAME[topSector.sector]}`}
            valueLabel={`${topSector.share.toFixed(0)}%`}
          />
        )}
      </div>

      <p className="mt-3 text-2xs leading-relaxed text-ink-3">
        {concentration.aboveTen} position{concentration.aboveTen === 1 ? '' : 's'} above 10% of
        value. Concentration raises both contribution and drawdown when that name moves — reads are
        simulated and recomputed each cycle.
      </p>
    </Surface>
  )
}
