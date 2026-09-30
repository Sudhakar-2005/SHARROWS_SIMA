import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import {
  Badge,
  EmptyState,
  ProgressBar,
  ProvenanceBadge,
  SectionHeader,
  Surface,
  Tag,
} from '@/design/primitives'
import type { Insight } from '@/engine/types'
import { timeAgo } from '@/lib/format'
import { IMPORTANCE_VARIANT } from '../overview/overview-data'
import { INSIGHT_KIND_LABEL } from './intelligence-data'

interface ObservationFeedProps {
  insights: Insight[]
  /** Reference time — the latest intelligence cycle. */
  now: number
}

function LabeledRow({ label, tone, children }: { label: string; tone?: string; children: string }) {
  return (
    <div className="flex gap-3">
      <dt className={`w-28 shrink-0 font-mono text-2xs uppercase tracking-[0.1em] ${tone ?? 'text-ink-3'}`}>
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-xs leading-relaxed text-ink-2">{children}</dd>
    </div>
  )
}

/** Structured observation cards: what, why, how important, how sure, what changed. */
export function ObservationFeed({ insights, now }: ObservationFeedProps) {
  return (
    <Surface level="base" radius="lg" className="p-4">
      <SectionHeader
        title="Observations"
        context="Structured reads — what was seen, why it matters, how sure the engine is and what changed."
        actions={<span className="text-2xs text-ink-3">{insights.length} this cycle</span>}
      />

      {insights.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            size="sm"
            icon={<Sparkles className="size-5" aria-hidden="true" />}
            title="No observations this cycle"
            body="Observations are drafted when the engine finds something worth surfacing — each carries its evidence, confidence and invalidation."
          />
        </div>
      ) : (
        <ul className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {insights.map((i) => (
            <li
              key={i.id}
              className="flex flex-col rounded-md border border-line bg-surface-1 p-4 transition-colors hover:border-line-strong"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={IMPORTANCE_VARIANT[i.importance]} size="sm" dot>
                    {i.importance}
                  </Badge>
                  <span className="font-mono text-2xs uppercase tracking-[0.1em] text-ink-3">
                    {INSIGHT_KIND_LABEL[i.kind]}
                  </span>
                  <ProvenanceBadge kind={i.provenance} bare />
                </div>
                <span className="shrink-0 text-2xs text-ink-3">{timeAgo(i.createdAt, now)}</span>
              </div>

              <h3 className="mt-2 text-sm font-medium leading-snug text-ink">{i.headline}</h3>

              <dl className="mt-3 space-y-2">
                <LabeledRow label="Why">{i.why}</LabeledRow>
                <LabeledRow label="Changed">{i.changed}</LabeledRow>
                {i.risk && <LabeledRow label="Risk" tone="text-warn">{i.risk}</LabeledRow>}
                {i.invalidation && (
                  <LabeledRow label="Invalidation">{i.invalidation}</LabeledRow>
                )}
              </dl>

              <div className="mt-3">
                <ProgressBar
                  value={i.confidence}
                  label="Confidence"
                  valueLabel={`${i.confidence}/100`}
                  tone={i.importance === 'critical' ? 'warn' : 'accent'}
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
                <span className="mr-1 font-mono text-2xs uppercase tracking-[0.1em] text-ink-3">
                  Sources
                </span>
                {i.sources
                  .filter((s, idx, arr) => arr.findIndex((x) => x.label === s.label) === idx)
                  .map((s) => (
                    <Tag key={s.label}>{s.label}</Tag>
                  ))}
                {i.href && (
                  <Link
                    to={i.href}
                    className="ml-auto inline-flex items-center gap-1 text-2xs font-medium text-accent transition-colors hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    Evidence <ArrowRight className="size-3" aria-hidden="true" />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Surface>
  )
}
