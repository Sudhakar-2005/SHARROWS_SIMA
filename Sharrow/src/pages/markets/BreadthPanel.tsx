import type { Quote } from '@/engine/types'
import { EQUITY_SYMBOLS } from '@/data/universe'
import { Surface } from '@/design/primitives'
import { percent } from '@/lib/format'
import { cn } from '@/lib/cn'

interface BreadthPanelProps {
  advancing: number
  declining: number
  unchanged: number
  breadth: number
  quotes: Record<string, Quote>
  indexChangePct: number
}

interface Bucket {
  label: string
  count: number
  tone: 'pos' | 'neg' | 'flow'
}

function participationNote(breadth: number): string {
  if (breadth >= 0.6) return 'Participation is broad — the session is being carried by most constituents.'
  if (breadth >= 0.45) return 'Participation is balanced — advances and declines are evenly matched.'
  if (breadth >= 0.35) return 'Participation is narrowing — fewer names are carrying the tape.'
  return 'Participation is weak — most constituents are declining this session.'
}

function divergenceNote(breadth: number, indexChangePct: number): string {
  const idxUp = indexChangePct > 0.05
  const idxDown = indexChangePct < -0.05
  const broad = breadth >= 0.5
  if (idxUp && broad) return 'Benchmark gains are broadly supported by constituents.'
  if (idxUp && !broad) return 'Benchmark is rising on narrow participation — gains are concentrated in fewer names.'
  if (idxDown && !broad) return 'Benchmark declines are broadly shared across constituents.'
  if (idxDown && broad) return 'Benchmark is lower despite broad advances — a divergence worth watching.'
  return 'The benchmark is flat while participation stays mixed.'
}

function distribution(quotes: Record<string, Quote>): Bucket[] {
  const buckets: Bucket[] = [
    { label: '≤ −1%', count: 0, tone: 'neg' },
    { label: '−1 to 0', count: 0, tone: 'neg' },
    { label: 'flat', count: 0, tone: 'flow' },
    { label: '0 to +1%', count: 0, tone: 'pos' },
    { label: '≥ +1%', count: 0, tone: 'pos' },
  ]
  for (const symbol of EQUITY_SYMBOLS) {
    const pct = quotes[symbol]?.changePct
    if (pct === undefined) continue
    if (pct <= -1) buckets[0].count++
    else if (pct < -0.05) buckets[1].count++
    else if (pct <= 0.05) buckets[2].count++
    else if (pct < 1) buckets[3].count++
    else buckets[4].count++
  }
  return buckets
}

const TONE_BAR = {
  pos: 'bg-pos',
  neg: 'bg-neg',
  flow: 'bg-flow',
} as const

/** Advance/decline participation and session-move distribution for the universe. */
export function BreadthPanel({
  advancing,
  declining,
  unchanged,
  breadth,
  quotes,
  indexChangePct,
}: BreadthPanelProps) {
  const total = advancing + declining + unchanged || 1
  const advPct = (advancing / total) * 100
  const decPct = (declining / total) * 100
  const uncPct = (unchanged / total) * 100

  const buckets = distribution(quotes)
  const maxCount = Math.max(...buckets.map((b) => b.count), 1)

  const cells = [
    { label: 'Advancing', value: advancing, tone: 'text-pos' },
    { label: 'Declining', value: declining, tone: 'text-neg' },
    { label: 'Unchanged', value: unchanged, tone: 'text-flow' },
  ]

  return (
    <Surface level="base" radius="lg" className="p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">
          Market breadth
        </span>
        <span className="text-2xs text-ink-3">session</span>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="num text-2xl font-semibold tracking-[-0.01em] text-ink">
          {Math.round(breadth * 100)}%
        </span>
        <span className="text-xs text-ink-3">
          advancing · {advancing}/{total} equities
        </span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-ink-2">{participationNote(breadth)}</p>

      <div
        className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-surface-3"
        role="img"
        aria-label={`${advancing} advancing, ${declining} declining, ${unchanged} unchanged`}
      >
        <span className="bg-pos" style={{ width: `${advPct}%` }} aria-hidden="true" />
        <span className="bg-neg" style={{ width: `${decPct}%` }} aria-hidden="true" />
        <span className="bg-flow" style={{ width: `${uncPct}%` }} aria-hidden="true" />
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2">
        {cells.map((c) => (
          <div key={c.label} className="rounded-md bg-surface-2 px-2.5 py-2">
            <dt className="font-mono text-2xs uppercase tracking-[0.08em] text-ink-3">{c.label}</dt>
            <dd className={cn('num mt-0.5 text-sm font-semibold', c.tone)}>{c.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4">
        <span className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">
          Session distribution
        </span>
        <div
          className="mt-2 flex h-20 items-end gap-1.5"
          role="img"
          aria-label={`Session move distribution: ${buckets.map((b) => `${b.count} between ${b.label}`).join(', ')}`}
        >
          {buckets.map((b) => (
            <div key={b.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="num text-2xs text-ink-3">{b.count}</span>
              <span
                className={cn('w-full rounded-sm', TONE_BAR[b.tone])}
                style={{ height: `${Math.max((b.count / maxCount) * 44, 3)}px` }}
                aria-hidden="true"
              />
            </div>
          ))}
        </div>
        <div className="mt-1 flex gap-1.5" aria-hidden="true">
          {buckets.map((b) => (
            <span key={b.label} className="flex-1 text-center text-2xs text-ink-3">
              {b.label}
            </span>
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-ink-2">
        {divergenceNote(breadth, indexChangePct)}{' '}
        <span className="text-ink-3">Benchmark {percent(indexChangePct, 2)}.</span>
      </p>
    </Surface>
  )
}
