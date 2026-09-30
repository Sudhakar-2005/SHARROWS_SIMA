import { GraduationCap } from 'lucide-react'
import {
  Badge,
  DataTable,
  EmptyState,
  SectionHeader,
  Surface,
  type Column,
} from '@/design/primitives'
import type { LearningEvent } from '@/engine/types'
import { timeAgo } from '@/lib/format'
import { LEARNING_KIND_LABEL, LEARNING_STATUS_VARIANT, learningTimeline } from './evolution-data'

interface LearningLedgerProps {
  learnings: LearningEvent[]
  /** Reference time — the latest intelligence cycle. */
  now: number
}

/** Full learning record: kind, status, sample depth, effect size and evidence. */
export function LearningLedger({ learnings, now }: LearningLedgerProps) {
  const rows = learningTimeline(learnings)

  const columns: Column<LearningEvent>[] = [
    {
      id: 'title',
      header: 'Learning',
      cell: (l) => (
        <div className="min-w-0">
          <div className="font-medium text-ink">{l.title}</div>
          <div className="truncate text-2xs text-ink-3">{l.detail}</div>
        </div>
      ),
      sortable: true,
      sortValue: (l) => l.title,
    },
    {
      id: 'kind',
      header: 'Kind',
      width: '150px',
      cell: (l) => <span className="text-2xs text-ink-3">{LEARNING_KIND_LABEL[l.kind]}</span>,
      sortable: true,
      sortValue: (l) => l.kind,
    },
    {
      id: 'status',
      header: 'Status',
      width: '116px',
      cell: (l) => (
        <Badge variant={LEARNING_STATUS_VARIANT[l.status]} size="sm" shape="chip">
          {l.status}
        </Badge>
      ),
      sortable: true,
      sortValue: (l) => l.status,
    },
    {
      id: 'sample',
      header: 'Sample',
      align: 'right',
      width: '90px',
      cell: (l) => <span className="num text-xs text-ink-2">n={l.sampleSize}</span>,
      sortable: true,
      sortValue: (l) => l.sampleSize,
    },
    {
      id: 'effect',
      header: 'Effect',
      align: 'right',
      width: '90px',
      cell: (l) => (
        <span className="num text-xs text-ink-2">
          {l.effectSize !== undefined ? l.effectSize.toFixed(2) : '—'}
        </span>
      ),
      sortable: true,
      sortValue: (l) => l.effectSize ?? -999,
    },
    {
      id: 'detected',
      header: 'Detected',
      align: 'right',
      width: '104px',
      cell: (l) => <span className="text-2xs text-ink-3">{timeAgo(l.detectedAt, now)}</span>,
      sortable: true,
      sortValue: (l) => l.detectedAt,
    },
  ]

  return (
    <Surface level="base" radius="lg" className="p-4">
      <SectionHeader
        title="Learning ledger"
        context="Patterns, calibration fixes and regime behavior found in evaluated outcomes."
        actions={<span className="text-2xs text-ink-3">{rows.length} recorded</span>}
      />

      <div className="mt-3">
        <DataTable
          columns={columns}
          rows={rows}
          getRowId={(l) => l.id}
          caption="Learnings with kind, status, sample size and effect size"
          initialSort={{ columnId: 'detected', direction: 'desc' }}
          dense
          className="border-0 bg-transparent"
          emptyState={
            <EmptyState
              size="sm"
              icon={<GraduationCap className="size-5" aria-hidden="true" />}
              title="No learnings yet"
              body="Learnings appear once evaluated outcomes show a repeatable pattern worth keeping."
            />
          }
        />
      </div>
    </Surface>
  )
}
