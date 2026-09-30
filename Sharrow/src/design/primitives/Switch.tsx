import { forwardRef, useId, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
  description?: string
  /** Renders label and description to the right of the control. */
  inline?: boolean
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, label, description, inline = true, className, ...props }, ref) => {
    const id = useId()
    const descId = `${id}-desc`

    const control = (
      <button
        ref={ref}
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        aria-describedby={description ? descId : undefined}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full border transition-all duration-[140ms] ease-premium',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          checked ? 'border-accent/40 bg-accent/80' : 'border-line-strong bg-surface-3',
          className,
        )}
        {...props}
      >
        <span
          aria-hidden="true"
          className={cn(
            'absolute top-0.5 left-0.5 size-3.5 rounded-full bg-white shadow-surface transition-transform duration-[140ms]',
            checked && 'translate-x-4',
          )}
        />
      </button>
    )

    if (!inline) {
      return (
        <div className="flex flex-col gap-1.5">
          {control}
          <span className="text-sm text-ink">{label}</span>
          {description && <span className="text-xs text-ink-3">{description}</span>}
        </div>
      )
    }

    return (
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <label htmlFor={id} className="block cursor-pointer text-sm text-ink">
            {label}
          </label>
          {description && (
            <p id={descId} className="mt-0.5 text-xs leading-relaxed text-ink-3">
              {description}
            </p>
          )}
        </div>
        {control}
      </div>
    )
  },
)
Switch.displayName = 'Switch'
