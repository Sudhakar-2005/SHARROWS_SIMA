import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import {
  Badge,
  DataTable,
  EmptyState,
  Input,
  ProgressBar,
  SectionHeader,
  Surface,
  type Column,
} from '@/design/primitives'
import { StarToggle } from '@/components/domain/StarToggle'
import type { AssetAnalysis } from '@/engine/cycle'
import type { Quote } from '@/engine/types'
import { inr, plain, percent } from '@/lib/format'
import { DIRECTION_VARIANT } from '../overview/overview-data'
import { SECTOR_SHORT } from '../markets/markets-data'
import { holdingRows, rupeeSigned, valueTone, type HoldingRow } from './portfolio-data'

interface HoldingsTableProps {
  quotes: Record<string, Quote>
  analyses: Record<string, AssetAnalysis>
}

/** Simulated holdings with value, weight, P&L and engine read per position. */
export function HoldingsTable({ quotes, analyses }: HoldingsTableProps) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const allRows = useMemo(() => holdingRows(quotes), [quotes])
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allRows
    return allRows.filter(
      (r) => r.symbol.toLowerCase().includes(q) || r.name.toLowerCase().includes(q),
    )
  }, [allRows, query])

  const columns: Column<HoldingRow>[] = [
    {
      id: 'asset',
      header: 'Holding',
      cell: (row) => (
        <div className="min-w-0">
          <div className="font-medium text-ink">{row.symbol}</div>
          <div className="truncate text-2xs text-ink-3">
            {row.name} · {row.quantity} @ {plain(row.avgPrice, 0)}
          </div>
        </div>
      ),
      sortable: true,
      sortValue: (row) => row.symbol,
    },
    {
      id: 'sector',
      header: 'Sector',
      width: '96px',
      cell: (row) => (
        <Badge variant="outline" size="sm" shape="chip">
          {SECTOR_SHORT[row.sector]}
        </Badge>
      ),
      sortable: true,
      sortValue: (row) => row.sector,
    },
    {
      id: 'value',
      header: 'Value',
      align: 'right',
      width: '116px',
      cell: (row) => <span className="num text-xs text-ink">{inr(row.value, 0)}</span>,
      sortable: true,
      sortValue: (row) => row.value,
    },
    {
      id: 'weight',
      header: 'Weight',
      align: 'right',
      width: '150px',
      cell: (row) => (
        <div className="flex items-center justify-end gap-3">
          <ProgressBar
            value={row.weight}
            tone={row.weight > 25 ? 'warn' : 'accent'}
            className="w-16"
            srLabel={`Portfolio weight of ${row.symbol}`}
          />
          <span className="num w-9 text-right text-xs text-ink">{row.weight.toFixed(1)}%</span>
        </div>
      ),
      sortable: true,
      sortValue: (row) => row.weight,
    },
    {
      id: 'pnl',
      header: 'P&L',
      align: 'right',
      width: '140px',
      cell: (row) => (
        <div className="text-right">
          <div className={valueTone(row.pnl)}>{rupeeSigned(row.pnl)}</div>
          <div className={valueTone(row.pnlPct)}>{percent(row.pnlPct, 1)}</div>
        </div>
      ),
      sortable: true,
      sortValue: (row) => row.pnl,
    },
    {
      id: 'day',
      header: 'Today',
      align: 'right',
      width: '126px',
      cell: (row) => (
        <div className="text-right">
          <div className={valueTone(row.dayPnl)}>{rupeeSigned(row.dayPnl)}</div>
          <div className={valueTone(row.changePct)}>{percent(row.changePct, 2)}</div>
        </div>
      ),
      sortable: true,
      sortValue: (row) => row.dayPnl,
    },
    {
      id: 'read',
      header: 'Engine read',
      cell: (row) => {
        const analysis = analyses[row.symbol]
        if (!analysis) return <span className="text-2xs text-ink-3">—</span>
        return (
          <div className="min-w-0">
            <Badge variant={DIRECTION_VARIANT[analysis.conviction.direction]} size="sm">
              {analysis.conviction.direction === 'bullish'
                ? 'Upside'
                : analysis.conviction.direction === 'bearish'
                  ? 'Downside'
                  : 'Two-sided'}
            </Badge>
            <div className="mt-1 text-2xs text-ink-3">
              conviction {analysis.conviction.score}
            </div>
          </div>
        )
      },
      sortable: true,
      sortValue: (row) => analyses[row.symbol]?.conviction.score ?? -1,
    },
    {
      id: 'watch',
      header: '',
      width: '44px',
      align: 'right',
      cell: (row) => <StarToggle symbol={row.symbol} size="sm" />,
    },
  ]

  return (
    <Surface level="base" radius="lg" className="p-4">
      <SectionHeader
        title="Holdings"
        context="Simulated positions with value, weight, rupee P&L and the engine's current read."
        actions={
          <span className="text-2xs text-ink-3">
            {rows.length} of {allRows.length} positions
          </span>
        }
      />

      <div className="mt-3">
        <Input
          prefix={<Search className="size-3.5" aria-hidden="true" />}
          placeholder="Search holdings"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search holdings by symbol or name"
          className="w-full sm:w-64"
        />
      </div>

      <div className="mt-3">
        <DataTable
          columns={columns}
          rows={rows}
          getRowId={(row) => row.symbol}
          caption="Portfolio holdings with value, weight, P and L, and engine reads"
          onRowClick={(row) => navigate(`/asset/${row.symbol}`)}
          initialSort={{ columnId: 'value', direction: 'desc' }}
          dense
          className="border-0 bg-transparent"
          emptyState={
            <EmptyState
              size="sm"
              title="No holdings match"
              body="Adjust the search to see positions again."
            />
          }
        />
      </div>
    </Surface>
  )
}
