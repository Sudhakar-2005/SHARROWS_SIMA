import { Surface } from '@/design/primitives'
import type { Quote } from '@/engine/types'
import { ASSET_BY_SYMBOL } from '@/data/universe'
import { getDailySeries, withLiveTail } from '@/services/market-data'
import { plain, percent } from '@/lib/format'
import { Sparkline } from '@/components/charts/Sparkline'
import { rangePosition } from './markets-data'
import { cn } from '@/lib/cn'

interface IndexCardsProps {
  symbols: string[]
  quotes: Record<string, Quote>
}

/** Benchmark cards: price, session change, 40-session trend and day-range position. */
export function IndexCards({ symbols, quotes }: IndexCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {symbols.map((symbol) => {
        const quote = quotes[symbol]
        const meta = ASSET_BY_SYMBOL[symbol]
        const changePct = quote?.changePct ?? 0
        const up = changePct >= 0
        const closes = withLiveTail(symbol, getDailySeries(symbol))
          .slice(-40)
          .map((c) => c.c)
        const position = quote ? rangePosition(quote) : 0.5

        return (
          <Surface key={symbol} level="base" radius="lg" className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{meta?.name ?? symbol}</p>
                <p className="font-mono text-2xs uppercase tracking-[0.1em] text-ink-3">{symbol}</p>
              </div>
              <span
                className={cn(
                  'num shrink-0 text-xs font-medium',
                  up ? 'text-pos' : changePct < 0 ? 'text-neg' : 'text-flow',
                )}
              >
                {percent(changePct, 2)}
              </span>
            </div>

            <p className="num mt-2 text-xl font-semibold tracking-[-0.01em] text-ink">
              {plain(quote?.price ?? 0, 2)}
            </p>

            <Sparkline
              values={closes}
              height={36}
              tone={up ? 'pos' : 'neg'}
              ariaLabel={`${symbol} closing trend across the last 40 sessions, ${up ? 'up' : 'down'} ${Math.abs(changePct).toFixed(2)}% today`}
              className="mt-2"
            />

            <div className="mt-3">
              <div className="relative h-1 rounded-full bg-surface-3">
                <span
                  className="absolute -top-[3px] h-2.5 w-0.5 -translate-x-1/2 rounded-full bg-ink-2"
                  style={{ left: `${position * 100}%` }}
                  aria-hidden="true"
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-2xs text-ink-3">
                <span className="num">{plain(quote?.dayLow ?? 0, 2)}</span>
                <span className="font-mono uppercase tracking-[0.08em]">Day range</span>
                <span className="num">{plain(quote?.dayHigh ?? 0, 2)}</span>
              </div>
            </div>
          </Surface>
        )
      })}
    </div>
  )
}
