import { Suspense } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { MobileNav, MobileNavSheet } from './MobileNav'
import { CommandPalette } from './CommandPalette'
import { Toaster } from '@/design/primitives'
import { PageSkeleton } from '@/components/feedback/PageSkeleton'
import { useUIStore } from '@/store/ui-store'

/**
 * Global command-center shell:
 * header (identity, command, market + AI status) over a three-zone body —
 * navigation · intelligence workspace · contextual rail (page-driven).
 * First run routes through onboarding until it completes or is skipped.
 */
export function AppShell() {
  const onboarded = useUIStore((s) => s.onboarded)
  if (!onboarded) return <Navigate to="/onboarding" replace />
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-bg">
      <a
        href="#main"
        className="sr-only z-[var(--sh-z-toast)] rounded-sm bg-accent px-3 py-2 text-sm text-[#06101f] focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>

      <Header />

      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main id="main" className="min-w-0 flex-1 overflow-y-auto pb-14 lg:pb-0" tabIndex={-1}>
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <MobileNav />
      <MobileNavSheet />
      <CommandPalette />
      <Toaster />
    </div>
  )
}
