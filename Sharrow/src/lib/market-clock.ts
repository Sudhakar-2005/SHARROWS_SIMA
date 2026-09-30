/**
 * NSE market clock — 09:15–15:30 IST, Mon–Fri.
 * All comparisons are done in IST regardless of the user's local timezone.
 */

const IST = 'Asia/Kolkata'

export type MarketPhase = 'pre-open' | 'open' | 'closed' | 'weekend'

interface ClockParts {
  weekday: number
  hour: number
  minute: number
  second: number
}

function istParts(now: Date): ClockParts {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: IST,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now)

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '0'

  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

  return {
    weekday: weekdayMap[get('weekday')] ?? 0,
    hour: Number(get('hour')),
    minute: Number(get('minute')),
    second: Number(get('second')),
  }
}

const toMinutes = (h: number, m: number) => h * 60 + m

const OPEN_MIN = toMinutes(9, 15)
const CLOSE_MIN = toMinutes(15, 30)
const PRE_OPEN_MIN = toMinutes(9, 0)

export function getMarketPhase(now: Date = new Date()): MarketPhase {
  const p = istParts(now)
  if (p.weekday === 0 || p.weekday === 6) return 'weekend'
  const t = toMinutes(p.hour, p.minute)
  if (t >= OPEN_MIN && t < CLOSE_MIN) return 'open'
  if (t >= PRE_OPEN_MIN && t < OPEN_MIN) return 'pre-open'
  return 'closed'
}

export function isMarketOpen(now: Date = new Date()): boolean {
  return getMarketPhase(now) === 'open'
}

/** Minutes until the next phase transition (open → close, or close → open). */
export function minutesToTransition(now: Date = new Date()): number {
  const p = istParts(now)
  const t = toMinutes(p.hour, p.minute)
  const workday = p.weekday >= 1 && p.weekday <= 5

  if (workday && t < OPEN_MIN) return OPEN_MIN - t
  if (workday && t < CLOSE_MIN) return CLOSE_MIN - t

  // After close (or weekend): roll forward to the next workday's open.
  let days = 0
  let day = p.weekday
  while (days < 7) {
    days += 1
    day = (day + 1) % 7
    if (day >= 1 && day <= 5) break
  }
  return days * 24 * 60 - t + OPEN_MIN
}

export function istTimeString(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: IST,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now)
}

export function istDateLabel(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(now)
}
