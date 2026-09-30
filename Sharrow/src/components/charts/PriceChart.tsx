import type { Candle, Timeframe } from '@/engine/types'
import { clock, plain } from '@/lib/format'
import { cn } from '@/lib/cn'

interface PriceChartProps {
  candles: Candle[]
  symbol: string
  timeframe: Timeframe
  className?: string
}

const dateFormatter = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' })

function label(t: number, timeframe: Timeframe): string {
  return timeframe === '1D' ? clock(t) : dateFormatter.format(new Date(t))
}

const W = 800
const H = 268
const PAD_L = 4
const PAD_R = 58
const PRICE_TOP = 12
const PRICE_BOT = 196
const VOL_TOP = 214
const VOL_BOT = 250

/**
 * Close-line price chart with volume histogram — hand-rolled SVG, no chart
 * library. Colour encodes the period's direction; the dashed line marks the
 * latest close.
 */
export function PriceChart({ candles, symbol, timeframe, className }: PriceChartProps) {
  if (candles.length < 2) return null

  const closes = candles.map((c) => c.c)
  const min = Math.min(...closes)
  const max = Math.max(...closes)
  const span = max - min || 1
  const n = candles.length
  const plotW = W - PAD_L - PAD_R

  const x = (i: number) => PAD_L + (i / Math.max(n - 1, 1)) * plotW
  const y = (p: number) => PRICE_BOT - ((p - min) / span) * (PRICE_BOT - PRICE_TOP)

  const line = closes
    .map((c, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(c).toFixed(1)}`)
    .join(' ')
  const area = `${line} L${x(n - 1).toFixed(1)},${PRICE_BOT} L${x(0).toFixed(1)},${PRICE_BOT} Z`

  const up = closes[n - 1] >= closes[0]
  const strokeClass = up ? 'stroke-pos' : 'stroke-neg'
  const fillClass = up ? 'fill-pos' : 'fill-neg'

  const gridValues = [0, 1, 2, 3].map((k) => ({
    value: max - (span * k) / 3,
    gy: PRICE_TOP + (k * (PRICE_BOT - PRICE_TOP)) / 3,
  }))

  const stats = periodStatsOf(candles)
  const maxVolume = stats.maxVolume || 1
  const barW = (plotW / n) * 0.62
  const lastY = y(closes[n - 1])

  const xTickIndices = n >= 3 ? [0, Math.floor((n - 1) / 2), n - 1] : [0, n - 1]

  const periodChange = stats.changePct
  const aria = `${symbol} ${timeframe} close line from ${plain(closes[0])} to ${plain(closes[n - 1])}, ${periodChange >= 0 ? 'up' : 'down'} ${Math.abs(periodChange).toFixed(2)} percent over ${n} bars, with volume`

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={aria}
      className={cn('block h-auto w-full', className)}
    >
      {gridValues.map((g, i) => (
        <g key={i}>
          <line
            x1={PAD_L}
            x2={W - PAD_R}
            y1={g.gy}
            y2={g.gy}
            className="stroke-line"
            strokeDasharray="2 5"
            strokeWidth="1"
          />
          <text
            x={W - PAD_R + 8}
            y={g.gy + 3.5}
            className="fill-ink-3 font-mono text-[10px]"
          >
            {plain(g.value, 2)}
          </text>
        </g>
      ))}

      <path d={area} className={cn(fillClass, 'opacity-[0.10]')} />
      <path
        d={line}
        className={cn(strokeClass, 'fill-none')}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      <line
        x1={PAD_L}
        x2={W - PAD_R}
        y1={lastY}
        y2={lastY}
        className={cn(up ? 'stroke-pos' : 'stroke-neg', 'opacity-40')}
        strokeDasharray="4 4"
        strokeWidth="1"
      />
      <circle cx={x(n - 1)} cy={lastY} r="3" className={cn(fillClass, 'stroke-surface-1')} strokeWidth="1.5" />

      {candles.map((c, i) => {
        const vh = Math.max(((c.v || 0) / maxVolume) * (VOL_BOT - VOL_TOP), 1)
        return (
          <rect
            key={i}
            x={x(i) - barW / 2}
            y={VOL_BOT - vh}
            width={Math.max(barW, 1)}
            height={vh}
            className={c.c >= c.o ? cn('fill-pos', 'opacity-40') : cn('fill-neg', 'opacity-40')}
          />
        )
      })}

      {xTickIndices.map((i, idx) => (
        <text
          key={i}
          x={x(i)}
          y={H - 4}
          textAnchor={idx === 0 ? 'start' : idx === xTickIndices.length - 1 ? 'end' : 'middle'}
          className="fill-ink-3 font-mono text-[10px]"
        >
          {label(candles[i].t, timeframe)}
        </text>
      ))}
    </svg>
  )
}

function periodStatsOf(candles: Candle[]): { maxVolume: number; changePct: number } {
  const first = candles[0].c
  const last = candles[candles.length - 1].c
  return {
    maxVolume: Math.max(...candles.map((c) => c.v)),
    changePct: first > 0 ? ((last - first) / first) * 100 : 0,
  }
}
