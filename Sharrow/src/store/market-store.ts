import { create } from 'zustand'
import type { MarketEvent, NewsItem, Quote } from '@/engine/types'
import {
  allSymbols,
  computeQuote,
  registerProvider,
  simulatedProvider,
  startTickEngine,
  stopTickEngine,
} from '@/services/market-data'

export type MarketStatus = 'idle' | 'loading' | 'ready' | 'error'

interface MarketStore {
  status: MarketStatus
  error: string | null
  quotes: Record<string, Quote>
  news: NewsItem[]
  events: MarketEvent[]
  lastTickAt: number | null
  /** User-controlled freeze of the simulated feed. */
  feedPaused: boolean
  load: () => Promise<void>
  tickNow: () => void
  setFeedPaused: (paused: boolean) => void
  retry: () => Promise<void>
}

function collectQuotes(): Record<string, Quote> {
  const out: Record<string, Quote> = {}
  for (const symbol of allSymbols()) out[symbol] = computeQuote(symbol)
  return out
}

export const useMarketStore = create<MarketStore>((set, get) => ({
  status: 'idle',
  error: null,
  quotes: {},
  news: [],
  events: [],
  lastTickAt: null,
  feedPaused: false,

  load: async () => {
    if (get().status === 'loading' || get().status === 'ready') return
    set({ status: 'loading', error: null })
    try {
      registerProvider(simulatedProvider)
      const quotes = collectQuotes()
      set({
        quotes,
        news: simulatedProvider.getNews(),
        events: simulatedProvider.getEvents(),
        status: 'ready',
        lastTickAt: Date.now(),
      })
      startEngine(set, get)
    } catch (e) {
      set({
        status: 'error',
        error: e instanceof Error ? e.message : 'The market feed could not be initialised.',
      })
    }
  },

  tickNow: () => {
    if (get().feedPaused) return
    set({ quotes: collectQuotes(), lastTickAt: Date.now() })
  },

  setFeedPaused: (paused) => {
    set({ feedPaused: paused })
    if (paused) stopTickEngine()
    else startEngine(set, get)
  },

  retry: async () => {
    set({ status: 'idle', error: null })
    await get().load()
  },
}))

function startEngine(
  set: (partial: Partial<MarketStore>) => void,
  get: () => MarketStore,
) {
  stopTickEngine()
  if (get().feedPaused) return

  startTickEngine((_moved, at) => {
    if (document.visibilityState === 'hidden') return
    set({ quotes: collectQuotes(), lastTickAt: at })
  })
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    const store = useMarketStore.getState()
    if (document.visibilityState === 'hidden') stopTickEngine()
    else if (store.status === 'ready' && !store.feedPaused) startEngine(
      (p) => useMarketStore.setState(p),
      () => useMarketStore.getState(),
    )
  })
}
