import { Badge, SectionHeader, Surface } from '@/design/primitives'
import type { ReactNode } from 'react'

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-xs text-ink-3">{label}</span>
      <span className="num text-xs text-ink-2">{value}</span>
    </li>
  )
}

interface StorageCardProps {
  watchCount: number
  motionLabel: string
  railHidden: boolean
  sidebarCollapsed: boolean
  onboarded: boolean
}

/** What lives on this device — and where it goes if site data is cleared. */
export function StorageCard({
  watchCount,
  motionLabel,
  railHidden,
  sidebarCollapsed,
  onboarded,
}: StorageCardProps) {
  return (
    <Surface level="raised" radius="lg" className="p-4">
      <SectionHeader title="Stored on this device" context="localStorage — no accounts, no servers." />
      <ul className="mt-2 divide-y divide-line">
        <Row label="Watchlist" value={`${watchCount} symbols`} />
        <Row label="Motion" value={motionLabel} />
        <Row label="Intelligence rail" value={railHidden ? 'Hidden' : 'Visible'} />
        <Row label="Navigation" value={sidebarCollapsed ? 'Collapsed' : 'Expanded'} />
        <Row label="Onboarding" value={onboarded ? 'Completed' : 'Not run'} />
      </ul>
      <p className="mt-3 border-t border-line pt-3 text-2xs leading-relaxed text-ink-3">
        Clearing this site's data resets preferences, the watchlist and onboarding — nothing
        leaves the browser.
      </p>
    </Surface>
  )
}

interface AboutCardProps {
  version: string
}

/** Version and the product's honesty stance in three lines. */
export function AboutCard({ version }: AboutCardProps) {
  return (
    <Surface level="raised" radius="lg" className="p-4">
      <SectionHeader title="About SHARROW" context="AI-native market intelligence, local-first." />
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-ink-3">Engine</span>
          <span className="num text-xs text-ink">{version}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-ink-3">Market data</span>
          <Badge variant="outline" size="sm" shape="chip">
            simulated
          </Badge>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-ink-3">Intelligence runs</span>
          <Badge variant="outline" size="sm" shape="chip">
            local
          </Badge>
        </div>
      </div>
      <p className="mt-3 border-t border-line pt-3 text-2xs leading-relaxed text-ink-3">
        Every number, signal and alert is simulated or derived and labeled at the surface where it
        appears — context to weigh, never an instruction to trade.
      </p>
    </Surface>
  )
}
