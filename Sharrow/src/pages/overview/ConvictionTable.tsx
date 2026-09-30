import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { Badge, DataTable, EmptyState, ProgressBar, type Column } from '@/design/primitives'
import type { AssetAnalysis } from '@/engine/cycle'
import { ASSET_BY_SYMBOL } from '@/data/universe'
import { DIRECTION_VARIANT } from './overview-data'
import { cn } from '@/lib/cn'

interface ConvictionTableProps {
  analyses: AssetAnalysis[]
  limit?: number
  caption?: string
}

type Row = AssetAnalysis

/** Ranked conviction across the universe — the engine's current book of interest. */
export function ConvictionTable({ analyses, limit = 8, caption = 'Assets ranked by conviction' }: ConvictionTableProps) {
  const navigate = useNavigate()

  const rows = useMemo(
    () =>
      [...analyses]
        .filter((a) => a.conviction.direction !== 'neutral')
        .sort((a, b) => b.conviction.score - a.conviction.score)
        .slice(0, limit),
    [analyses, limit],
  )

  const columns: Column<Row>[] = [
    {
      id: 'asset',
      header: 'Asset',
      cell: (row) => {
        const meta = ASSET_BY_SYMBOL[row.symbol]
        return (
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-medium text-ink">
              {row.symbol}
              <ArrowUpRight className="size-3 text-ink-3" aria-hidden="true" />
            </div>
            <div className="truncate text-2xs text-ink-3">{meta?.name ?? row.symbol}</div>
          </div>
        )
      },
    },
    {
      id: 'direction',
      header: 'Read',
      cell: (row) => (
        <Badge variant={DIRECTION_VARIANT[row.conviction.direction]} size="sm">
          {row.conviction.direction === 'neutral' ? 'Two-sided' : row.conviction.direction}
        </Badge>
      ),
    },
    {
      id: 'conviction',
      header: 'Conviction',
      align: 'right',
      width: '170px',
      cell: (row) => (
        <div className="flex items-center justify-end gap-3">
          <ProgressBar
            value={row.conviction.score}
            tone={DIRECTION_VARIANT[row.conviction.direction]}
            className="w-20"
            srLabel={`Conviction for ${row.symbol}`}
          />
          <span className="num w-8 text-right text-sm font-semibold text-ink">
            {row.conviction.score}
          </span>
        </div>
      ),
    },
    {
      id: 'lead',
      header: 'Lead evidence',
      cell: (row) => {
        // Prefer primary evidence (price/fundamental) over regime context,
        // so the column reads as distinct evidence rather than one repeated note.
        const lead =
          row.conviction.contributing.find((s) => s.kind !== 'context') ??
          row.conviction.contributing[0]
        const count = row.conviction.contributing.length
        const counter = row.conviction.counterSignals.length
        return (
          <div className="min-w-0">
            <p className="truncate text-xs text-ink-2">{lead?.title ?? 'No directional evidence'}</p>
            <p className={cn('mt-0.5 text-2xs text-ink-3')}>
              {count} supporting · {counter} counter
            </p>
          </div>
        )
      },
    },
  ]

  if (rows.length === 0) {
    return (
      <EmptyState
        size="sm"
        title="No directional conviction yet"
        body="The engine has not found one-sided evidence above its threshold this cycle. Two-sided readings are not forced into a call."
      />
    )
  }

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(row) => row.symbol}
      caption={caption}
      onRowClick={(row) => navigate(`/asset/${row.symbol}`)}
      initialSort={{ columnId: 'conviction', direction: 'desc' }}
      dense
      className="border-0 bg-transparent"
    />
  )
}
