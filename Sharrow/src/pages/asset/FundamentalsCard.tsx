import { ProvenanceBadge, Surface } from '@/design/primitives'
import { FUNDAMENTALS } from '@/data/universe'
import { compact, plain } from '@/lib/format'

interface FundamentalsCardProps {
  symbol: string
}

/** Simulated fundamental snapshot — never presented as reported financials. */
export function FundamentalsCard({ symbol }: FundamentalsCardProps) {
  const f = FUNDAMENTALS[symbol]
  if (!f) return null

  const rows = [
    { label: 'P/E', value: plain(f.pe, 1) },
    { label: 'P/B', value: plain(f.pb, 1) },
    { label: 'ROE', value: `${plain(f.roe, 1)}%` },
    { label: 'Debt / equity', value: plain(f.de, 2) },
    { label: 'Dividend yield', value: `${plain(f.divYield, 2)}%` },
    { label: 'Earnings growth', value: `${f.earningsGrowth >= 0 ? '+' : ''}${plain(f.earningsGrowth, 1)}%` },
    { label: 'Revenue growth', value: `${f.revenueGrowth >= 0 ? '+' : ''}${plain(f.revenueGrowth, 1)}%` },
    { label: 'Market cap', value: `₹${compact(f.mcapCr)} Cr` },
  ]

  return (
    <Surface level="base" radius="lg" className="p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">
          Fundamentals
        </span>
        <ProvenanceBadge kind="simulated" bare />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="rounded-md bg-surface-2 px-2.5 py-2">
            <dt className="text-2xs text-ink-3">{r.label}</dt>
            <dd className="num mt-0.5 text-sm font-medium text-ink">{r.value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 text-2xs leading-relaxed text-ink-3">
        Fixture values used to drive fundamental signals — not reported financials.
      </p>
    </Surface>
  )
}
