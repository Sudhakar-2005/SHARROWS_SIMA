import type { ReactNode } from 'react'
import { Briefcase, CalendarDays, PieChart, Wallet } from 'lucide-react'
import { Surface } from '@/design/primitives'
import type { PortfolioTotals } from './portfolio-data'
import { inr, percent } from '@/lib/format'
import { rupeeSigned, valueTone } from './portfolio-data'
import { cn } from '@/lib/cn'

interface PortfolioStripProps {
  totals: PortfolioTotals
  benchmarkChangePct: number
  topSector: string
  topSectorShare: number
}

function StripCard({
  icon,
  label,
  value,
  sub,
  children,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  sub?: ReactNode
  children?: ReactNode
}) {
  return (
    <Surface level="base" radius="lg" className="p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">{label}</span>
        <span className="text-ink-3">{icon}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="num text-xl font-semibold tracking-[-0.01em] text-ink">{value}</span>
        {sub}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </Surface>
  )
}

/** Value, cumulative P&L, today's move and top exposure at a glance. */
export function PortfolioStrip({
  totals,
  benchmarkChangePct,
  topSector,
  topSectorShare,
}: PortfolioStripProps) {
  const diff = totals.dayChangePct - benchmarkChangePct

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StripCard
        icon={<Wallet className="size-3.5" aria-hidden="true" />}
        label="Portfolio value"
        value={inr(totals.value, 0)}
        sub={
          <span className={cn('num text-xs font-medium', valueTone(totals.dayPnl))}>
            {rupeeSigned(totals.dayPnl)} today
          </span>
        }
      />

      <StripCard
        icon={<Briefcase className="size-3.5" aria-hidden="true" />}
        label="Overall P&L"
        value={
          <span className={valueTone(totals.pnl)}>{rupeeSigned(totals.pnl)}</span>
        }
        sub={
          <span className={cn('num text-xs font-medium', valueTone(totals.pnl))}>
            {percent(totals.pnlPct, 2)}
          </span>
        }
      />

      <StripCard
        icon={<CalendarDays className="size-3.5" aria-hidden="true" />}
        label="Today"
        value={
          <span className={valueTone(totals.dayPnl)}>
            {percent(totals.dayChangePct, 2)}
          </span>
        }
        sub={
          <span className="num text-2xs text-ink-3">
            {diff >= 0 ? '+' : ''}
            {diff.toFixed(2)} pts vs NIFTY50
          </span>
        }
      />

      <StripCard
        icon={<PieChart className="size-3.5" aria-hidden="true" />}
        label="Top exposure"
        value={`${topSectorShare}%`}
        sub={<span className="text-xs text-ink-3">in {topSector}</span>}
      />
    </div>
  )
}
