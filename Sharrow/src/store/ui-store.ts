import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Density = 'comfortable' | 'compact'

interface UIState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  paletteOpen: boolean
  setPaletteOpen: (open: boolean) => void
  notificationsOpen: boolean
  setNotificationsOpen: (open: boolean) => void
  /** Page-level customization mode on the Overview screen. */
  customizeMode: boolean
  setCustomizeMode: (v: boolean) => void
  /** Mobile navigation sheet. */
  mobileNavOpen: boolean
  setMobileNavOpen: (v: boolean) => void
  /** Right intelligence rail visibility (page may override). */
  railHidden: boolean
  setRailHidden: (v: boolean) => void
  onboarded: boolean
  setOnboarded: (v: boolean) => void
  reducedMotion: boolean | null
  setReducedMotion: (v: boolean | null) => void
}

/** Deep link: /?palette=open opens the command palette on load (not persisted). */
function paletteFromUrl(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('palette') === 'open'
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      paletteOpen: paletteFromUrl(),
      setPaletteOpen: (open) => set({ paletteOpen: open }),
      notificationsOpen: false,
      setNotificationsOpen: (open) => set({ notificationsOpen: open }),
      customizeMode: false,
      setCustomizeMode: (v) => set({ customizeMode: v }),
      mobileNavOpen: false,
      setMobileNavOpen: (v) => set({ mobileNavOpen: v }),
      railHidden: false,
      setRailHidden: (v) => set({ railHidden: v }),
      onboarded: false,
      setOnboarded: (v) => set({ onboarded: v }),
      reducedMotion: null,
      setReducedMotion: (v) => set({ reducedMotion: v }),
    }),
    {
      name: 'sharrow-ui',
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        onboarded: s.onboarded,
        reducedMotion: s.reducedMotion,
      }),
    },
  ),
)
