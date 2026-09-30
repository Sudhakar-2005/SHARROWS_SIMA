import { Search } from 'lucide-react'
import { Button, Input, Select } from '@/design/primitives'
import {
  DEFAULT_FILTERS,
  type ImpactFilter,
  type NewsFilters,
  type RelevanceFilter,
} from './research-data'

interface NewsControlsProps {
  filters: NewsFilters
  shown: number
  total: number
  onChange: (next: NewsFilters) => void
}

const IMPACT_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All impact' },
  { value: 'high', label: 'High impact' },
  { value: 'moderate', label: 'Moderate impact' },
  { value: 'low', label: 'Low impact' },
]

const RELEVANCE_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All relevance' },
  { value: 'material', label: 'Material to holdings' },
  { value: 'relevant', label: 'Relevant to holdings' },
  { value: 'watch', label: 'Watch' },
  { value: 'none', label: 'Not portfolio-linked' },
]

/** Search + impact/relevance filters above the news feed. */
export function NewsControls({ filters, shown, total, onChange }: NewsControlsProps) {
  const dirty =
    filters.text !== '' || filters.impact !== 'all' || filters.relevance !== 'all'

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        prefix={<Search className="size-3.5" aria-hidden="true" />}
        placeholder="Search headlines, sources, symbols"
        value={filters.text}
        onChange={(e) => onChange({ ...filters, text: e.target.value })}
        aria-label="Search headlines, sources or symbols"
        className="w-full sm:w-72"
      />
      <Select
        options={IMPACT_OPTIONS}
        value={filters.impact}
        onChange={(e) =>
          onChange({ ...filters, impact: e.target.value as ImpactFilter })
        }
        aria-label="Filter by market impact"
        className="w-auto"
      />
      <Select
        options={RELEVANCE_OPTIONS}
        value={filters.relevance}
        onChange={(e) =>
          onChange({ ...filters, relevance: e.target.value as RelevanceFilter })
        }
        aria-label="Filter by portfolio relevance"
        className="w-auto"
      />
      {dirty && (
        <Button size="sm" variant="ghost" onClick={() => onChange(DEFAULT_FILTERS)}>
          Clear
        </Button>
      )}
      <span className="ml-auto text-2xs text-ink-3">
        {shown} of {total} shown
      </span>
    </div>
  )
}
