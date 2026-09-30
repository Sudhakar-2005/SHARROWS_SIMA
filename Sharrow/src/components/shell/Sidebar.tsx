import { NavLink, useLocation } from 'react-router-dom'
import { PanelLeftClose, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { IconButton } from '@/design/primitives'
import { NAV_GROUPS, isActivePath } from './nav-config'
import { useUIStore } from '@/store/ui-store'

interface SidebarProps {
  /** Counts keyed by nav item id (alerts, predictions…). */
  badges?: Record<string, number>
}

export function Sidebar({ badges = {} }: SidebarProps) {
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggle = useUIStore((s) => s.toggleSidebar)
  const { pathname } = useLocation()

  return (
    <aside
      className={cn(
        'relative z-[var(--sh-z-rail)] hidden shrink-0 flex-col border-r border-line bg-surface-1/60',
        'transition-[width] duration-[260ms] ease-premium lg:flex',
        collapsed ? 'w-16' : 'w-[var(--sh-sidebar-w)]',
      )}
      aria-label="Primary"
    >
      <div className={cn('flex h-11 items-center justify-between border-b border-line px-3', collapsed && 'justify-center px-0')}>
        {!collapsed && (
          <span className="font-mono text-2xs uppercase tracking-[0.14em] text-ink-3">Navigate</span>
        )}
        <IconButton
          label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          size="sm"
          onClick={toggle}
          className={cn(collapsed && 'rotate-180')}
        >
          <PanelLeftClose className="size-4" aria-hidden="true" />
        </IconButton>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.id} className="mb-4 last:mb-0">
            {!collapsed && (
              <p className="mb-1.5 px-2 font-mono text-2xs uppercase tracking-[0.14em] text-ink-3">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActivePath(pathname, item)
                const count = badges[item.id]
                const Icon = item.icon
                return (
                  <li key={item.id}>
                    <NavLink
                      to={item.to}
                      aria-current={active ? 'page' : undefined}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'group relative flex items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm transition-all duration-[140ms]',
                        'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent',
                        collapsed && 'justify-center px-0',
                        active
                          ? 'bg-surface-3 text-ink'
                          : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-full transition-all duration-[140ms]',
                          active ? 'bg-accent opacity-100' : 'opacity-0',
                        )}
                      />
                      <Icon
                        className={cn(
                          'size-4 shrink-0 transition-colors duration-[140ms]',
                          active ? 'text-accent' : 'text-ink-3 group-hover:text-ink-2',
                        )}
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {!collapsed && typeof count === 'number' && count > 0 && (
                        <span className="num ml-auto rounded-full bg-surface-4 px-1.5 text-2xs text-ink-2">
                          {count}
                        </span>
                      )}
                      {collapsed && typeof count === 'number' && count > 0 && (
                        <span className="absolute top-1 right-1.5 size-1.5 rounded-full bg-accent" aria-hidden="true" />
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {!collapsed && <ProfileRow />}
    </aside>
  )
}

function ProfileRow() {
  return (
    <NavLink
      to="/settings"
      className="m-2 flex items-center gap-2.5 rounded-sm border border-line bg-surface-2 p-2 transition-colors hover:border-line-strong hover:bg-surface-3"
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft font-medium text-accent">
        A
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-ink">Analyst</span>
        <span className="block truncate font-mono text-2xs text-ink-3">SHARROW v0.1.0</span>
      </span>
      <ChevronRight className="size-3.5 shrink-0 text-ink-3" aria-hidden="true" />
    </NavLink>
  )
}
