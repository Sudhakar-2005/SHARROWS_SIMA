import type { ReactNode } from 'react'
import { Gauge, Newspaper, Target, Wifi } from 'lucide-react'
import { Surface } from '@/design/primitives'
import type { NewsStats } from './research-data'

interface ResearchStripProps {
  stats: NewsStats
}

function StripCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  sub: ReactNode
}) {
  return (
    <Surface level="base" radius="lg" className="p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">{label}</span>
        <span className="text-ink-3">{icon}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="num text-xl font-semibold tracking-[-0.01em] text-ink">{value}</span>
        <span className="text-xs text-ink-3">{sub}</span>
      </div>
    </Surface>
  )
}

/** Headline count, high-impact count, portfolio relevance and source spread. */
export function ResearchStrip({ stats }: ResearchStripProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StripCard
        icon={<Newspaper className="size-3.5" aria-hidden="true" />}
        label="Headlines"
        value={stats.total}
        sub="scored in window"
      />
      <StripCard
        icon={<Target className="size-3.5" aria-hidden="true" />}
        label="High impact"
        value={stats.highImpact}
        sub={stats.highImpact === 1 ? 'elevated read' : 'elevated reads'}
      />
      <StripCard
        icon={<Gauge className="size-3.5" aria-hidden="true" />}
        label="Portfolio relevant"
        value={stats.portfolioRelevant}
        sub="relevant or material"
      />
      <StripCard
        icon={<Wifi className="size-3.5" aria-hidden="true" />}
        label="Sources"
        value={stats.sources}
        sub={
          stats.avgConfidence === null
            ? 'no items'
            : `avg confidence ${stats.avgConfidence}`
        }
      />
    </div>
  )
}
