import { SECTOR_NAME } from '@/data/universe'
import type { NewsItem, SectorId } from '@/engine/types'
import { cn } from '@/lib/cn'

/** Pure helpers for the research screen (news intelligence). */

export const SENTIMENT_VARIANT: Record<NewsItem['sentiment'], 'pos' | 'neg' | 'outline'> = {
  positive: 'pos',
  negative: 'neg',
  neutral: 'outline',
}

export const IMPACT_VARIANT: Record<NewsItem['marketImpact'], 'flow' | 'warn' | 'neg'> = {
  low: 'flow',
  moderate: 'warn',
  high: 'neg',
}

export const RELEVANCE_VARIANT: Record<
  NewsItem['portfolioRelevance'],
  'outline' | 'flow' | 'accent' | 'violet'
> = {
  none: 'outline',
  watch: 'flow',
  relevant: 'accent',
  material: 'violet',
}

export type ImpactFilter = 'all' | NewsItem['marketImpact']
export type RelevanceFilter = 'all' | NewsItem['portfolioRelevance']

export interface NewsFilters {
  text: string
  impact: ImpactFilter
  relevance: RelevanceFilter
}

export const DEFAULT_FILTERS: NewsFilters = { text: '', impact: 'all', relevance: 'all' }

/** Filter + rank: material/high items first, then newest. */
export function filterNews(items: NewsItem[], filters: NewsFilters): NewsItem[] {
  const text = filters.text.trim().toLowerCase()
  const rank = (n: NewsItem): number => {
    let r = 0
    if (n.portfolioRelevance === 'material') r += 4
    else if (n.portfolioRelevance === 'relevant') r += 2
    if (n.marketImpact === 'high') r += 3
    else if (n.marketImpact === 'moderate') r += 1
    return r
  }
  return items
    .filter((n) => {
      if (filters.impact !== 'all' && n.marketImpact !== filters.impact) return false
      if (filters.relevance !== 'all' && n.portfolioRelevance !== filters.relevance) return false
      if (!text) return true
      const hay = `${n.headline} ${n.summary} ${n.source} ${n.affectedSymbols.join(' ')}`.toLowerCase()
      return hay.includes(text)
    })
    .sort((a, b) => rank(b) - rank(a) || b.publishedAt - a.publishedAt)
}

export interface NewsStats {
  total: number
  highImpact: number
  portfolioRelevant: number
  sources: number
  avgConfidence: number | null
}

export function newsStats(items: NewsItem[]): NewsStats {
  if (items.length === 0) {
    return { total: 0, highImpact: 0, portfolioRelevant: 0, sources: 0, avgConfidence: null }
  }
  const sources = new Set(items.map((n) => n.source))
  const confidence = Math.round(items.reduce((sum, n) => sum + n.confidence, 0) / items.length)
  return {
    total: items.length,
    highImpact: items.filter((n) => n.marketImpact === 'high').length,
    portfolioRelevant: items.filter(
      (n) => n.portfolioRelevance === 'material' || n.portfolioRelevance === 'relevant',
    ).length,
    sources: sources.size,
    avgConfidence: confidence,
  }
}

const RELEVANCE_ORDER: NewsItem['portfolioRelevance'][] = [
  'material',
  'relevant',
  'watch',
  'none',
]

/** Counts per portfolio-relevance bucket, material first. */
export function relevanceMix(items: NewsItem[]): { key: NewsItem['portfolioRelevance']; count: number }[] {
  return RELEVANCE_ORDER.map((key) => ({
    key,
    count: items.filter((n) => n.portfolioRelevance === key).length,
  }))
}

export interface SourceCount {
  source: string
  count: number
}

/** Distinct sources, most active first. */
export function sourceMix(items: NewsItem[]): SourceCount[] {
  const map = new Map<string, number>()
  for (const n of items) map.set(n.source, (map.get(n.source) ?? 0) + 1)
  return [...map.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source))
}

export function sectorNames(ids: SectorId[]): string[] {
  return ids.map((id) => SECTOR_NAME[id])
}

/** Overall sentiment tone across the current set. */
export function sentimentTone(items: NewsItem[]): string {
  const net = items.reduce(
    (sum, n) => sum + (n.sentiment === 'positive' ? 1 : n.sentiment === 'negative' ? -1 : 0),
    0,
  )
  return cn(net > 0 ? 'text-pos' : net < 0 ? 'text-neg' : 'text-flow')
}
