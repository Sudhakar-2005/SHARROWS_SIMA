import type { AIState } from '@/design/tokens'
import type { ActivityKind, Insight, SourceRef } from '@/engine/types'

/** Pure helpers for the intelligence screen. */

export const INSIGHT_KIND_LABEL: Record<Insight['kind'], string> = {
  momentum: 'Momentum',
  regime: 'Regime',
  sector: 'Sector',
  risk: 'Risk',
  portfolio: 'Portfolio',
  event: 'Event',
  calibration: 'Calibration',
}

export const ACTIVITY_LABEL: Record<ActivityKind, string> = {
  observe: 'Observe',
  understand: 'Understand',
  analyze: 'Analyze',
  generate: 'Generate',
  track: 'Track',
  evaluate: 'Evaluate',
  learn: 'Learn',
  validate: 'Validate',
  improve: 'Improve',
  alert: 'Alert',
}

export const AI_STATE_VARIANT: Record<AIState, 'accent' | 'pos' | 'warn' | 'flow'> = {
  idle: 'flow',
  observing: 'accent',
  analyzing: 'accent',
  thinking: 'accent',
  evaluating: 'accent',
  learning: 'accent',
  alert: 'warn',
  ready: 'pos',
}

const IMPORTANCE_RANK = { critical: 0, important: 1, informational: 2 } as const

/** Critical first, then important, then informational — newest breaks ties. */
export function observations(insights: Insight[]): Insight[] {
  return [...insights].sort(
    (a, b) =>
      IMPORTANCE_RANK[a.importance] - IMPORTANCE_RANK[b.importance] ||
      b.createdAt - a.createdAt,
  )
}

/** Mean confidence across observations, rounded — null with no observations. */
export function averageConfidence(insights: Insight[]): number | null {
  if (insights.length === 0) return null
  const total = insights.reduce((sum, i) => sum + i.confidence, 0)
  return Math.round(total / insights.length)
}

export function criticalCount(insights: Insight[]): number {
  return insights.filter((i) => i.importance === 'critical').length
}

export interface KindCount {
  kind: Insight['kind']
  count: number
}

export function observationMix(insights: Insight[]): KindCount[] {
  const counts = new Map<Insight['kind'], number>()
  for (const i of insights) counts.set(i.kind, (counts.get(i.kind) ?? 0) + 1)
  return [...counts.entries()]
    .map(([kind, count]) => ({ kind, count }))
    .sort((a, b) => b.count - a.count || a.kind.localeCompare(b.kind))
}

export interface SourceSummary extends Pick<SourceRef, 'label' | 'kind'> {
  count: number
}

/** Distinct sources behind the current observations, most used first. */
export function sourceRollup(insights: Insight[]): SourceSummary[] {
  const map = new Map<string, SourceSummary>()
  for (const i of insights) {
    for (const s of i.sources) {
      const key = `${s.kind}::${s.label}`
      const hit = map.get(key)
      if (hit) hit.count += 1
      else map.set(key, { label: s.label, kind: s.kind, count: 1 })
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

/** Dot colour for an activity priority: 0 informational → 2 high risk. */
export function activityTone(priority: number): string {
  return priority >= 2 ? 'bg-neg' : priority === 1 ? 'bg-warn' : 'bg-flow'
}

/** Bar tone per observation kind — risk reads as a warning, calibration as flow. */
export function mixTone(kind: Insight['kind']): 'accent' | 'warn' | 'flow' {
  return kind === 'risk' ? 'warn' : kind === 'calibration' ? 'flow' : 'accent'
}
