import { cn } from '@/lib/cn'

interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  valueLabel?: string
  /** Screen-reader-only accessible name, when the visible label is omitted. */
  srLabel?: string
  tone?: 'accent' | 'pos' | 'warn' | 'neg' | 'flow'
  size?: 'sm' | 'md'
  className?: string
  /** Hidden from assistive tech when the value is already announced nearby. */
  hideAria?: boolean
}

const toneClass = {
  accent: 'bg-accent',
  pos: 'bg-pos',
  warn: 'bg-warn',
  neg: 'bg-neg',
  flow: 'bg-flow',
}

export function ProgressBar({
  value,
  max = 100,
  label,
  valueLabel,
  srLabel,
  tone = 'accent',
  size = 'sm',
  className,
  hideAria = false,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(max, value))
  const pct = (clamped / max) * 100

  return (
    <div className={cn('w-full', className)}>
      {(label || valueLabel) && (
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          {label && <span className="text-xs text-ink-3">{label}</span>}
          {valueLabel && <span className="num text-xs text-ink-2">{valueLabel}</span>}
        </div>
      )}
      <div
        className={cn('w-full overflow-hidden rounded-full bg-surface-3', size === 'sm' ? 'h-1' : 'h-1.5')}
        role={hideAria ? undefined : 'progressbar'}
        aria-valuemin={hideAria ? undefined : 0}
        aria-valuemax={hideAria ? undefined : max}
        aria-valuenow={hideAria ? undefined : Math.round(clamped)}
        aria-label={hideAria ? undefined : (srLabel ?? label)}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-[600ms] ease-premium', toneClass[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
