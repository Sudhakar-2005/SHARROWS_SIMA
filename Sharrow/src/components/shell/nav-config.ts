import {
  Radar,
  CandlestickChart,
  Star,
  Briefcase,
  Target,
  Sparkles,
  Dna,
  Newspaper,
  BellRing,
  Settings2,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  id: string
  label: string
  to: string
  icon: LucideIcon
  /** Short description surfaced in the command palette. */
  hint: string
  /** Matches routes that should keep this item active (e.g. /asset/:symbol). */
  matchPrefix?: string
}

export interface NavGroup {
  id: string
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      { id: 'overview', label: 'Overview', to: '/', icon: Radar, hint: 'Market command center' },
      { id: 'markets', label: 'Markets', to: '/markets', icon: CandlestickChart, hint: 'Regime, sectors, breadth' },
      { id: 'watchlist', label: 'Watchlist', to: '/watchlist', icon: Star, hint: 'Monitored assets' },
      { id: 'portfolio', label: 'Portfolio', to: '/portfolio', icon: Briefcase, hint: 'Holdings intelligence' },
    ],
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    items: [
      { id: 'predictions', label: 'Predictions', to: '/predictions', icon: Target, hint: 'Tracked scenarios and outcomes' },
      { id: 'intelligence', label: 'Intelligence', to: '/intelligence', icon: Sparkles, hint: 'AI observations and analysis' },
      { id: 'evolution', label: 'Evolution', to: '/evolution', icon: Dna, hint: 'Accuracy, learning, versions' },
      { id: 'research', label: 'Research', to: '/research', icon: Newspaper, hint: 'News intelligence' },
      { id: 'alerts', label: 'Alerts', to: '/alerts', icon: BellRing, hint: 'Priority-aware notifications' },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [{ id: 'settings', label: 'Settings', to: '/settings', icon: Settings2, hint: 'Profile, data, preferences' }],
  },
]

export const ALL_NAV: NavItem[] = NAV_GROUPS.flatMap((g) => g.items)

export function isActivePath(pathname: string, item: NavItem): boolean {
  if (item.to === '/') return pathname === '/'
  if (item.matchPrefix) return pathname.startsWith(item.matchPrefix)
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}
