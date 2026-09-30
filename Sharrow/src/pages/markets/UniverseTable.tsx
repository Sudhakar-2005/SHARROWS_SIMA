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
  Select,
  Surface,
  type Column,
} from '@/design/primitives'
import type { AssetAnalysis } from '@/engine/cycle'
import type { Quote, SignalDirection } from '@/engine/types'
import { ASSET_BY_SYMBOL } from '@/data/universe'
import { plain, percent } from '@/lib/format'
import { SECTOR_FILTER_OPTIONS, SECTOR_SHORT } from './markets-data'
import { DIRECTION_VARIANT } from '../overview/overview-data'

interface UniverseTableProps {
  analyses: AssetAnalysis[]
  quotes: Record<string, Quote>
}

const DIRECTION_CHIP: Record<SignalDirection, string> = {
  bullish: 'Upside',
  bearish: 'Downside',
  neutral: 'Two-sided',
}

/** Full simulated equity universe with filters and engine reads. */
export function UniverseTable({ analyses, quotes }: UniverseTableProps) {
  const [query, setQuery] = useState('')
  const [sector, setSector] = useState('all')
  const navigate = useNavigate()

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return analyses.filter((a) => {
      if (sector !== 'all' && a.sector !== sector) return false
      if (!q) return true
      const meta = ASSET_BY_SYMBOL[a.symbol]
      return (
        a.symbol.toLowerCase().includes(q) || (meta?.name.toLowerCase().includes(q) ?? false)
      )
    })
  }, [analyses, query, sector])

  const columns: Column<AssetAnalysis>[] = [
    {
      id: 'asset',
      header: 'Asset',
      cell: (row) => {
        const meta = ASSET_BY_SYMBOL[row.symbol]
        return (
          <div className="min-w-0">
            <div className="font-medium text-ink">{row.symbol}</div>
            <div className="truncate text-2xs text-ink-3">{meta?.name ?? row.symbol}</div>
          </div>
        )
      },
      sortable: true,
      sortValue: (row) => row.symbol,
    },
    {
      id: 'sector',
      header: 'Sector',
      width: '104px',
      cell: (row) => (
        <Badge variant="outline" size="sm" shape="chip">
          {SECTOR_SHORT[row.sector]}
        </Badge>
      ),
      sortable: true,
      sortValue: (row) => row.sector,
    },
    {
      id: 'last',
      header: 'Last',
      align: 'right',
      width: '110px',
      cell: (row) => {
        const quote = quotes[row.symbol]
        return (
          <span className="num text-xs text-ink">{quote ? plain(quote.price, 2) : '—'}</span>
        )
      },
      sortable: true,
      sortValue: (row) => quotes[row.symbol]?.price ?? 0,
    },
    {
      id: 'change',
      header: 'Change',
      align: 'right',
      width: '96px',
      cell: (row) => {
        const quote = quotes[row.symbol]
        const pct = quote?.changePct ?? 0
        return (
          <span
            className={
              pct > 0 ? 'num text-xs text-pos' : pct < 0 ? 'num text-xs text-neg' : 'num text-xs text-flow'
            }
          >
            {quote ? percent(pct, 2) : '—'}
          </span>
        )
      },
      sortable: true,
      sortValue: (row) => quotes[row.symbol]?.changePct ?? 0,
    },
    {
      id: 'conviction',
      header: 'Conviction',
      align: 'right',
      width: '158px',
      cell: (row) => (
        <div className="flex items-center justify-end gap-3">
          <ProgressBar
            value={row.conviction.score}
            tone={DIRECTION_VARIANT[row.conviction.direction]}
            className="w-16"
            srLabel={`Conviction for ${row.symbol}`}
          />
          <span className="num w-7 text-right text-xs font-semibold text-ink">
            {row.conviction.score}
          </span>
        </div>
      ),
      sortable: true,
      sortValue: (row) => row.conviction.score,
    },
    {
      id: 'read',
      header: 'Engine read',
      cell: (row) => (
        <div className="min-w-0">
          <Badge variant={DIRECTION_VARIANT[row.conviction.direction]} size="sm">
            {DIRECTION_CHIP[row.conviction.direction]}
          </Badge>
          <div className="mt-1 text-2xs text-ink-3">
            {row.conviction.contributing.length} support · {row.conviction.counterSignals.length}{' '}
            counter
          </div>
        </div>
      ),
    },
  ]

  return (
    <Surface level="base" radius="lg" className="p-4">
      <SectionHeader
        title="Equity universe"
        context="Every simulated NSE equity with session change, engine read and conviction for this cycle."
        actions={
          <span className="text-2xs text-ink-3">
            {rows.length} of {analyses.length} equities
          </span>
        }
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Input
          prefix={<Search className="size-3.5" aria-hidden="true" />}
          placeholder="Search symbol or company"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search equities by symbol or company name"
          className="w-full sm:w-64"
        />
        <Select
          options={SECTOR_FILTER_OPTIONS}
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          aria-label="Filter equities by sector"
          className="w-full sm:w-48"
        />
      </div>

      <div className="mt-3">
        <DataTable
          columns={columns}
          rows={rows}
          getRowId={(row) => row.symbol}
          caption="Simulated equity universe with engine conviction"
          onRowClick={(row) => navigate(`/asset/${row.symbol}`)}
          initialSort={{ columnId: 'conviction', direction: 'desc' }}
          dense
          className="border-0 bg-transparent"
          emptyState={
            <EmptyState
              size="sm"
              title="No equities match"
              body="Adjust the search text or sector filter to widen the universe again."
            />
          }
        />
      </div>
    </Surface>
  )
}
