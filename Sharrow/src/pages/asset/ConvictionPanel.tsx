import { Badge, EmptyState, ProgressBar, SectionHeader, Surface } from '@/design/primitives'
import type { AssetAnalysis } from '@/engine/cycle'
import { timeAgo } from '@/lib/format'
import { DIRECTION_LABEL, DIRECTION_VARIANT } from '../overview/overview-data'
import { SignalCard } from './SignalCard'
import { cn } from '@/lib/cn'

interface ConvictionPanelProps {
  analysis: AssetAnalysis
}

function SignalGroup({
  title,
  note,
  signals,
  tone,
}: {
  title: string
  note: string
  signals: AssetAnalysis['signals']
  tone?: string
}) {
  if (signals.length === 0) return null
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className={cn('font-mono text-2xs uppercase tracking-[0.12em]', tone ?? 'text-ink-3')}>
          {title} · {signals.length}
        </span>
        <span className="text-2xs text-ink-3">{note}</span>
      </div>
      <div className="mt-2 space-y-2">
        {signals.map((s) => (
          <SignalCard key={s.id} signal={s} />
        ))}
      </div>
    </div>
  )
}

/** The engine's read on this asset: score, supporting evidence, counters, neutrals. */
export function ConvictionPanel({ analysis }: ConvictionPanelProps) {
  const { conviction, signals } = analysis
  const neutrals = signals.filter((s) => s.direction === 'neutral')

  return (
    <Surface level="base" radius="lg" className="p-4">
      <SectionHeader
        title="Engine read"
        context="Evidence weighted by signal family, quality and regime agreement — mixed evidence lowers the score rather than being hidden."
        actions={<span className="text-2xs text-ink-3">{timeAgo(analysis.computedAt)}</span>}
      />

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-md bg-surface-2 p-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'num text-3xl font-semibold tracking-[-0.02em]',
              conviction.direction === 'bullish'
                ? 'text-pos'
                : conviction.direction === 'bearish'
                  ? 'text-neg'
                  : 'text-ink',
            )}
          >
            {conviction.score}
          </span>
          <div>
            <Badge variant={DIRECTION_VARIANT[conviction.direction]} size="md">
              {DIRECTION_LABEL[conviction.direction]}
            </Badge>
            <p className="mt-1 text-2xs text-ink-3">conviction / 100</p>
          </div>
        </div>

        <div className="min-w-40 flex-1">
          <ProgressBar
            value={conviction.score}
            tone={DIRECTION_VARIANT[conviction.direction]}
            size="md"
            srLabel={`Conviction score for ${analysis.symbol}`}
          />
          <div className="mt-1.5 flex items-center justify-between text-2xs text-ink-3">
            <span>
              {conviction.contributing.length} supporting · {conviction.counterSignals.length}{' '}
              counter
            </span>
            <span>regime: {conviction.regime}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <SignalGroup
          title="Supporting evidence"
          note="aligned with the current read"
          signals={conviction.contributing}
        />
        <SignalGroup
          title="Counter-evidence"
          note="presses against the read"
          signals={conviction.counterSignals}
          tone="text-warn"
        />
        {neutrals.length > 0 && (
          <details className="group">
            <summary className="cursor-pointer list-none rounded-md border border-line px-3 py-2 text-2xs text-ink-3 transition-colors hover:text-ink-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent">
              Neutral readings · {neutrals.length}{' '}
              <span className="group-open:hidden">(show)</span>
              <span className="hidden group-open:inline">(hide)</span> — no directional information
            </summary>
            <div className="mt-2 space-y-2">
              {neutrals.map((s) => (
                <SignalCard key={s.id} signal={s} />
              ))}
            </div>
          </details>
        )}
        {conviction.contributing.length === 0 && conviction.counterSignals.length === 0 && (
          <EmptyState
            size="sm"
            title="No directional evidence"
            body="The engine found no weighted evidence above its threshold this cycle. Two-sided readings are not forced into a call."
          />
        )}
      </div>
    </Surface>
  )
}
