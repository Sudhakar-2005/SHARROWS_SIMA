import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'
import { Pill } from '@/design/primitives'
import { getMarketPhase, istTimeString, minutesToTransition, istDateLabel, type MarketPhase } from '@/lib/market-clock'

const PHASE_META: Record<MarketPhase, { label: string; dot: string; tone: 'pos' | 'warn' | 'flow' }> = {
  open: { label: 'NSE OPEN', dot: 'bg-pos', tone: 'pos' },
  'pre-open': { label: 'PRE-OPEN', dot: 'bg-warn', tone: 'warn' },
  closed: { label: 'NSE CLOSED', dot: 'bg-flow', tone: 'flow' },
  weekend: { label: 'WEEKEND', dot: 'bg-flow', tone: 'flow' },
}

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

function formatRemaining(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

/** Live market status — phase, IST clock, time to next transition. */
export function MarketStatus({ className }: { className?: string }) {
  const now = useNow(1000)
  const phase = getMarketPhase(now)
  const meta = PHASE_META[phase]
  const minutes = minutesToTransition(now)
  const isOpen = phase === 'open'

  return (
    <div
      className={cn('flex items-center gap-2.5', className)}
      aria-label={`Market status: ${meta.label}, India time ${istTimeString(now)}`}
    >
      <Pill variant={meta.tone === 'pos' ? 'pos' : meta.tone === 'warn' ? 'warn' : 'flow'} dot size="sm">
        {meta.label}
      </Pill>
      <span className="num hidden text-2xs text-ink-3 xl:inline">{istTimeString(now)} IST</span>
      <span className="hidden text-2xs text-ink-3 xl:inline">·</span>
      <span className="hidden text-2xs text-ink-3 xl:inline">
        {isOpen ? 'closes in' : phase === 'pre-open' ? 'opens in' : 'opens in'} {formatRemaining(minutes)}
      </span>
      <span className="sr-only">{istDateLabel(now)}</span>
    </div>
  )
}
