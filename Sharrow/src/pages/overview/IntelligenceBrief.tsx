import { Activity, ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AICore } from '@/components/ai-core/AICore'
import { AI_STATE_LABEL, AI_STATE_TONE } from '@/components/ai-core/ai-state'
import { useAIStore } from '@/store/ai-store'
import { Badge, Pill, ProvenanceBadge, Surface } from '@/design/primitives'
import type { Insight, MarketRegime } from '@/engine/types'
import { regimeDescription, regimeLabel } from '@/engine/regime'
import { timeAgo } from '@/lib/format'
import { REGIME_LABEL, REGIME_VARIANT } from './overview-data'

interface IntelligenceBriefProps {
  regime: MarketRegime
  regimeConfidence: number
  compositeScore: number
  breadth: number
  cycleCount: number
  lastCycleAt: number | null
  topInsight?: Insight
  className?: string
}

/**
 * The overview hero: what the engine sees right now, in its own words —
 * headline (WHAT), evidence (WHY), confidence (HOW SURE), last cycle (WHEN).
 */
export function IntelligenceBrief({
  regime,
  regimeConfidence,
  compositeScore,
  breadth,
  cycleCount,
  lastCycleAt,
  topInsight,
  className,
}: IntelligenceBriefProps) {
  const state = useAIStore((s) => s.state)
  const label = useAIStore((s) => s.label)

  return (
    <Surface level="raised" radius="xl" className={className}>
      <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start">
        <div className="flex shrink-0 items-center gap-4">
          <AICore size={72} label={AI_STATE_LABEL[state]} />
          <div className="lg:hidden">
            <p className={`text-xs font-medium ${AI_STATE_TONE[state]}`}>{label}</p>
            <p className="mt-0.5 text-2xs text-ink-3">Cycle #{cycleCount}</p>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-2xs uppercase tracking-[0.14em] text-ink-3">
              Intelligence brief
            </span>
            <ProvenanceBadge kind="ai" />
            <Pill variant={REGIME_VARIANT[regime]} size="sm">
              {REGIME_LABEL[regime]}
            </Pill>
            <Badge variant="outline" size="sm" shape="chip" className="font-mono">
              {regimeConfidence}% confidence
            </Badge>
          </div>

          <h2 className="mt-2.5 text-xl font-semibold leading-snug tracking-[-0.015em] text-ink">
            {topInsight ? topInsight.headline : `${regimeLabel(regime)} conditions observed`}
          </h2>
          <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-ink-3">
            {topInsight ? topInsight.why : regimeDescription(regime)}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-2xs text-ink-3">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="size-3 text-accent" aria-hidden="true" />
              Composite score <span className="num text-ink-2">{compositeScore}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Activity className="size-3 text-accent" aria-hidden="true" />
              Breadth <span className="num text-ink-2">{Math.round(breadth * 100)}%</span>
            </span>
            <span className="hidden sm:inline">
              Last cycle {lastCycleAt ? timeAgo(lastCycleAt) : 'pending'}
            </span>
            <span className="hidden lg:inline text-ink-3">·</span>
            <span className="hidden lg:inline">{label}</span>
          </div>

          {topInsight?.href && (
            <Link
              to={topInsight.href}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-accent transition-colors hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Open evidence <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </Surface>
  )
}
