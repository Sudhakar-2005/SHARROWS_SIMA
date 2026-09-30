import { Badge, ProgressBar, SectionHeader, Surface } from '@/design/primitives'
import type { NewsItem } from '@/engine/types'
import { RELEVANCE_VARIANT, relevanceMix, sentimentTone } from './research-data'

interface RelevanceMixCardProps {
  items: NewsItem[]
}

const RELEVANCE_LABEL: Record<NewsItem['portfolioRelevance'], string> = {
  material: 'Material',
  relevant: 'Relevant',
  watch: 'Watch',
  none: 'Not linked',
}

/** Portfolio-relevance mix and overall sentiment across the current set. */
export function RelevanceMixCard({ items }: RelevanceMixCardProps) {
  const mix = relevanceMix(items)
  const total = items.length
  const net = items.reduce(
    (sum, n) => sum + (n.sentiment === 'positive' ? 1 : n.sentiment === 'negative' ? -1 : 0),
    0,
  )

  return (
    <Surface level="raised" radius="lg" className="p-4">
      <SectionHeader
        title="Portfolio relevance"
        context="How much of the feed touches what you hold."
      />
      <div className="mt-3 space-y-3">
        {mix.map((row) => (
          <ProgressBar
            key={row.key}
            value={row.count}
            max={Math.max(total, 1)}
            label={RELEVANCE_LABEL[row.key]}
            valueLabel={String(row.count)}
            tone={row.key === 'material' ? 'accent' : row.key === 'relevant' ? 'flow' : 'accent'}
          />
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
        <span className="text-2xs text-ink-3">Net sentiment</span>
        <span className={sentimentTone(items)}>
          {net > 0 ? 'positive' : net < 0 ? 'negative' : 'balanced'}{' '}
          <span className="num text-ink-2">
            {net > 0 ? `+${net}` : String(net)}
          </span>
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {(['material', 'relevant', 'watch', 'none'] as const).map((key) => (
          <Badge key={key} variant={RELEVANCE_VARIANT[key]} size="sm" shape="chip">
            {key}
          </Badge>
        ))}
      </div>
    </Surface>
  )
}
