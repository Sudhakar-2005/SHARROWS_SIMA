import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '@/components/shell/PageLayout'
import { Badge, Button, ProvenanceBadge, SectionHeader, Surface, Switch } from '@/design/primitives'
import { ENGINE_VERSION } from '@/engine/learning'
import { timeAgo } from '@/lib/format'
import { toast } from '@/store/toast-store'
import { useIntelligenceStore } from '@/store/intelligence-store'
import { useMarketStore } from '@/store/market-store'
import { useUIStore } from '@/store/ui-store'
import { useWatchlistStore } from '@/store/watchlist-store'
import { SettingRow } from './settings/SettingRow'
import { AboutCard, StorageCard } from './settings/SettingsRail'
import { MOTION_OPTIONS, motionKeyFrom } from './settings/settings-data'
import { MotionPicker } from '@/components/domain/MotionPicker'

function StatusBadge({ status }: { status: string }) {
  if (status === 'ready') {
    return (
      <Badge variant="pos" size="sm" dot>
        Ready
      </Badge>
    )
  }
  if (status === 'error') {
    return (
      <Badge variant="neg" size="sm" dot>
        Error
      </Badge>
    )
  }
  return (
    <Badge variant="warn" size="sm" dot>
      Starting
    </Badge>
  )
}

export default function SettingsPage() {
  const navigate = useNavigate()

  const feedPaused = useMarketStore((s) => s.feedPaused)
  const cycleStatus = useIntelligenceStore((s) => s.status)
  const cycleCount = useIntelligenceStore((s) => s.cycleCount)
  const lastCycleAt = useIntelligenceStore((s) => s.lastCycleAt)
  const snapshot = useIntelligenceStore((s) => s.snapshot)

  const railHidden = useUIStore((s) => s.railHidden)
  const setRailHidden = useUIStore((s) => s.setRailHidden)
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const reducedMotion = useUIStore((s) => s.reducedMotion)
  const setReducedMotion = useUIStore((s) => s.setReducedMotion)
  const onboarded = useUIStore((s) => s.onboarded)
  const setOnboarded = useUIStore((s) => s.setOnboarded)

  const watchCount = useWatchlistStore((s) => s.symbols.length)

  const motionKey = motionKeyFrom(reducedMotion)
  const motionLabel = MOTION_OPTIONS.find((o) => o.key === motionKey)?.label ?? 'Follow system'
  const lastCycleLabel = useMemo(
    () => (lastCycleAt === null ? 'Not yet run' : timeAgo(lastCycleAt, snapshot?.at ?? lastCycleAt)),
    [lastCycleAt, snapshot],
  )

  const resetPreferences = () => {
    setReducedMotion(null)
    setRailHidden(false)
    if (sidebarCollapsed) toggleSidebar()
    toast({ tone: 'success', title: 'Display preferences reset', body: 'Motion, rail and navigation returned to defaults.', duration: 4000 })
  }

  const replayOnboarding = () => {
    setOnboarded(false)
    navigate('/onboarding')
  }

  const toggleFeed = (paused: boolean) => {
    useMarketStore.getState().setFeedPaused(paused)
    toast({
      tone: 'info',
      title: paused ? 'Feed paused' : 'Feed resumed',
      body: paused
        ? 'Quote ticks are frozen — engine cycles continue.'
        : 'Simulated quotes are ticking again.',
      duration: 3000,
    })
  }

  return (
    <PageLayout
      eyebrow="System"
      title="Settings"
      subtitle="Profile, data sources, preferences and accessibility — all local to this device."
      actions={
        <span className="text-2xs text-ink-3">
          Engine <span className="num text-ink-2">{ENGINE_VERSION}</span>
        </span>
      }
      rail={
        <div className="space-y-4">
          <StorageCard
            watchCount={watchCount}
            motionLabel={motionLabel}
            railHidden={railHidden}
            sidebarCollapsed={sidebarCollapsed}
            onboarded={onboarded}
          />
          <AboutCard version={ENGINE_VERSION} />
        </div>
      }
    >
      <div className="space-y-4">
        <Surface level="base" radius="lg" className="p-4">
          <SectionHeader
            title="Data feed"
            context="Simulated by design — every quote carries a label at the surface where it appears."
          />
          <div className="mt-1 divide-y divide-line">
            <Switch
              checked={feedPaused}
              onCheckedChange={toggleFeed}
              label="Pause simulated feed"
              description="Freeze quote ticks while you read. Intelligence cycles and alert escalation keep running."
            />
            <SettingRow
              label="Provider"
              description="Deterministic simulated provider — no external market data is requested."
              control={<ProvenanceBadge kind="simulated" bare />}
            />
          </div>
        </Surface>

        <Surface level="base" radius="lg" className="p-4">
          <SectionHeader
            title="Intelligence engine"
            context="Runs locally on a fixed cadence — deterministic rules, labeled output, no LLM calls."
          />
          <div className="mt-1 divide-y divide-line">
            <SettingRow label="Version" value={<span className="num">{ENGINE_VERSION}</span>} />
            <SettingRow label="Cadence" description="One full observe → understand → explain cycle." value="Every 20 seconds" />
            <SettingRow label="Status" control={<StatusBadge status={cycleStatus} />} />
            <SettingRow label="Cycles run" value={<span className="num">{cycleCount}</span>} />
            <SettingRow label="Last cycle" value={lastCycleLabel} />
          </div>
        </Surface>

        <Surface level="base" radius="lg" className="p-4">
          <SectionHeader
            title="Motion & display"
            context="Reduced keeps fades and removes slides — or inherit your system preference."
          />
          <div className="mt-1 divide-y divide-line">
            <SettingRow
              label="Motion"
              description="Applies to page and panel animation; CSS transitions shorten automatically under reduced motion."
              control={<MotionPicker value={reducedMotion} onChange={setReducedMotion} />}
            />
            <Switch
              checked={railHidden}
              onCheckedChange={setRailHidden}
              label="Hide intelligence rail"
              description="Collapse the contextual right column on every page — this settings screen stays available to restore it."
            />
            <Switch
              checked={sidebarCollapsed}
              onCheckedChange={() => toggleSidebar()}
              label="Collapse navigation"
              description="Keep only the rail icons; expand again any time from the header."
            />
          </div>
        </Surface>

        <Surface level="base" radius="lg" className="p-4">
          <SectionHeader
            title="Local data & onboarding"
            context="Everything below is stored in this browser only."
          />
          <div className="mt-1 divide-y divide-line">
            <SettingRow
              label="Watchlist"
              description="Symbols you starred from Markets or added on the Watchlist screen."
              value={<span className="num">{watchCount} symbols</span>}
            />
            <SettingRow
              label="Onboarding"
              description="The three-step walkthrough shown on first run."
              value={onboarded ? 'Completed' : 'Not run'}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
            <Button size="sm" variant="soft" onClick={replayOnboarding}>
              Replay onboarding
            </Button>
            <Button size="sm" variant="ghost" onClick={resetPreferences}>
              Reset display preferences
            </Button>
          </div>
        </Surface>

        <div className="flex items-start gap-2 pt-1">
          <p className="text-2xs leading-relaxed text-ink-3">
            SHARROW stores preferences, your watchlist and onboarding state on this device — no
            accounts and no servers. Every value shown across the app is simulated or derived and
            labeled; nothing here is a live market feed or a recommendation.
          </p>
        </div>
      </div>
    </PageLayout>
  )
}
