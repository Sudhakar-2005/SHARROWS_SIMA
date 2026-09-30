import { Sparkles } from 'lucide-react'
import { Badge, ProvenanceBadge, SectionHeader, Surface } from '@/design/primitives'
import { EVOLUTION_NARRATIVE } from './evolution-data'

/** How the loop improves itself — descriptive, labeled, no promises. */
export function EvolutionNarrative() {
  return (
    <Surface level="raised" radius="lg" className="p-4">
      <SectionHeader
        title="How SHARROW improves"
        context="Deterministic evaluate → learn → validate → deploy loop — no black box."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="accent" size="sm" shape="chip">
              <Sparkles className="size-3" aria-hidden="true" />
              Engine
            </Badge>
            <ProvenanceBadge kind="ai" bare />
          </div>
        }
      />

      <p className="mt-2 text-sm leading-relaxed text-ink">{EVOLUTION_NARRATIVE.headline}</p>

      <ul className="mt-3 space-y-2">
        {EVOLUTION_NARRATIVE.points.map((point) => (
          <li key={point} className="flex items-start gap-2 text-xs leading-relaxed text-ink-2">
            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </Surface>
  )
}
