import { Badge, EmptyState, ProgressBar, SectionHeader, Surface, Tag } from '@/design/primitives'
import type { Prediction } from '@/engine/types'
import { plain, timeAgo } from '@/lib/format'
import { DIRECTION_LABEL, DIRECTION_VARIANT, OUTCOME_VARIANT } from '../overview/overview-data'

interface AssetScenariosProps {
  predictions: Prediction[]
}

const OUTCOME_LABEL = {
  matched: 'Matched',
  partial: 'Partial',
  missed: 'Missed',
  inconclusive: 'Inconclusive',
} as const

function ActiveScenario({ p }: { p: Prediction }) {
  return (
    <div className="rounded-md border border-line bg-surface-2 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Badge variant={DIRECTION_VARIANT[p.direction]} size="sm">
            {DIRECTION_LABEL[p.direction]}
          </Badge>
          <Tag>{p.horizon}</Tag>
        </div>
        <span className="text-2xs text-ink-3">opened {timeAgo(p.createdAt)}</span>
      </div>

      <p className="mt-2 text-sm font-medium leading-snug text-ink">{p.title}</p>
      <p className="mt-1 text-xs leading-relaxed text-ink-2">{p.scenario}</p>

      <div className="mt-2.5 flex items-center gap-2">
        <ProgressBar
          value={p.confidence}
          tone={DIRECTION_VARIANT[p.direction]}
          className="w-24"
          srLabel={`Confidence of ${p.title}`}
        />
        <span className="text-2xs text-ink-3">{p.confidence}% confidence</span>
      </div>

      {(p.entryPrice || p.invalidationLevel || p.targetPrice) && (
        <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded bg-surface-3/60 px-1.5 py-1">
            <p className="text-2xs text-ink-3">From</p>
            <p className="num text-xs text-ink-2">{p.entryPrice ? plain(p.entryPrice, 2) : '—'}</p>
          </div>
          <div className="rounded bg-surface-3/60 px-1.5 py-1">
            <p className="text-2xs text-ink-3">Invalidation</p>
            <p className="num text-xs text-ink-2">
              {p.invalidationLevel ? plain(p.invalidationLevel, 2) : '—'}
            </p>
          </div>
          <div className="rounded bg-surface-3/60 px-1.5 py-1">
            <p className="text-2xs text-ink-3">Expected</p>
            <p className="num text-xs text-ink-2">{p.targetPrice ? plain(p.targetPrice, 2) : '—'}</p>
          </div>
        </div>
      )}

      {p.invalidation.length > 0 && (
        <ul className="mt-2.5 space-y-1">
          {p.invalidation.slice(0, 2).map((inv) => (
            <li key={inv} className="flex items-start gap-1.5 text-2xs leading-relaxed text-ink-3">
              <span className="mt-1 size-1 shrink-0 rounded-full bg-warn" aria-hidden="true" />
              {inv}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function EvaluatedRow({ p }: { p: Prediction }) {
  const ev = p.evaluation
  if (!ev) return null
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line/70 py-2.5 last:border-0">
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-ink">{ev.headline}</p>
        <p className="mt-0.5 text-2xs text-ink-3">
          {ev.delta} · evaluated {timeAgo(ev.at)}
        </p>
      </div>
      <Badge variant={OUTCOME_VARIANT[ev.verdict]} size="sm">
        {OUTCOME_LABEL[ev.verdict]}
      </Badge>
    </div>
  )
}

/** Scenarios opened on this symbol — active cards plus evaluated history. */
export function AssetScenarios({ predictions }: AssetScenariosProps) {
  const active = predictions.filter((p) => p.status === 'active' || p.status === 'created')
  const evaluated = predictions.filter((p) => p.evaluation)

  if (active.length === 0 && evaluated.length === 0) {
    return (
      <Surface level="base" radius="lg" className="p-4">
        <SectionHeader
          title="Scenarios"
          context="Conditional scenarios the engine is tracking on this symbol."
        />
        <div className="mt-3">
          <EmptyState
            size="sm"
            title="No scenarios on this symbol"
            body="The engine opens a scenario only when directional evidence clears its threshold — absence here is not a neutral call."
          />
        </div>
      </Surface>
    )
  }

  return (
    <Surface level="base" radius="lg" className="p-4">
      <SectionHeader
        title="Scenarios"
        context="Conditional scenarios on this symbol — framed with entry, invalidation and horizon."
        actions={
          <span className="text-2xs text-ink-3">
            {active.length} active · {evaluated.length} evaluated
          </span>
        }
      />
      <div className="mt-3 space-y-3">
        {active.map((p) => (
          <ActiveScenario key={p.id} p={p} />
        ))}
        {evaluated.length > 0 && (
          <div>
            <span className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">
              Evaluated · backtested
            </span>
            <div className="mt-1">
              {evaluated.map((p) => (
                <EvaluatedRow key={p.id} p={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Surface>
  )
}
