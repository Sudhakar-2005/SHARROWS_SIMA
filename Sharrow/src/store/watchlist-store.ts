import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { WATCHLIST_SYMBOLS } from '@/data/universe'
import { toast } from './toast-store'

interface WatchlistState {
  /** Symbols the analyst monitors, in add order. */
  symbols: string[]
  toggle: (symbol: string) => void
  add: (symbol: string) => void
  remove: (symbol: string) => void
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      symbols: [...WATCHLIST_SYMBOLS],
      toggle: (symbol) => {
        if (get().symbols.includes(symbol)) get().remove(symbol)
        else get().add(symbol)
      },
      add: (symbol) => {
        if (get().symbols.includes(symbol)) return
        set((s) => ({ symbols: [...s.symbols, symbol] }))
        toast({
          tone: 'success',
          title: `${symbol} added to watchlist`,
          body: 'It now streams on the Watchlist screen.',
          duration: 3200,
        })
      },
      remove: (symbol) => {
        if (!get().symbols.includes(symbol)) return
        set((s) => ({ symbols: s.symbols.filter((x) => x !== symbol) }))
        toast({
          tone: 'info',
          title: `${symbol} removed from watchlist`,
          action: { label: 'Undo', onClick: () => get().add(symbol) },
          duration: 5000,
        })
      },
    }),
    { name: 'sharrow-watchlist' },
  ),
)

/** Subscribes to whether a single symbol is watched. */
export function useIsWatched(symbol: string): boolean {
  return useWatchlistStore((s) => s.symbols.includes(symbol))
}
