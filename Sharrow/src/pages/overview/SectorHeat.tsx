import { Surface } from '@/design/primitives'
import type { SectorPerformance } from '@/engine/cycle'
import { percent } from '@/lib/format'
import { cn } from '@/lib/cn'

interface SectorHeatProps {
  sectors: SectorPerformance[]
  className?: string
}

/** Session sector heat: diverging bars around a zero axis. */
export function SectorHeat({ sectors, className }: SectorHeatProps) {
  const scale = Math.max(...sectors.map((s) => Math.abs(s.changePct)), 1)

  return (
    <Surface level="base" radius="lg" className={cn('p-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">
          Sector heat
        </span>
        <span className="text-2xs text-ink-3">today</span>
      </div>

      <ul className="mt-3 space-y-2">
        {sectors.map((s) => {
          const magnitude = Math.min(Math.abs(s.changePct) / scale, 1) * 50
          const positive = s.changePct >= 0
          return (
            <li key={s.sector} className="grid grid-cols-[84px_1fr_56px] items-center gap-2.5">
              <span className="truncate text-2xs text-ink-2" title={s.name}>
                {s.name}
              </span>
              <span className="relative block h-1.5 overflow-hidden rounded-full bg-surface-3">
                <span className="absolute top-0 bottom-0 left-1/2 w-px bg-line-strong" aria-hidden="true" />
                <span
                  className={cn(
                    'absolute top-0 bottom-0 rounded-full',
                    positive ? 'left-1/2 bg-pos' : 'right-1/2 bg-neg',
                  )}
                  style={{ width: `${magnitude}%` }}
                  aria-hidden="true"
                />
              </span>
              <span
                className={cn(
                  'num text-right text-2xs',
                  positive ? 'text-pos' : 'text-neg',
                )}
              >
                {percent(s.changePct, 2)}
              </span>
            </li>
          )
        })}
      </ul>
    </Surface>
  )
}
