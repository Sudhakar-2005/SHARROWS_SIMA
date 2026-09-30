import { Link } from 'react-router-dom'
import { FlaskConical, ShieldAlert } from 'lucide-react'
import {
  Badge,
  EmptyState,
  ProvenanceBadge,
  SectionHeader,
  Surface,
  Tag,
} from '@/design/primitives'
import type { Prediction } from '@/engine/types'
import { plain, timeAgo } from '@/lib/format'
import { DIRECTION_VARIANT, REGIME_LABEL, REGIME_VARIANT } from '../overview/overview-data'

interface ActiveScenariosProps {
  predictions: Prediction[]
  /** Reference time — the latest intelligence cycle. */
  now: number
}

const DIRECTION_CHIP = {
  bullish: 'Upside',
  bearish: 'Downside',
  neutral: 'Two-sided',
} as const

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-surface-2 px-2.5 py-1.5">
      <p className="font-mono text-2xs uppercase tracking-[0.08em] text-ink-3">{label}</p>
      <p className="num mt-0.5 text-xs text-ink">{value}</p>
    </div>
  )
}

function ScenarioCard({ prediction, now }: { prediction: Prediction; now: number }) {
  const p = prediction
  return (
    <Surface level="base" radius="lg" className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/asset/${p.symbol}`}>
            <Tag className="transition-colors hover:text-accent">{p.symbol}</Tag>
          </Link>
          <Badge variant={DIRECTION_VARIANT[p.direction]} size="sm">
            {DIRECTION_CHIP[p.direction]}
          </Badge>
          <Badge variant="outline" size="sm" shape="chip">
            {p.horizon}
          </Badge>
          {p.regimeAtCreation && (
            <Badge variant={REGIME_VARIANT[p.regimeAtCreation]} size="sm" shape="chip">
              {REGIME_LABEL[p.regimeAtCreation]}
            </Badge>
          )}
        </div>
        <span className="text-2xs text-ink-3">{timeAgo(p.createdAt, now)}</span>
      </div>

      <p className="mt-2.5 text-sm font-medium leading-snug text-ink">{p.title}</p>
      <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-ink-2">{p.scenario}</p>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Meta label="Entry" value={p.entryPrice !== undefined ? plain(p.entryPrice, 2) : '—'} />
        <Meta label="Invalidation" value={p.invalidationLevel !== undefined ? plain(p.invalidationLevel, 2) : '—'} />
        <Meta label="Target" value={p.targetPrice !== undefined ? plain(p.targetPrice, 2) : '—'} />
        <Meta label="Confidence" value={`${p.confidence}/100`} />
      </div>

      {p.supportingSignals.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-2xs text-ink-3">Evidence</span>
          {p.supportingSignals.slice(0, 4).map((s) => (
            <Tag key={s}>{s}</Tag>
          ))}
        </div>
      )}

      {p.invalidation.length > 0 && (
        <p className="mt-2.5 flex items-start gap-1.5 text-2xs leading-relaxed text-ink-3">
          <ShieldAlert className="mt-0.5 size-3 shrink-0 text-warn" aria-hidden="true" />
          {p.invalidation[0]}
        </p>
      )}
    </Surface>
  )
}

/** Open, engine-framed scenarios with entry, invalidation and horizon. */
export function ActiveScenarios({ predictions, now }: ActiveScenariosProps) {
  return (
    <Surface level="base" radius="lg" className="p-4">
      <SectionHeader
        title="Open scenarios"
        context="Conditional scenarios framed by the engine — each with an entry, an invalidation and a horizon."
        actions={
          <div className="flex items-center gap-2">
            <span className="text-2xs text-ink-3">{predictions.length} active</span>
            <ProvenanceBadge kind="ai" bare />
          </div>
        }
      />

      {predictions.length === 0 ? (
        <div className="mt-2">
          <EmptyState
            size="md"
            icon={<FlaskConical className="size-5" aria-hidden="true" />}
            title="No open scenarios"
            body="Scenarios are framed when directional evidence clears the creation threshold. Evaluated history below keeps accumulating in the meantime."
          />
        </div>
      ) : (
        <div className="mt-3 grid gap-4 xl:grid-cols-2">
          {predictions.map((p) => (
            <ScenarioCard key={p.id} prediction={p} now={now} />
          ))}
        </div>
      )}
    </Surface>
  )
}
