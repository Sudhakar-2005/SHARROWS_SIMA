import { Link } from 'react-router-dom'
import { Search, Bell, Plus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { IconButton, ProvenanceBadge, Kbd } from '@/design/primitives'
import { AIStatus } from '@/components/ai-core'
import { MarketStatus } from './MarketStatus'
import { useUIStore } from '@/store/ui-store'

export function BrandMark({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#0C0E13" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" fill="none" stroke="rgba(255,255,255,0.08)" />
      <path
        d="M8 21.5 L14 12.5 L18.5 17 L24 9.5"
        fill="none"
        stroke="#5B8CFF"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.5 9.5 H24 V14"
        fill="none"
        stroke="#8B7CFF"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Header() {
  const openPalette = useUIStore((s) => s.setPaletteOpen)
  const notificationCount = 0

  return (
    <header
      className={cn(
        'relative z-[var(--sh-z-header)] flex h-[var(--sh-header-h)] shrink-0 items-center gap-3 border-b border-line',
        'bg-surface-1/85 px-3 backdrop-blur-md sm:px-4',
      )}
    >
      {/* Identity */}
      <Link
        to="/"
        className="flex shrink-0 items-center gap-2.5 rounded-sm pr-1 transition-opacity hover:opacity-90"
        aria-label="SHARROW home"
      >
        <BrandMark />
        <span className="flex items-baseline gap-1.5">
          <span className="text-md font-semibold tracking-[0.06em] text-ink">SHARROW</span>
          <span className="num hidden text-2xs text-ink-3 sm:inline">v0.1.0</span>
        </span>
      </Link>

      {/* Command search */}
      <button
        type="button"
        onClick={() => openPalette(true)}
        className={cn(
          'group mx-auto hidden h-8 w-full max-w-sm items-center gap-2 rounded-sm border border-line bg-surface-2 px-2.5 md:flex',
          'text-sm text-ink-3 transition-colors duration-[140ms] hover:border-line-strong hover:bg-surface-3',
          'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent',
        )}
        aria-label="Search or run a command"
      >
        <Search className="size-3.5 shrink-0" aria-hidden="true" strokeWidth={2} />
        <span className="flex-1 truncate text-left">Search, analyze, ask…</span>
        <Kbd>⌘K</Kbd>
      </button>

      <IconButton
        label="Search or run a command"
        size="sm"
        onClick={() => openPalette(true)}
        className="ml-auto md:hidden"
      >
        <Search className="size-4" aria-hidden="true" />
      </IconButton>

      {/* Right cluster */}
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <ProvenanceBadge kind="simulated" compact className="hidden xl:inline-flex" />
        <MarketStatus className="hidden lg:flex" />
        <AIStatus className="hidden sm:flex" compact />

        <span className="hidden h-5 w-px bg-line sm:block" aria-hidden="true" />

        <Link
          to="/predictions?new=1"
          className="hidden h-8 items-center gap-1.5 rounded-sm border border-line bg-surface-3 px-3 text-xs font-medium text-ink transition-colors hover:bg-surface-4 sm:flex"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          New prediction
        </Link>

        <div className="relative">
          <IconButton label={`Notifications${notificationCount ? `, ${notificationCount} unread` : ''}`} size="sm">
            <Bell className="size-4" aria-hidden="true" />
          </IconButton>
          {notificationCount > 0 && (
            <span
              className="pointer-events-none absolute top-1 right-1 size-1.5 rounded-full bg-accent"
              aria-hidden="true"
            />
          )}
        </div>

        <Link
          to="/settings"
          aria-label="Your profile and settings"
          className="flex size-7 items-center justify-center rounded-full bg-accent-soft text-xs font-medium text-accent transition-colors hover:bg-accent/20"
        >
          A
        </Link>
      </div>
    </header>
  )
}
