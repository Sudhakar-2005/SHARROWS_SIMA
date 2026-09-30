import { Suspense, lazy, useEffect } from 'react'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import { AppShell } from '@/components/shell/AppShell'
import { PageSkeleton } from '@/components/feedback/PageSkeleton'
import { useMarketStore } from '@/store/market-store'
import { useIntelligenceStore } from '@/store/intelligence-store'
import { useUIStore } from '@/store/ui-store'

const OverviewPage = lazy(() => import('@/pages/OverviewPage'))
const MarketsPage = lazy(() => import('@/pages/MarketsPage'))
const WatchlistPage = lazy(() => import('@/pages/WatchlistPage'))
const PortfolioPage = lazy(() => import('@/pages/PortfolioPage'))
const PredictionsPage = lazy(() => import('@/pages/PredictionsPage'))
const IntelligencePage = lazy(() => import('@/pages/IntelligencePage'))
const EvolutionPage = lazy(() => import('@/pages/EvolutionPage'))
const ResearchPage = lazy(() => import('@/pages/ResearchPage'))
const AlertsPage = lazy(() => import('@/pages/AlertsPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const AssetPage = lazy(() => import('@/pages/AssetPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'))

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <OverviewPage /> },
      { path: 'markets', element: <MarketsPage /> },
      { path: 'watchlist', element: <WatchlistPage /> },
      { path: 'portfolio', element: <PortfolioPage /> },
      { path: 'predictions', element: <PredictionsPage /> },
      { path: 'intelligence', element: <IntelligencePage /> },
      { path: 'evolution', element: <EvolutionPage /> },
      { path: 'research', element: <ResearchPage /> },
      { path: 'alerts', element: <AlertsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'asset/:symbol', element: <AssetPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: '/onboarding',
    element: (
      <Suspense fallback={<PageSkeleton />}>
        <OnboardingPage />
      </Suspense>
    ),
  },
])

export function App() {
  const motionPref = useUIStore((s) => s.reducedMotion)

  useEffect(() => {
    const root = document.documentElement
    if (motionPref === null) delete root.dataset.motion
    else root.dataset.motion = motionPref ? 'reduced' : 'full'
  }, [motionPref])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      await useMarketStore.getState().load()
      if (!cancelled) await useIntelligenceStore.getState().initialize()
    })()
    const cycle = window.setInterval(() => useIntelligenceStore.getState().runCycle(), 20_000)
    return () => {
      cancelled = true
      window.clearInterval(cycle)
    }
  }, [])

  return (
    <MotionConfig
      reducedMotion={motionPref === null ? 'user' : motionPref ? 'always' : 'never'}
    >
      <RouterProvider router={router} />
    </MotionConfig>
  )
}
