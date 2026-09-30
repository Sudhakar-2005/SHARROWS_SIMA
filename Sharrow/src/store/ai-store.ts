import { create } from 'zustand'
import type { AIState } from '@/design/tokens'
import type { ActivityEvent } from '@/engine/types'

interface AIStore {
  state: AIState
  /** Short label shown next to the core, e.g. "Observing markets". */
  label: string
  /** Progress 0–1 for staged operations, null when idle. */
  progress: number | null
  activity: ActivityEvent[]
  lastEvaluatedAt: number | null
  setState: (state: AIState, label?: string) => void
  setProgress: (progress: number | null) => void
  pushActivity: (event: ActivityEvent) => void
}

const MAX_ACTIVITY = 60

export const useAIStore = create<AIStore>((set) => ({
  state: 'ready',
  label: 'Monitoring markets',
  progress: null,
  activity: [],
  lastEvaluatedAt: null,
  setState: (state, label) => set({ state, label }),
  setProgress: (progress) => set({ progress }),
  pushActivity: (event) =>
    set((s) => ({
      activity: [event, ...s.activity].slice(0, MAX_ACTIVITY),
      lastEvaluatedAt: event.kind === 'evaluate' ? event.at : s.lastEvaluatedAt,
    })),
}))
