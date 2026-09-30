import { Link } from 'react-router-dom'
import { BriefcaseBusiness, TrendingUp } from 'lucide-react'
import { ProgressBar, Surface } from '@/design/primitives'
import type { PortfolioSummary } from '@/engine/cycle'
import { inr, percent } from '@/lib/format'
import { SECTOR_NAME } from '@/data/universe'
import { cn } from '@/lib/cn'

interface PortfolioCardProps {
  summary: PortfolioSummary
  benchmarkChangePct: number
  className?: string
}

/** Portfolio vs benchmark — the "what it means for me" instrument. */
export function PortfolioCard({ summary, benchmarkChangePct, className }: PortfolioCardProps) {
  const diff = summary.changePct - benchmarkChangePct

  return (
    <Surface level="base" radius="lg" className={cn('p-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">Portfolio</span>
        <BriefcaseBusiness className="size-3.5 text-ink-3" aria-hidden="true" />
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="num text-xl font-semibold tracking-[-0.01em] text-ink">
          {inr(summary.value, 0)}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span
          className={cn(
            'num text-xs font-medium',
            summary.changePct > 0 ? 'text-pos' : summary.changePct < 0 ? 'text-neg' : 'text-flow',
          )}
        >
          {percent(summary.changePct, 2)} today
        </span>
        <span className="num text-2xs text-ink-3">
          {diff >= 0 ? '+' : ''}
          {diff.toFixed(2)} pts vs benchmark
        </span>
      </div>

      <div className="mt-3.5 space-y-2.5">
        <div>
          <ProgressBar
            value={summary.topSectorShare}
            label={`Top exposure · ${SECTOR_NAME[summary.topSector]}`}
            valueLabel={`${summary.topSectorShare}%`}
            tone={summary.topSectorShare > 45 ? 'warn' : 'accent'}
          />
        </div>
        <div className="flex items-center gap-1.5 text-2xs text-ink-3">
          <TrendingUp className="size-3" aria-hidden="true" />
          Top mover{' '}
          <span className="font-medium text-ink-2">{summary.topMover.symbol}</span>
          <span className="num">
            {percent(summary.topMover.changePct, 2)}
          </span>
        </div>
      </div>

      <Link
        to="/portfolio"
        className="mt-3 inline-block text-xs font-medium text-accent transition-colors hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Open portfolio →
      </Link>
    </Surface>
  )
}
