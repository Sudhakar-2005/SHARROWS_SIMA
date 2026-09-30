import { Button } from '@/design/primitives'
import { MOTION_OPTIONS, motionKeyFrom, prefFromMotionKey } from '@/pages/settings/settings-data'

interface MotionPickerProps {
  value: boolean | null
  onChange: (next: boolean | null) => void
}

/** Segmented motion preference: follow system / reduced / full. */
export function MotionPicker({ value, onChange }: MotionPickerProps) {
  const active = motionKeyFrom(value)
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Motion preference">
      {MOTION_OPTIONS.map((o) => (
        <Button
          key={o.key}
          size="sm"
          variant={active === o.key ? 'primary' : 'soft'}
          onClick={() => onChange(prefFromMotionKey(o.key))}
          aria-pressed={active === o.key}
        >
          {o.label}
        </Button>
      ))}
    </div>
  )
}
