import { Link } from 'react-router-dom'
import { ArrowRight, BellOff } from 'lucide-react'
import {
  Badge,
  Button,
  EmptyState,
  ProvenanceBadge,
  SectionHeader,
  Surface,
} from '@/design/primitives'
import { timeAgo } from '@/lib/format'
import {
  type Alert,
  type PriorityFilter,
  KIND_LABEL,
  PRIORITY_LABEL,
  PRIORITY_VARIANT,
} from './alerts-data'

interface AlertListProps {
  alerts: Alert[]
  filter: PriorityFilter
  now: number
  onClearFilter: () => void
}

/** Priority-ordered alert queue: what happened, why it matters, what supports it. */
export function AlertList({ alerts, filter, now, onClearFilter }: AlertListProps) {
  return (
    <Surface level="base" radius="lg" className="p-4">
      <SectionHeader
        title="Alert queue"
        context="Sorted by priority, then recency — every alert states what happened, why it matters and what supports it."
        actions={<span className="text-2xs text-ink-3">{alerts.length} alerts</span>}
      />

      {alerts.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            size="sm"
            icon={<BellOff className="size-5" aria-hidden="true" />}
            title={
              filter === 'all'
                ? 'No alerts need your attention'
                : `No ${PRIORITY_LABEL[filter]} alerts right now`
            }
            body={
              filter === 'all'
                ? 'SHARROW raises alerts only when a change is significant enough to act on — momentum shifts, regime changes and risk events. Routine price moves are never escalated.'
                : 'Nothing sits at this priority in the current cycle — clear the filter to see the full queue.'
            }
            action={
              filter !== 'all' ? (
                <Button size="sm" variant="soft" onClick={onClearFilter}>
                  Show all priorities
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <ul className="mt-3 space-y-3">
          {alerts.map((a) => (
            <li
              key={a.id}
              className="rounded-md border border-line bg-surface-1 p-4 transition-colors hover:border-line-strong"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={PRIORITY_VARIANT[a.priority]} size="sm" dot>
                  {PRIORITY_LABEL[a.priority]}
                </Badge>
                <Badge variant="solid" size="sm" shape="chip">
                  {KIND_LABEL[a.kind]}
                </Badge>
                <ProvenanceBadge kind={a.provenance} bare />
                <span className="ml-auto text-2xs text-ink-3">{timeAgo(a.at, now)}</span>
              </div>

              <h3 className="mt-2 text-sm font-medium leading-snug text-ink">{a.title}</h3>

              <div className="mt-2">
                <span className="font-mono text-2xs uppercase tracking-[0.1em] text-ink-3">
                  Why it matters
                </span>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-2">{a.why}</p>
              </div>

              <div className="mt-3 border-t border-line pt-3">
                <span className="font-mono text-2xs uppercase tracking-[0.1em] text-ink-3">
                  Evidence
                </span>
                <ul className="mt-1 space-y-0.5">
                  {a.evidence.map((e) => (
                    <li key={e} className="flex items-start gap-2 text-xs text-ink-3">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-ink-3" aria-hidden="true" />
                      {e}
                    </li>
                  ))}
                </ul>
              </div>

              {a.href && (
                <div className="mt-3 flex justify-end">
                  <Link
                    to={a.href}
                    className="inline-flex items-center gap-1 text-xs text-accent transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    Open context
                    <ArrowRight className="size-3" aria-hidden="true" />
                  </Link>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Surface>
  )
}
