import { create } from 'zustand'

export type ToastTone = 'info' | 'success' | 'warning' | 'risk' | 'ai'

export interface ToastItem {
  id: string
  tone: ToastTone
  title: string
  body?: string
  action?: { label: string; onClick: () => void }
  /** ms — 0 keeps the toast until dismissed. */
  duration: number
  createdAt: number
}

interface ToastState {
  items: ToastItem[]
  push: (toast: Omit<ToastItem, 'id' | 'createdAt'>) => string
  dismiss: (id: string) => void
  clear: () => void
}

let counter = 0

export const useToastStore = create<ToastState>((set) => ({
  items: [],
  push: (toast) => {
    const id = `toast-${++counter}`
    set((s) => ({
      items: [...s.items.slice(-3), { ...toast, id, createdAt: Date.now() }],
    }))
    if (toast.duration > 0) {
      setTimeout(() => {
        set((s) => ({ items: s.items.filter((i) => i.id !== id) }))
      }, toast.duration)
    }
    return id
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  clear: () => set({ items: [] }),
}))

/** Imperative toast API — safe to call from stores and services. */
export const toast = (input: Omit<ToastItem, 'id' | 'createdAt'>) => useToastStore.getState().push(input)
