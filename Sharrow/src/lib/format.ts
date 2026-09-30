/**
 * SHARROW formatters.
 * Indian-market numeric conventions with tabular, scannable output.
 * Never fabricate precision — round only where the source data is rounded.
 */

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const inrWholeFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const inrCompactFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  notation: 'compact',
  maximumFractionDigits: 1,
})

const compactFormatter = new Intl.NumberFormat('en-IN', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const plainFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 2,
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const timeFormatter = new Intl.DateTimeFormat('en-IN', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const dayFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export function inr(value: number, fractionDigits = 2): string {
  if (!Number.isFinite(value)) return '—'
  if (fractionDigits === 0) return inrWholeFormatter.format(Math.round(value))
  const f =
    fractionDigits === 2
      ? inrFormatter
      : new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: fractionDigits,
          maximumFractionDigits: fractionDigits,
        })
  return f.format(value)
}

export function inrCompact(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return inrCompactFormatter.format(value)
}

export function compact(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return compactFormatter.format(value)
}

export function plain(value: number, maxDigits = 2): string {
  if (!Number.isFinite(value)) return '—'
  if (maxDigits === 2) return plainFormatter.format(value)
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: maxDigits }).format(value)
}

export function percent(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—'
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${Math.abs(value).toFixed(digits)}%`
}

export function percentPlain(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return '—'
  return `${value.toFixed(digits)}%`
}

export function signed(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—'
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${Math.abs(value).toFixed(digits)}`
}

export function signedCompact(value: number): string {
  if (!Number.isFinite(value)) return '—'
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${compactFormatter.format(Math.abs(value))}`
}

export function clock(date: Date | number | string): string {
  return timeFormatter.format(new Date(date))
}

export function dateTime(date: Date | number | string): string {
  return dateTimeFormatter.format(new Date(date))
}

export function day(date: Date | number | string): string {
  return dayFormatter.format(new Date(date))
}

export function timeAgo(date: Date | number | string, now: Date | number = Date.now()): string {
  const then = new Date(date).getTime()
  const diff = Math.max(0, new Date(now).getTime() - then)
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return day(date)
}

export function durationLabel(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.round((ms % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}

/** Direction of a numeric change, used to pick semantics + icons consistently. */
export type Direction = 'up' | 'down' | 'flat'

export function direction(value: number, epsilon = 0.0001): Direction {
  if (value > epsilon) return 'up'
  if (value < -epsilon) return 'down'
  return 'flat'
}

export const directionClass: Record<Direction, string> = {
  up: 'text-pos',
  down: 'text-neg',
  flat: 'text-flow',
}
