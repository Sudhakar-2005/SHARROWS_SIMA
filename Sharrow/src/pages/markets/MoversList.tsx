import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, Surface } from '@/design/primitives'
import type { Quote } from '@/engine/types'
import { ASSET_BY_SYMBOL } from '@/data/universe'
import { plain, percent } from '@/lib/format'
import { topMovers } from './markets-data'
import { cn } from '@/lib/cn'

interface MoversListProps {
  quotes: Record<string, Quote>
}

/** Top session gainers/losers across the simulated equity universe. */
export function MoversList({ quotes }: MoversListProps) {
  const [mode, setMode] = useState<'gainers' | 'losers'>('gainers')
  const movers = topMovers(quotes, mode, 5)

  const modes: { id: 'gainers' | 'losers'; label: string }[] = [
    { id: 'gainers', label: 'Gainers' },
    { id: 'losers', label: 'Losers' },
  ]

  return (
    <Surface level="base" radius="lg" className="p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">
          Session movers
        </span>
        <div className="inline-flex rounded-sm border border-line bg-surface-2 p-0.5">
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={mode === m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                'rounded-sm px-2 py-1 text-2xs transition-colors duration-[140ms]',
                'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent',
                mode === m.id ? 'bg-surface-4 text-ink' : 'text-ink-3 hover:text-ink-2',
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {movers.length === 0 ? (
        <EmptyState
          size="sm"
          title="No movers yet"
          body="The session tape will populate once quotes begin ticking."
        />
      ) : (
        <ol className="mt-3 space-y-0.5">
          {movers.map((m, i) => {
            const changePct = m.quote.changePct
            return (
              <li key={m.symbol}>
                <Link
                  to={`/asset/${m.symbol}`}
                  className="grid grid-cols-[18px_1fr_auto] items-center gap-2 rounded-md px-1 py-1.5 transition-colors duration-[140ms] hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
                >
                  <span className="num text-2xs text-ink-3">{i + 1}</span>
                  <span className="min-w-0">
                    <span className="block text-xs font-medium text-ink">{m.symbol}</span>
                    <span className="block truncate text-2xs text-ink-3">
                      {ASSET_BY_SYMBOL[m.symbol]?.name ?? m.symbol}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="num block text-xs text-ink">{plain(m.quote.price, 2)}</span>
                    <span
                      className={cn(
                        'num block text-2xs',
                        changePct > 0 ? 'text-pos' : changePct < 0 ? 'text-neg' : 'text-flow',
                      )}
                    >
                      {percent(changePct, 2)}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
      )}
    </Surface>
  )
}
