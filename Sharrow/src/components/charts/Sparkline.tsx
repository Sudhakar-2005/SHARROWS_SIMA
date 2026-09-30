import { cn } from '@/lib/cn'

interface SparklineProps {
  values: number[]
  width?: number
  height?: number
  /** `auto` picks pos/neg from first vs last value. */
  tone?: 'auto' | 'pos' | 'neg' | 'flow' | 'accent'
  ariaLabel: string
  className?: string
}

const STROKE = {
  pos: 'stroke-pos',
  neg: 'stroke-neg',
  flow: 'stroke-flow',
  accent: 'stroke-accent',
} as const

const FILL = {
  pos: 'fill-pos',
  neg: 'fill-neg',
  flow: 'fill-flow',
  accent: 'fill-accent',
} as const

/** Minimal SVG trend line — no chart library, no axes, no fabrication. */
export function Sparkline({
  values,
  width = 120,
  height = 32,
  tone = 'auto',
  ariaLabel,
  className,
}: SparklineProps) {
  if (values.length < 2) return null

  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pad = 2

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width
    const y = pad + (1 - (v - min) / span) * (height - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const line = `M${points.join(' L')}`
  const area = `${line} L${width},${height} L0,${height} Z`

  const resolved =
    tone === 'auto' ? (values[values.length - 1] >= values[0] ? 'pos' : 'neg') : tone

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      role="img"
      aria-label={ariaLabel}
      className={cn('block', className)}
    >
      <path d={area} className={cn(FILL[resolved], 'opacity-[0.12]')} />
      <path
        d={line}
        className={cn(STROKE[resolved], 'fill-none')}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
