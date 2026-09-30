import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Activity, BarChart3, Gauge, Target } from 'lucide-react'
import { Badge, ProgressBar, Surface } from '@/design/primitives'
import type { Prediction, Quote } from '@/engine/types'
import { plain, percent } from '@/lib/format'
import { cn } from '@/lib/cn'
import { selectActive } from '@/store/intelligence-store'

interface MetricStripProps {
  indexSymbol: string
  indexQuote?: Quote
  indexChangePct: number
  breadth: number
  advancing: number
  total: number
  volatilityPct: number
  volatilityBaselinePct: number
  predictions: Prediction[]
  className?: string
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  children,
  href,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  sub?: ReactNode
  children?: ReactNode
  href?: string
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">{label}</span>
        <span className="text-ink-3">{icon}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="num text-xl font-semibold tracking-[-0.01em] text-ink">{value}</span>
        {sub}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </>
  )

  return (
    <Surface level="base" radius="lg" className="p-4">
      {href ? (
        <Link
          to={href}
          className="block rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {body}
        </Link>
      ) : (
        body
      )}
    </Surface>
  )
}

/** Four glanceable market instruments: benchmark, breadth, volatility, scenarios. */
export function MetricStrip({
  indexSymbol,
  indexQuote,
  indexChangePct,
  breadth,
  advancing,
  total,
  volatilityPct,
  volatilityBaselinePct,
  predictions,
  className,
}: MetricStripProps) {
  const active = selectActive(predictions).length
  const evaluated = predictions.filter((p) => p.evaluation).length
  const volDelta = volatilityBaselinePct > 0 ? volatilityPct - volatilityBaselinePct : 0

  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4', className)}>
      <MetricCard
        icon={<BarChart3 className="size-3.5" aria-hidden="true" />}
        label={indexSymbol}
        value={plain(indexQuote?.price ?? 0, 2)}
        sub={
          <span
            className={cn(
              'num text-xs font-medium',
              indexChangePct > 0 ? 'text-pos' : indexChangePct < 0 ? 'text-neg' : 'text-flow',
            )}
          >
            {percent(indexChangePct, 2)}
          </span>
        }
        href="/markets"
      />

      <MetricCard
        icon={<Activity className="size-3.5" aria-hidden="true" />}
        label="Breadth"
        value={`${Math.round(breadth * 100)}%`}
        sub={<span className="text-xs text-ink-3">advancing · {advancing}/{total}</span>}
      >
        <ProgressBar
          value={breadth * 100}
          tone={breadth >= 0.5 ? 'pos' : 'neg'}
          label="Share of constituents advancing"
          hideAria
        />
      </MetricCard>

      <MetricCard
        icon={<Gauge className="size-3.5" aria-hidden="true" />}
        label="Volatility"
        value={`${volatilityPct}%`}
        sub={
          <span className="num text-xs text-ink-3">
            {volDelta >= 0 ? '+' : ''}
            {volDelta.toFixed(1)} vs baseline
          </span>
        }
      >
        <ProgressBar
          value={Math.min(volatilityPct, 60)}
          max={60}
          tone={volDelta > 4 ? 'warn' : 'accent'}
          label="20-session annualised volatility"
          hideAria
        />
      </MetricCard>

      <MetricCard
        icon={<Target className="size-3.5" aria-hidden="true" />}
        label="Scenarios"
        value={active}
        sub={
          <Badge variant="outline" size="sm" shape="chip" className="font-mono">
            {evaluated} evaluated
          </Badge>
        }
        href="/predictions"
      />
    </div>
  )
}
