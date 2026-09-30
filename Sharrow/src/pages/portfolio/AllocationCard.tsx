import { ProgressBar, SectionHeader, Surface } from '@/design/primitives'
import { SECTOR_NAME } from '@/data/universe'
import { inr } from '@/lib/format'
import type { SectorSlice } from './portfolio-data'

interface AllocationCardProps {
  slices: SectorSlice[]
}

/** Sector allocation of current value with share bars. */
export function AllocationCard({ slices }: AllocationCardProps) {
  return (
    <Surface level="base" radius="lg" className="p-4">
      <SectionHeader
        title="Sector allocation"
        context="Share of current value per sector — concentration is risk you carry into every session."
        actions={<span className="text-2xs text-ink-3">{slices.length} sectors</span>}
      />

      <div className="mt-3 space-y-3">
        {slices.map((slice) => (
          <ProgressBar
            key={slice.sector}
            value={slice.share}
            tone={slice.share > 40 ? 'warn' : 'accent'}
            label={SECTOR_NAME[slice.sector]}
            valueLabel={`${inr(slice.value, 0)} · ${slice.share.toFixed(1)}%`}
            srLabel={`${SECTOR_NAME[slice.sector]} share of portfolio value`}
          />
        ))}
      </div>
    </Surface>
  )
}
