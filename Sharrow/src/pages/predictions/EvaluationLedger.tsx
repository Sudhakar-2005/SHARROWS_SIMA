import { useNavigate } from 'react-router-dom'
import { ClipboardCheck } from 'lucide-react'
import {
  Badge,
  DataTable,
  EmptyState,
  ProvenanceBadge,
  SectionHeader,
  Surface,
  type Column,
} from '@/design/primitives'
import type { Prediction } from '@/engine/types'
import { timeAgo } from '@/lib/format'
import { OUTCOME_LABEL, OUTCOME_VARIANT } from '../overview/overview-data'
import { gapTone, outcomeGap } from './predictions-data'

interface EvaluationLedgerProps {
  predictions: Prediction[]
  /** Reference time — the latest intelligence cycle. */
  now: number
}

/** Every evaluated scenario with expected vs actual move and verdict. */
export function EvaluationLedger({ predictions, now }: EvaluationLedgerProps) {
  const navigate = useNavigate()

  const columns: Column<Prediction>[] = [
    {
      id: 'asset',
      header: 'Scenario',
      cell: (p) => (
        <div className="min-w-0">
          <div className="font-medium text-ink">{p.symbol}</div>
          <div className="truncate text-2xs text-ink-3">{p.title}</div>
        </div>
      ),
      sortable: true,
      sortValue: (p) => p.symbol,
    },
    {
      id: 'outcome',
      header: 'Outcome',
      width: '116px',
      cell: (p) => (
        <Badge variant={OUTCOME_VARIANT[p.evaluation!.verdict]} size="sm">
          {OUTCOME_LABEL[p.evaluation!.verdict]}
        </Badge>
      ),
      sortable: true,
      sortValue: (p) => p.evaluation?.verdict ?? '',
    },
    {
      id: 'expected',
      header: 'Expected',
      align: 'right',
      width: '96px',
      cell: (p) => (
        <span className="num text-xs text-ink-2">
          {p.expectedMovePct !== undefined ? `${p.expectedMovePct > 0 ? '+' : ''}${p.expectedMovePct.toFixed(1)}%` : '—'}
        </span>
      ),
      sortable: true,
      sortValue: (p) => p.expectedMovePct ?? -999,
    },
    {
      id: 'actual',
      header: 'Actual',
      align: 'right',
      width: '96px',
      cell: (p) => {
        const tone =
          (p.actualMovePct ?? 0) > 0 ? 'text-pos' : (p.actualMovePct ?? 0) < 0 ? 'text-neg' : 'text-flow'
        return (
          <span className={`num text-xs ${tone}`}>
            {p.actualMovePct !== undefined ? `${p.actualMovePct > 0 ? '+' : ''}${p.actualMovePct.toFixed(1)}%` : '—'}
          </span>
        )
      },
      sortable: true,
      sortValue: (p) => p.actualMovePct ?? -999,
    },
    {
      id: 'gap',
      header: 'Gap',
      align: 'right',
      width: '88px',
      cell: (p) => {
        const gap = outcomeGap(p)
        if (gap === null) return <span className="text-2xs text-ink-3">—</span>
        return <span className={gapTone(gap)}>{gap > 0 ? '+' : ''}{gap.toFixed(1)} pts</span>
      },
      sortable: true,
      sortValue: (p) => outcomeGap(p) ?? -999,
    },
    {
      id: 'horizon',
      header: 'Horizon',
      width: '104px',
      cell: (p) => <span className="text-2xs text-ink-3">{p.horizon}</span>,
      sortable: true,
      sortValue: (p) => p.horizonDays,
    },
    {
      id: 'evaluated',
      header: 'Evaluated',
      align: 'right',
      width: '104px',
      cell: (p) => (
        <span className="text-2xs text-ink-3">{timeAgo(p.evaluation!.at, now)}</span>
      ),
      sortable: true,
      sortValue: (p) => p.evaluation?.at ?? 0,
    },
  ]

  return (
    <Surface level="base" radius="lg" className="p-4">
      <SectionHeader
        title="Evaluation ledger"
        context="Resolved scenarios scored against what actually happened — expected versus actual, with the gap."
        actions={
          <div className="flex items-center gap-2">
            <span className="text-2xs text-ink-3">{predictions.length} evaluated</span>
            <ProvenanceBadge kind="backtest" bare />
          </div>
        }
      />

      <div className="mt-3">
        <DataTable
          columns={columns}
          rows={predictions}
          getRowId={(p) => p.id}
          caption="Evaluated scenarios with outcomes and expected versus actual moves"
          onRowClick={(p) => navigate(`/asset/${p.symbol}`)}
          initialSort={{ columnId: 'evaluated', direction: 'desc' }}
          dense
          className="border-0 bg-transparent"
          emptyState={
            <EmptyState
              size="sm"
              icon={<ClipboardCheck className="size-5" aria-hidden="true" />}
              title="No evaluations yet"
              body="The first ledger entries appear once framed scenarios reach their horizon."
            />
          }
        />
      </div>
    </Surface>
  )
}
