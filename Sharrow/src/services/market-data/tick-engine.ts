import { tickQuotes } from './quotes'

let timer: ReturnType<typeof setInterval> | null = null

/**
 * Advances simulated prices on an interval.
 * Pauseable — used when the tab is hidden or the user freezes the feed.
 */
export function startTickEngine(onTick: (moved: number, at: number) => void, intervalMs = 2000) {
  if (timer) return
  timer = setInterval(() => {
    const at = Date.now()
    const moved = tickQuotes(at)
    onTick(moved, at)
  }, intervalMs)
}

export function stopTickEngine() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

export function isTickEngineRunning() {
  return timer !== null
}
