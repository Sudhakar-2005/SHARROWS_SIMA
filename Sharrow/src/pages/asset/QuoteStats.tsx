import type { Quote } from '@/engine/types'
import { ProvenanceBadge, Surface } from '@/design/primitives'
import { compact, plain } from '@/lib/format'
import { sessionOpen, yearRange } from './asset-data'
import { rangePosition } from '../markets/markets-data'
import { cn } from '@/lib/cn'

interface QuoteStatsProps {
  symbol: string
  quote: Quote
}

/** Session statistics: range position, open, previous close, volume, 52-week band. */
export function QuoteStats({ symbol, quote }: QuoteStatsProps) {
  const position = rangePosition(quote)
  const open = sessionOpen(symbol)
  const year = yearRange(symbol)

  const rows = [
    { label: 'Previous close', value: plain(quote.prevClose, 2) },
    { label: 'Open', value: open !== null ? plain(open, 2) : '—' },
    ...(quote.volume > 0 ? [{ label: 'Volume', value: compact(quote.volume) }] : []),
    {
      label: '52-week high',
      value: year ? plain(year.high, 2) : '—',
    },
    { label: '52-week low', value: year ? plain(year.low, 2) : '—' },
  ]

  const changePct = quote.changePct

  return (
    <Surface level="base" radius="lg" className="p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">
          Session statistics
        </span>
        <ProvenanceBadge kind="derived" bare />
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="num text-xl font-semibold text-ink">{plain(quote.price, 2)}</span>
        <span
          className={cn(
            'num text-xs font-medium',
            changePct > 0 ? 'text-pos' : changePct < 0 ? 'text-neg' : 'text-flow',
          )}
        >
          {plain(quote.change, 2)} ({changePct >= 0 ? '+' : ''}
          {changePct.toFixed(2)}%)
        </span>
      </div>

      <div className="mt-3">
        <div className="relative h-1 rounded-full bg-surface-3">
          <span
            className="absolute -top-[3px] h-2.5 w-0.5 -translate-x-1/2 rounded-full bg-ink-2"
            style={{ left: `${position * 100}%` }}
            aria-hidden="true"
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-2xs text-ink-3">
          <span className="num">{plain(quote.dayLow, 2)}</span>
          <span className="font-mono uppercase tracking-[0.08em]">Day range</span>
          <span className="num">{plain(quote.dayHigh, 2)}</span>
        </div>
      </div>

      <dl className="mt-3 divide-y divide-line/70">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between py-1.5">
            <dt className="text-2xs text-ink-3">{r.label}</dt>
            <dd className="num text-xs text-ink-2">{r.value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-2 text-2xs leading-relaxed text-ink-3">
        {quote.volume > 0 ? 'Day range and volume from the simulated live feed' : 'Day range from the simulated live feed'}
        ; 52-week band derived from the simulated daily series.
      </p>
    </Surface>
  )
}
