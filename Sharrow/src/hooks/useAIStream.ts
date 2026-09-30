import { useCallback, useEffect, useMemo, useState } from 'react'
import { useUIStore } from '@/store/ui-store'

export type AIStreamStatus = 'idle' | 'streaming' | 'done'

export interface AIStream {
  /** Text revealed so far. */
  text: string
  status: AIStreamStatus
  /** Reveal the remainder immediately (Enter while streaming). */
  finish: () => void
  /** Start streaming a new answer from the beginning. */
  start: (source: string) => void
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Word-chunked typewriter reveal for generated answers.
 * The chunk sizes jitter deterministically around the source text so the
 * cadence reads like streamed tokens, while finishing a long answer in
 * well under three seconds. Honours the store preference and the OS setting.
 */
export function useAIStream(initialSource = ''): AIStream {
  const motionPref = useUIStore((s) => s.reducedMotion)
  const reduced = motionPref === null ? prefersReducedMotion() : motionPref
  const [state, setState] = useState(() => ({ src: initialSource, n: 0 }))

  const done = state.n >= state.src.length

  useEffect(() => {
    if (reduced || done || state.src.length === 0) return
    const progress = state.n / state.src.length
    const base = progress > 0.75 ? 3 : progress > 0.4 ? 4 : 5
    const jitter = (state.src.charCodeAt(state.n % state.src.length) % 3) - 1
    const step = Math.max(1, base + jitter)
    const id = window.setTimeout(
      () => setState((s) => ({ ...s, n: Math.min(s.src.length, s.n + step) })),
      24,
    )
    return () => window.clearTimeout(id)
  }, [state, done, reduced])

  const finish = useCallback(() => setState((s) => ({ ...s, n: s.src.length })), [])
  const start = useCallback((source: string) => setState({ src: source, n: 0 }), [])

  return useMemo(() => {
    if (state.src.length === 0) return { text: '', status: 'idle' as const, finish, start }
    if (reduced || done)
      return { text: state.src, status: 'done' as const, finish, start }
    return { text: state.src.slice(0, state.n), status: 'streaming' as const, finish, start }
  }, [state, done, reduced, finish, start])
}
