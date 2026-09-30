import { SectionHeader, Surface } from '@/design/primitives'
import type { NewsItem } from '@/engine/types'
import { sourceMix } from './research-data'

interface NewsSourcesCardProps {
  items: NewsItem[]
}

/** Distinct wire sources behind the current set, most active first. */
export function NewsSourcesCard({ items }: NewsSourcesCardProps) {
  const rows = sourceMix(items)

  return (
    <Surface level="raised" radius="lg" className="p-4">
      <SectionHeader
        title="Wire sources"
        context={`${rows.length} distinct ${rows.length === 1 ? 'source' : 'sources'} scored in this window.`}
      />
      <ul className="mt-3 space-y-2">
        {rows.map((row) => (
          <li key={row.source} className="flex items-center justify-between gap-3">
            <span className="truncate text-xs text-ink-2">{row.source}</span>
            <span className="num shrink-0 text-2xs text-ink-3">×{row.count}</span>
          </li>
        ))}
      </ul>
    </Surface>
  )
}
