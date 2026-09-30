import type { ReactNode } from 'react'

interface SettingRowProps {
  label: string
  description?: string
  /** Right-aligned read-only value. */
  value?: ReactNode
  /** Right-aligned interactive control (takes precedence over value). */
  control?: ReactNode
}

/** Read-only or controlled settings row: explanation left, value/control right. */
export function SettingRow({ label, description, value, control }: SettingRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm text-ink">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs leading-relaxed text-ink-3">{description}</p>
        )}
      </div>
      {control ? (
        <div className="flex shrink-0 items-center gap-2">{control}</div>
      ) : (
        value !== undefined && (
          <span className="shrink-0 pt-0.5 text-xs text-ink-2">{value}</span>
        )
      )}
    </div>
  )
}
