import { Badge, ProvenanceBadge, Surface } from '@/design/primitives'
import type { MarketSnapshot } from '@/engine/cycle'
import type { SectorId } from '@/engine/types'
import { percent } from '@/lib/format'
import { regimeDescription, regimeLabel } from '@/engine/regime'
import { REGIME_VARIANT } from '../overview/overview-data'
import { cn } from '@/lib/cn'

interface ContextCardProps {
  snapshot: MarketSnapshot
  sector: SectorId
}

/** Where this asset sits right now: regime, sector rotation and benchmark. */
export function ContextCard({ snapshot, sector }: ContextCardProps) {
  const sectorRow = snapshot.sectorPerformance.find((s) => s.sector === sector)
  const rank = sectorRow
    ? snapshot.sectorPerformance.findIndex((s) => s.sector === sector) + 1
    : null

  const rows = [
    {
      label: 'Sector today',
      value: sectorRow ? percent(sectorRow.changePct, 2) : '—',
      tone: sectorRow
        ? sectorRow.changePct > 0
          ? 'text-pos'
          : sectorRow.changePct < 0
            ? 'text-neg'
            : 'text-flow'
        : 'text-ink-3',
      sub: rank ? `rank ${rank} of ${snapshot.sectorPerformance.length}` : undefined,
    },
    {
      label: 'Sector vs index',
      value: sectorRow ? percent(sectorRow.relativePct, 2) : '—',
      tone: sectorRow
        ? sectorRow.relativePct > 0
          ? 'text-pos'
          : sectorRow.relativePct < 0
            ? 'text-neg'
            : 'text-flow'
        : 'text-ink-3',
    },
    {
      label: snapshot.indexSymbol,
      value: percent(snapshot.indexChangePct, 2),
      tone:
        snapshot.indexChangePct > 0
          ? 'text-pos'
          : snapshot.indexChangePct < 0
            ? 'text-neg'
            : 'text-flow',
    },
  ]

  return (
    <Surface level="base" radius="lg" className="p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">
          Market context
        </span>
        <ProvenanceBadge kind="derived" bare />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <Badge variant={REGIME_VARIANT[snapshot.regime.regime]} size="sm">
          {regimeLabel(snapshot.regime.regime)}
        </Badge>
        <span className="text-2xs text-ink-3">{snapshot.regime.confidence}% confidence</span>
      </div>
      <p className="mt-2 text-2xs leading-relaxed text-ink-2">
        {regimeDescription(snapshot.regime.regime)}
      </p>

      <dl className="mt-3 divide-y divide-line/70">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between py-1.5">
            <dt className="text-2xs text-ink-3">
              {r.label}
              {r.sub && <span className="ml-1.5 text-ink-3/70">({r.sub})</span>}
            </dt>
            <dd className={cn('num text-xs font-medium', r.tone)}>{r.value}</dd>
          </div>
        ))}
      </dl>
    </Surface>
  )
}
