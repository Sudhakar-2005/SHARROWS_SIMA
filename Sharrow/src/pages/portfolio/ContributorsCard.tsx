import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { EmptyState, SectionHeader, Surface } from '@/design/primitives'
import { dayDrivers, rupeeSigned, valueTone, type HoldingRow } from './portfolio-data'
import { percent } from '@/lib/format'
import { cn } from '@/lib/cn'

interface ContributorsCardProps {
  rows: HoldingRow[]
}

function DriverRow({ row }: { row: HoldingRow }) {
  const up = row.dayPnl >= 0
  return (
    <li className="flex items-center justify-between gap-3 border-b border-line/70 py-2 last:border-0">
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className={cn(
            'shrink-0 rounded-md p-1',
            up ? 'bg-pos-soft text-pos' : 'bg-neg-soft text-neg',
          )}
        >
          {up ? (
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          ) : (
            <ArrowDownRight className="size-3.5" aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0">
          <p className="font-medium text-ink">{row.symbol}</p>
          <p className="truncate text-2xs text-ink-3">{row.name}</p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className={valueTone(row.dayPnl)}>{rupeeSigned(row.dayPnl)}</p>
        <p className={valueTone(row.changePct)}>{percent(row.changePct, 2)}</p>
      </div>
    </li>
  )
}

/** What moved the needle today — rupee contribution per position. */
export function ContributorsCard({ rows }: ContributorsCardProps) {
  const gainers = dayDrivers(rows, 'gain')
  const losers = dayDrivers(rows, 'loss')

  return (
    <Surface level="base" radius="lg" className="p-4">
      <SectionHeader
        title="What moved the needle"
        context="Rupee contribution of each position to today's session, simulated feed."
        actions={<span className="text-2xs text-ink-3">today</span>}
      />

      {gainers.length === 0 && losers.length === 0 ? (
        <div className="mt-2">
          <EmptyState
            size="sm"
            title="Flat session"
            body="No holding has moved enough to register as a contributor or drag in this session."
          />
        </div>
      ) : (
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">Contributors</p>
            <ul className="mt-1">
              {gainers.length > 0 ? (
                gainers.map((row) => <DriverRow key={row.symbol} row={row} />)
              ) : (
                <li className="py-2 text-2xs text-ink-3">No position is up today.</li>
              )}
            </ul>
          </div>
          <div>
            <p className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">Drags</p>
            <ul className="mt-1">
              {losers.length > 0 ? (
                losers.map((row) => <DriverRow key={row.symbol} row={row} />)
              ) : (
                <li className="py-2 text-2xs text-ink-3">No position is down today.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </Surface>
  )
}
