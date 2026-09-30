import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageLayout } from '@/components/shell/PageLayout'
import { Button, ErrorState, ProvenanceBadge, Skeleton } from '@/design/primitives'
import { useIntelligenceStore } from '@/store/intelligence-store'
import { useMarketStore } from '@/store/market-store'
import { AlertList } from './alerts/AlertList'
import { AlertPolicyCard } from './alerts/AlertPolicyCard'
import { AlertStrip } from './alerts/AlertStrip'
import { PriorityMixCard } from './alerts/PriorityMixCard'
import {
  type AlertPriority,
  type PriorityFilter,
  buildAlerts,
  filterByPriority,
  parsePriority,
  priorityCounts,
} from './alerts/alerts-data'

function AlertsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading alerts">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

const FILTERS: { key: PriorityFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'high-risk', label: 'High risk' },
  { key: 'important', label: 'Important' },
  { key: 'informational', label: 'Informational' },
]

export default function AlertsPage() {
  const status = useIntelligenceStore((s) => s.status)
  const error = useIntelligenceStore((s) => s.error)
  const snapshot = useIntelligenceStore((s) => s.snapshot)
  const analyses = useIntelligenceStore((s) => s.analyses)
  const predictions = useIntelligenceStore((s) => s.predictions)
  const learnings = useIntelligenceStore((s) => s.learnings)
  const news = useMarketStore((s) => s.news)
  const events = useMarketStore((s) => s.events)
  const quotes = useMarketStore((s) => s.quotes)

  const [searchParams, setSearchParams] = useSearchParams()
  const [filter, setFilter] = useState<PriorityFilter>(
    () => parsePriority(searchParams.get('priority')) ?? 'all',
  )

  useEffect(() => {
    void useIntelligenceStore.getState().initialize()
  }, [])

  const alerts = useMemo(
    () =>
      snapshot
        ? buildAlerts({ snapshot, analyses, predictions, learnings, news, events, quotes })
        : [],
    [snapshot, analyses, predictions, learnings, news, events, quotes],
  )
  const counts = useMemo(() => priorityCounts(alerts), [alerts])
  const rows = useMemo(() => filterByPriority(alerts, filter), [alerts, filter])

  const applyFilter = (next: PriorityFilter) => {
    setFilter(next)
    setSearchParams(next === 'all' ? {} : { priority: next }, { replace: true })
  }

  const retry = () => {
    useIntelligenceStore.getState().reset()
    void useIntelligenceStore.getState().initialize()
  }

  return (
    <PageLayout
      eyebrow="Priority-aware notifications"
      title="Alerts"
      subtitle="Informational, important or high risk — each alert explains why it matters and what supports it."
      provenance="ai"
      actions={
        <div className="flex items-center gap-3">
          <span className="text-2xs text-ink-3">{alerts.length} open alerts</span>
          <ProvenanceBadge kind="derived" bare />
        </div>
      }
      rail={
        status === 'ready' && snapshot ? (
          <div className="space-y-4">
            <PriorityMixCard alerts={alerts} />
            <AlertPolicyCard alerts={alerts} />
          </div>
        ) : undefined
      }
    >
      {status === 'error' ? (
        <ErrorState
          title="Alerts could not start"
          body={error ?? 'The engine that raises alerts did not come up.'}
          onRetry={retry}
        />
      ) : status !== 'ready' || !snapshot ? (
        <AlertsSkeleton />
      ) : (
        <div className="space-y-4">
          <AlertStrip counts={counts} />

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter alerts by priority">
            {FILTERS.map((f) => {
              const active = filter === f.key
              const n = f.key === 'all' ? alerts.length : counts[f.key as AlertPriority]
              return (
                <Button
                  key={f.key}
                  size="sm"
                  variant={active ? 'primary' : 'soft'}
                  onClick={() => applyFilter(f.key)}
                  aria-pressed={active}
                >
                  {f.label}
                  <span className="num text-2xs opacity-70">{n}</span>
                </Button>
              )
            })}
          </div>

          <AlertList
            alerts={rows}
            filter={filter}
            now={snapshot.at}
            onClearFilter={() => applyFilter('all')}
          />

          <div className="flex items-center gap-2 pt-1">
            <p className="text-2xs text-ink-3">
              Alerts come from the simulated engine and are labeled as such — explanations of
              current state, never instructions to trade.
            </p>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
