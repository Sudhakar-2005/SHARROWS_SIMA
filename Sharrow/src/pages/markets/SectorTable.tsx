import { DataTable, type Column } from '@/design/primitives'
import type { SectorPerformance } from '@/engine/cycle'
import { SECTORS } from '@/data/universe'
import { percent } from '@/lib/format'
import { cn } from '@/lib/cn'

interface SectorTableProps {
  sectors: SectorPerformance[]
}

const RISK_BETA: Record<string, string> = Object.fromEntries(
  SECTORS.map((s) => [s.id, s.riskBeta]),
)

/** Session sector performance versus the benchmark, with per-sector leaders. */
export function SectorTable({ sectors }: SectorTableProps) {
  const scale = Math.max(...sectors.map((s) => Math.abs(s.changePct)), 1)

  const columns: Column<SectorPerformance>[] = [
    {
      id: 'sector',
      header: 'Sector',
      cell: (row) => (
        <div className="min-w-0">
          <div className="truncate text-xs font-medium text-ink">{row.name}</div>
          <div className="font-mono text-2xs uppercase tracking-[0.08em] text-ink-3">
            {RISK_BETA[row.sector] ?? '—'}
          </div>
        </div>
      ),
      sortable: true,
      sortValue: (row) => row.name,
    },
    {
      id: 'change',
      header: 'Session',
      align: 'right',
      width: '170px',
      cell: (row) => {
        const magnitude = (Math.min(Math.abs(row.changePct), scale) / scale) * 50
        const positive = row.changePct >= 0
        return (
          <div className="flex items-center justify-end gap-3">
            <span className="relative block h-1.5 w-16 overflow-hidden rounded-full bg-surface-3">
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
                'num w-16 text-right text-xs font-medium',
                positive ? 'text-pos' : 'text-neg',
              )}
            >
              {percent(row.changePct, 2)}
            </span>
          </div>
        )
      },
      sortable: true,
      sortValue: (row) => row.changePct,
    },
    {
      id: 'relative',
      header: 'Vs index',
      align: 'right',
      width: '96px',
      cell: (row) => (
        <span
          className={cn(
            'num text-xs',
            row.relativePct > 0 ? 'text-pos' : row.relativePct < 0 ? 'text-neg' : 'text-flow',
          )}
        >
          {percent(row.relativePct, 2)}
        </span>
      ),
      sortable: true,
      sortValue: (row) => row.relativePct,
    },
    {
      id: 'leader',
      header: 'Leader',
      align: 'right',
      cell: (row) => (
        <div className="text-right">
          <div className="text-xs font-medium text-ink">{row.leader.symbol}</div>
          <div
            className={cn(
              'num text-2xs',
              row.leader.changePct >= 0 ? 'text-pos' : 'text-neg',
            )}
          >
            {percent(row.leader.changePct, 2)}
          </div>
        </div>
      ),
      sortable: true,
      sortValue: (row) => row.leader.changePct,
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={sectors}
      getRowId={(row) => row.sector}
      caption="Sector performance this session"
      initialSort={{ columnId: 'change', direction: 'desc' }}
      dense
      className="border-0 bg-transparent"
    />
  )
}
