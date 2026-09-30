import type { ReactNode } from 'react'
import { BadgeCheck, GitBranch, GraduationCap, Cpu } from 'lucide-react'
import { Surface } from '@/design/primitives'

interface EvolutionStripProps {
  engineVersion: string
  accuracy: { pct: number; matched: number; sample: number } | null
  learningCount: number
  validatedCount: number
  deployedVersions: number
}

function StripCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  sub: ReactNode
}) {
  return (
    <Surface level="base" radius="lg" className="p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">{label}</span>
        <span className="text-ink-3">{icon}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="num text-xl font-semibold tracking-[-0.01em] text-ink">{value}</span>
        <span className="text-xs text-ink-3">{sub}</span>
      </div>
    </Surface>
  )
}

/** Engine version, strict accuracy, learnings and deployed releases. */
export function EvolutionStrip({
  engineVersion,
  accuracy,
  learningCount,
  validatedCount,
  deployedVersions,
}: EvolutionStripProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StripCard
        icon={<Cpu className="size-3.5" aria-hidden="true" />}
        label="Engine"
        value={<span className="text-lg">{engineVersion}</span>}
        sub="current intelligence"
      />
      <StripCard
        icon={<BadgeCheck className="size-3.5" aria-hidden="true" />}
        label="Accuracy"
        value={accuracy === null ? '—' : `${accuracy.pct}%`}
        sub={
          accuracy === null
            ? 'no conclusive sample'
            : `${accuracy.matched} of ${accuracy.sample} matched`
        }
      />
      <StripCard
        icon={<GraduationCap className="size-3.5" aria-hidden="true" />}
        label="Learnings"
        value={learningCount}
        sub={`${validatedCount} validated`}
      />
      <StripCard
        icon={<GitBranch className="size-3.5" aria-hidden="true" />}
        label="Versions"
        value={deployedVersions}
        sub="deployed to date"
      />
    </div>
  )
}
