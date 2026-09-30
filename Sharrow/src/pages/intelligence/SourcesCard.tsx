import { SectionHeader, Surface, Tag } from '@/design/primitives'
import type { Insight } from '@/engine/types'
import { sourceRollup } from './intelligence-data'

interface SourcesCardProps {
  insights: Insight[]
}

const KIND_LABEL = {
  engine: 'ENGINE',
  dataset: 'DATASET',
  news: 'NEWS',
  exchange: 'EXCHANGE',
} as const

/** Evidence lineage: every source behind the current observations. */
export function SourcesCard({ insights }: SourcesCardProps) {
  const sources = sourceRollup(insights)

  return (
    <Surface level="base" radius="lg" className="p-4">
      <SectionHeader
        title="Evidence sources"
        context="Inputs the current observations were drawn from."
        actions={<span className="text-2xs text-ink-3">{sources.length} distinct</span>}
      />
      {sources.length === 0 ? (
        <p className="mt-3 text-2xs text-ink-3">No sources recorded yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {sources.map((s) => (
            <li key={`${s.kind}-${s.label}`} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <Tag>{KIND_LABEL[s.kind]}</Tag>
                <span className="truncate text-xs text-ink-2">{s.label}</span>
              </div>
              <span className="num shrink-0 text-2xs text-ink-3">×{s.count}</span>
            </li>
          ))}
        </ul>
      )}
    </Surface>
  )
}
