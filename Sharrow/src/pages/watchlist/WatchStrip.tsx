import type { ReactNode } from 'react'
import { Activity, Eye, Gauge, Target } from 'lucide-react'
import { Badge, Surface } from '@/design/primitives'
import type { WatchStats } from './watchlist-data'

interface WatchStripProps {
  stats: WatchStats
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

/** Glanceable watchlist instruments: monitored, read split, conviction, scenarios. */
export function WatchStrip({ stats }: WatchStripProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StripCard
        icon={<Eye className="size-3.5" aria-hidden="true" />}
        label="Monitored"
        value={stats.monitored}
        sub={<span className="text-xs text-ink-3">assets on this device</span>}
      />

      <StripCard
        icon={<Activity className="size-3.5" aria-hidden="true" />}
        label="Engine read split"
        value={`${stats.advancing} / ${stats.declining}`}
        sub={
          <span className="text-xs text-ink-3">
            upside / downside
            {stats.advancing + stats.declining < stats.monitored && ' · rest two-sided'}
          </span>
        }
      />

      <StripCard
        icon={<Gauge className="size-3.5" aria-hidden="true" />}
        label="Avg conviction"
        value={stats.avgConviction ?? '—'}
        sub={<span className="text-xs text-ink-3">across monitored equities</span>}
      />

      <StripCard
        icon={<Target className="size-3.5" aria-hidden="true" />}
        label="Scenarios"
        value={stats.scenarios}
        sub={
          <Badge variant="outline" size="sm" shape="chip" className="font-mono">
            {stats.monitored > 0 ? 'watched symbols' : 'nothing watched'}
          </Badge>
        }
      />
    </div>
  )
}
