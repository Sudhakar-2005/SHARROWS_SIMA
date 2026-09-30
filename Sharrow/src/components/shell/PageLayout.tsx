import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { ProvenanceBadge, type ProvenanceKind } from '@/design/primitives'
import { useUIStore } from '@/store/ui-store'

interface PageLayoutProps {
  eyebrow?: string
  title: ReactNode
  subtitle?: ReactNode
  provenance?: ProvenanceKind
  actions?: ReactNode
  /** Contextual intelligence column — rendered as a rail on wide screens. */
  rail?: ReactNode
  children: ReactNode
  /** Suppresses horizontal padding for full-bleed tables/charts. */
  flush?: boolean
}

/**
 * Standard intelligence page frame:
 * page header (identity + provenance + actions) → content → contextual rail.
 */
export function PageLayout({
  eyebrow,
  title,
  subtitle,
  provenance,
  actions,
  rail,
  children,
  flush = false,
}: PageLayoutProps) {
  const railHidden = useUIStore((s) => s.railHidden)
  const showRail = Boolean(rail) && !railHidden
  return (
    <div className="flex min-h-full flex-col">
      <div className="border-b border-line bg-surface-1/40 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {eyebrow && (
                <p className="font-mono text-2xs uppercase tracking-[0.14em] text-ink-3">{eyebrow}</p>
              )}
              {provenance && <ProvenanceBadge kind={provenance} />}
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-ink">{title}</h1>
            {subtitle && <div className="mt-1 max-w-3xl text-sm leading-relaxed text-ink-3">{subtitle}</div>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </div>

      <div className={cn('flex min-w-0 flex-1 flex-col', showRail && 'xl:flex-row')}>
        <div className={cn('min-w-0 flex-1', flush ? 'p-0' : 'p-4 sm:p-6 lg:p-8')}>{children}</div>
        {showRail && (
          <aside
            aria-label="Contextual intelligence"
            className={cn(
              'w-full shrink-0 border-t border-line bg-surface-1/30',
              'p-4 sm:p-6 xl:w-[var(--sh-rail-w)] xl:border-t-0 xl:border-l',
            )}
          >
            {rail}
          </aside>
        )}
      </div>
    </div>
  )
}
