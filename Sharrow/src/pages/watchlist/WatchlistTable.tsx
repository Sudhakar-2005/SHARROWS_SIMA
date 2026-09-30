import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
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
import { StarToggle } from '@/components/domain/StarToggle'
import type { AssetAnalysis } from '@/engine/cycle'
import type { Quote, SignalDirection } from '@/engine/types'
import type { ConvictionPoint } from '@/store/intelligence-store'
import { ASSET_BY_SYMBOL, EQUITY_SYMBOLS, INDEX_SYMBOLS } from '@/data/universe'
import { getDailySeries, withLiveTail } from '@/services/market-data'
import { plain, percent } from '@/lib/format'
import { Sparkline } from '@/components/charts/Sparkline'
import { DIRECTION_VARIANT } from '../overview/overview-data'
import { SECTOR_SHORT } from '../markets/markets-data'
import { convictionShift, deltaTone } from './watchlist-data'

interface WatchlistTableProps {
  watched: string[]
  analyses: Record<string, AssetAnalysis>
  quotes: Record<string, Quote>
  history: Record<string, ConvictionPoint[]>
  onAdd: (symbol: string) => void
}

const DIRECTION_CHIP: Record<SignalDirection, string> = {
  bullish: 'Upside',
  bearish: 'Downside',
  neutral: 'Two-sided',
}

/** Monitored assets with live quotes, conviction shifts and engine reads. */
export function WatchlistTable({ watched, analyses, quotes, history, onAdd }: WatchlistTableProps) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const addOptions = useMemo(() => {
    const set = new Set(watched)
    return [...EQUITY_SYMBOLS, ...INDEX_SYMBOLS]
      .filter((s) => !set.has(s))
      .map((s) => ({ value: s, label: `${s} · ${ASSET_BY_SYMBOL[s]?.name ?? s}` }))
  }, [watched])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return watched
    return watched.filter((s) => {
      const meta = ASSET_BY_SYMBOL[s]
      return s.toLowerCase().includes(q) || (meta?.name.toLowerCase().includes(q) ?? false)
    })
  }, [watched, query])

  const columns: Column<string>[] = [
    {
      id: 'asset',
      header: 'Asset',
      cell: (symbol) => {
        const meta = ASSET_BY_SYMBOL[symbol]
        const analysis = analyses[symbol]
        return (
          <div className="min-w-0">
            <div className="font-medium text-ink">{symbol}</div>
            <div className="truncate text-2xs text-ink-3">
              {meta?.name ?? symbol}
              {analysis ? ` · ${SECTOR_SHORT[analysis.sector]}` : ' · index'}
            </div>
          </div>
        )
      },
      sortable: true,
      sortValue: (symbol) => symbol,
    },
    {
      id: 'last',
      header: 'Last',
      align: 'right',
      width: '104px',
      cell: (symbol) => {
        const quote = quotes[symbol]
        return (
          <span className="num text-xs text-ink">{quote ? plain(quote.price, 2) : '—'}</span>
        )
      },
      sortable: true,
      sortValue: (symbol) => quotes[symbol]?.price ?? 0,
    },
    {
      id: 'change',
      header: 'Change',
      align: 'right',
      width: '92px',
      cell: (symbol) => {
        const quote = quotes[symbol]
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
      sortValue: (symbol) => quotes[symbol]?.changePct ?? 0,
    },
    {
      id: 'trend',
      header: '20 sessions',
      width: '104px',
      cell: (symbol) => {
        const closes = withLiveTail(symbol, getDailySeries(symbol))
          .slice(-20)
          .map((c) => c.c)
        const up = closes[closes.length - 1] >= closes[0]
        return (
          <Sparkline
            values={closes}
            height={24}
            tone={up ? 'pos' : 'neg'}
            ariaLabel={`${symbol} 20-session closing trend, ${up ? 'up' : 'down'} overall`}
          />
        )
      },
    },
    {
      id: 'conviction',
      header: 'Conviction',
      align: 'right',
      width: '158px',
      cell: (symbol) => {
        const analysis = analyses[symbol]
        if (!analysis) return <span className="text-2xs text-ink-3">—</span>
        return (
          <div className="flex items-center justify-end gap-3">
            <ProgressBar
              value={analysis.conviction.score}
              tone={DIRECTION_VARIANT[analysis.conviction.direction]}
              className="w-16"
              srLabel={`Conviction for ${symbol}`}
            />
            <span className="num w-7 text-right text-xs font-semibold text-ink">
              {analysis.conviction.score}
            </span>
          </div>
        )
      },
      sortable: true,
      sortValue: (symbol) => analyses[symbol]?.conviction.score ?? -1,
    },
    {
      id: 'shift',
      header: 'Shift',
      align: 'right',
      width: '84px',
      cell: (symbol) => {
        const delta = convictionShift(history[symbol])
        if (delta === null) {
          return <span className="text-2xs text-ink-3" aria-label="No prior cycle to compare">·</span>
        }
        return (
          <span className={deltaTone(delta)} aria-label={`Conviction moved ${delta >= 0 ? 'up' : 'down'} ${Math.abs(delta)} points since the previous cycle`}>
            {delta > 0 ? '+' : ''}
            {delta}
          </span>
        )
      },
      sortable: true,
      sortValue: (symbol) => convictionShift(history[symbol]) ?? -999,
    },
    {
      id: 'read',
      header: 'Engine read',
      cell: (symbol) => {
        const analysis = analyses[symbol]
        if (!analysis) {
          return <span className="text-2xs text-ink-3">price view only</span>
        }
        return (
          <div className="min-w-0">
            <Badge variant={DIRECTION_VARIANT[analysis.conviction.direction]} size="sm">
              {DIRECTION_CHIP[analysis.conviction.direction]}
            </Badge>
            <div className="mt-1 text-2xs text-ink-3">
              {analysis.conviction.contributing.length} support ·{' '}
              {analysis.conviction.counterSignals.length} counter
            </div>
          </div>
        )
      },
    },
    {
      id: 'watch',
      header: '',
      width: '44px',
      align: 'right',
      cell: (symbol) => <StarToggle symbol={symbol} size="sm" />,
    },
  ]

  return (
    <Surface level="base" radius="lg" className="p-4">
      <SectionHeader
        title="Monitored assets"
        context="Live quotes, conviction and cycle-over-cycle shifts for everything you star."
        actions={
          <span className="text-2xs text-ink-3">
            {rows.length} of {watched.length} watched
          </span>
        }
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Input
          prefix={<Search className="size-3.5" aria-hidden="true" />}
          placeholder="Search watched assets"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search watched assets by symbol or name"
          className="w-full sm:w-64"
        />
        {addOptions.length > 0 && (
          <Select
            options={[
              { value: '', label: 'Add to watchlist…' },
              ...addOptions,
            ]}
            value=""
            onChange={(e) => {
              if (e.target.value) onAdd(e.target.value)
            }}
            aria-label="Add an asset to the watchlist"
            className="w-full sm:w-64"
          />
        )}
      </div>

      <div className="mt-3">
        <DataTable
          columns={columns}
          rows={rows}
          getRowId={(symbol) => symbol}
          caption="Watched assets with quotes, conviction shifts and engine reads"
          onRowClick={(symbol) => navigate(`/asset/${symbol}`)}
          initialSort={{ columnId: 'conviction', direction: 'desc' }}
          dense
          className="border-0 bg-transparent"
          emptyState={
            <EmptyState
              size="sm"
              icon={<Plus className="size-5" aria-hidden="true" />}
              title="Nothing to show"
              body={
                watched.length === 0
                  ? 'Star assets from any screen — or add them above — and they will stream here.'
                  : 'No watched asset matches the current search.'
              }
            />
          }
        />
      </div>
    </Surface>
  )
}
