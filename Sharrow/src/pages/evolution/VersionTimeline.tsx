import type { ReactNode } from 'react'
import { Dna } from 'lucide-react'
import { Badge, EmptyState, SectionHeader, Surface, Tag } from '@/design/primitives'
import type { IntelligenceVersion } from '@/engine/types'
import { timeAgo } from '@/lib/format'
import { VERSION_STATUS_LABEL, VERSION_STATUS_VARIANT } from './evolution-data'

interface VersionTimelineProps {
  versions: IntelligenceVersion[]
  /** Reference time — the latest intelligence cycle. */
  now: number
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-32 shrink-0 font-mono text-2xs uppercase tracking-[0.1em] text-ink-3">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-xs leading-relaxed text-ink-2">{children}</dd>
    </div>
  )
}

/** Release history: what changed, why, how it was validated and what it cost. */
export function VersionTimeline({ versions, now }: VersionTimelineProps) {
  return (
    <Surface level="base" radius="lg" className="p-4">
      <SectionHeader
        title="Version history"
        context="Each release states what changed, why, how it was validated and what it cost."
        actions={<span className="text-2xs text-ink-3">{versions.length} releases</span>}
      />

      {versions.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            size="sm"
            icon={<Dna className="size-5" aria-hidden="true" />}
            title="No releases yet"
            body="The first version entry appears when the intelligence engine deploys."
          />
        </div>
      ) : (
        <ol className="mt-3 space-y-3">
          {versions.map((v) => (
            <li key={v.version} className="rounded-md border border-line bg-surface-1 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="num text-sm font-semibold text-accent">{v.version}</span>
                <Badge variant={VERSION_STATUS_VARIANT[v.status]} size="sm" dot>
                  {VERSION_STATUS_LABEL[v.status]}
                </Badge>
                {v.relatedLearningIds.length > 0 && (
                  <Tag>
                    {v.relatedLearningIds.length} {v.relatedLearningIds.length === 1 ? 'learning' : 'learnings'}
                  </Tag>
                )}
                <span className="ml-auto text-2xs text-ink-3">{timeAgo(v.releasedAt, now)}</span>
              </div>

              <p className="mt-2 text-sm font-medium leading-snug text-ink">{v.changeSummary}</p>

              <dl className="mt-3 space-y-2">
                <Row label="Previous">{v.previousBehavior}</Row>
                <Row label="New behavior">{v.newBehavior}</Row>
                <Row label="Reason">{v.reason}</Row>
                <Row label="Validation">{v.validation}</Row>
                <Row label="Performance">{v.performanceImpact}</Row>
              </dl>
            </li>
          ))}
        </ol>
      )}
    </Surface>
  )
}
