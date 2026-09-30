import { NavLink, useLocation } from 'react-router-dom'
import { Radar, CandlestickChart, Briefcase, BellRing, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useUIStore } from '@/store/ui-store'
import { ALL_NAV, isActivePath, type NavItem } from './nav-config'

const NAV_ITEM_BY_ID = Object.fromEntries(ALL_NAV.map((i) => [i.id, i])) as Record<string, NavItem>

const PRIMARY: NavItem[] = [
  { id: 'overview', label: 'Overview', to: '/', icon: Radar, hint: '' },
  { id: 'markets', label: 'Markets', to: '/markets', icon: CandlestickChart, hint: '' },
  { id: 'portfolio', label: 'Portfolio', to: '/portfolio', icon: Briefcase, hint: '' },
  { id: 'alerts', label: 'Alerts', to: '/alerts', icon: BellRing, hint: '' },
]

/** Bottom tab bar — AI-first navigation for phones. */
export function MobileNav() {
  const { pathname } = useLocation()
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen)

  return (
    <nav
      aria-label="Primary (mobile)"
      className="fixed inset-x-0 bottom-0 z-[var(--sh-z-header)] flex h-14 items-stretch border-t border-line bg-surface-1/95 backdrop-blur-md lg:hidden"
    >
      {PRIMARY.map((item) => {
        const active = isActivePath(pathname, item)
        const Icon = item.icon
        return (
          <NavLink
            key={item.id}
            to={item.to}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 text-[11px] transition-colors',
              active ? 'text-accent' : 'text-ink-3',
            )}
          >
            <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
            {item.label}
          </NavLink>
        )
      })}
      <button
        type="button"
        onClick={() => setMobileNavOpen(true)}
        className="flex flex-1 flex-col items-center justify-center gap-1 text-[11px] text-ink-3 transition-colors hover:text-ink-2"
      >
        <MoreHorizontal className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
        More
      </button>
    </nav>
  )
}

/** Full navigation sheet opened from "More". */
export function MobileNavSheet() {
  const open = useUIStore((s) => s.mobileNavOpen)
  const setOpen = useUIStore((s) => s.setMobileNavOpen)
  const { pathname } = useLocation()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[var(--sh-z-drawer)] lg:hidden">
      <div className="anim-fade absolute inset-0 bg-scrim" onClick={() => setOpen(false)} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="All navigation"
        className="anim-drawer-b absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-y-auto rounded-t-lg border-t border-line-strong bg-surface-1 p-4 pb-8"
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="font-mono text-2xs uppercase tracking-[0.14em] text-ink-3">All destinations</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs text-accent underline-offset-4 hover:underline"
          >
            Close
          </button>
        </div>
        <ul className="space-y-1">
          {(['overview', 'markets', 'watchlist', 'portfolio', 'predictions', 'intelligence', 'evolution', 'research', 'alerts', 'settings'] as const).map(
            (id) => {
              const item = NAV_ITEM_BY_ID[id]
              const active = isActivePath(pathname, item)
              const Icon = item.icon
              return (
                <li key={id}>
                  <NavLink
                    to={item.to}
                    onClick={() => setOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors',
                      active ? 'bg-surface-3 text-ink' : 'text-ink-2 hover:bg-surface-2',
                    )}
                  >
                    <Icon className="size-4 text-ink-3" strokeWidth={1.75} aria-hidden="true" />
                    {item.label}
                  </NavLink>
                </li>
              )
            },
          )}
        </ul>
      </div>
    </div>
  )
}
