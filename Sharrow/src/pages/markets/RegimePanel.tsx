import { Badge, Surface } from '@/design/primitives'
import type { RegimeAssessment } from '@/engine/regime'
import { regimeDescription, regimeLabel } from '@/engine/regime'
import { signed } from '@/lib/format'
import { REGIME_VARIANT } from '../overview/overview-data'
import { cn } from '@/lib/cn'

interface RegimePanelProps {
  assessment: RegimeAssessment
}

const COMPONENTS: { key: keyof RegimeAssessment['components']; label: string }[] = [
  { key: 'trend', label: 'Trend' },
  { key: 'momentum', label: 'Momentum' },
  { key: 'volatility', label: 'Volatility' },
  { key: 'drawdown', label: 'Drawdown' },
  { key: 'breadth', label: 'Breadth' },
]

/** Diverging bar from −2 to +2 — the component's contribution to the verdict. */
function ComponentBar({ value }: { value: number }) {
  const magnitude = (Math.min(Math.abs(value), 2) / 2) * 50
  const positive = value > 0
  return (
    <span className="relative block h-1.5 overflow-hidden rounded-full bg-surface-3">
      <span className="absolute top-0 bottom-0 left-1/2 w-px bg-line-strong" aria-hidden="true" />
      {value !== 0 && (
        <span
          className={cn(
            'absolute top-0 bottom-0 rounded-full',
            positive ? 'left-1/2 bg-pos' : 'right-1/2 bg-neg',
          )}
          style={{ width: `${magnitude}%` }}
          aria-hidden="true"
        />
      )}
    </span>
  )
}

/** The anchor classification: labelled verdict, confidence, evidence, components. */
export function RegimePanel({ assessment }: RegimePanelProps) {
  const { regime, confidence, score, evidence, components } = assessment
  const magnitude = (Math.min(Math.abs(score), 100) / 100) * 50
  const positive = score >= 0

  return (
    <Surface level="base" radius="lg" className="p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">
          Market regime
        </span>
        <Badge variant={REGIME_VARIANT[regime]} size="sm">
          {regimeLabel(regime)}
        </Badge>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-3">
        <span className="text-xs text-ink-3">Composite score</span>
        <span className="num text-sm font-semibold text-ink">{signed(score, 0)}</span>
      </div>
      <div className="relative mt-1.5 h-2 overflow-hidden rounded-full bg-surface-3">
        <span className="absolute top-0 bottom-0 left-1/2 w-px bg-line-strong" aria-hidden="true" />
        <span
          className={cn(
            'absolute top-0 bottom-0 rounded-full',
            positive ? 'left-1/2 bg-pos' : 'right-1/2 bg-neg',
          )}
          style={{ width: `${magnitude}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-2xs text-ink-3">
        <span className="num">−100</span>
        <span>{confidence}% confidence</span>
        <span className="num">+100</span>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-ink-2">{regimeDescription(regime)}</p>

      <div className="mt-4 space-y-2">
        <span className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">
          Components
        </span>
        {COMPONENTS.map((c) => (
          <div key={c.key} className="grid grid-cols-[76px_1fr_28px] items-center gap-2.5">
            <span className="text-2xs text-ink-2">{c.label}</span>
            <ComponentBar value={components[c.key]} />
            <span
              className={cn(
                'num text-right text-2xs',
                components[c.key] > 0
                  ? 'text-pos'
                  : components[c.key] < 0
                    ? 'text-neg'
                    : 'text-flow',
              )}
            >
              {signed(components[c.key], 0)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <span className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">Evidence</span>
        <ul className="mt-2 space-y-1.5">
          {evidence.map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-ink-2">
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </Surface>
  )
}
