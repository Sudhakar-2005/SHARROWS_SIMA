import { useId, useState, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface TooltipProps {
  label: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  /** Render without the default delay (for keyboard focus). */
  instant?: boolean
}

/**
 * Hover/focus tooltip with proper aria wiring.
 * Tooltips never carry the only copy of critical information.
 */
export function Tooltip({ label, children, side = 'top', className, instant = false }: TooltipProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const show = (delay: number) => {
    if (timer) clearTimeout(timer)
    if (delay === 0) setOpen(true)
    else setTimer(setTimeout(() => setOpen(true), delay))
  }
  const hide = () => {
    if (timer) clearTimeout(timer)
    setOpen(false)
  }

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  } as const

  const child = isValidElement(children)
    ? cloneElement(children as ReactElement<{ 'aria-describedby'?: string }>, {
        'aria-describedby': id,
      })
    : children

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => show(instant ? 0 : 260)}
      onMouseLeave={hide}
      onFocusCapture={() => show(0)}
      onBlurCapture={hide}
    >
      {child}
      <span
        role="tooltip"
        id={id}
        data-open={open || undefined}
        className={cn(
          'pointer-events-none absolute z-50 w-max max-w-60 rounded-sm border border-line-strong bg-surface-4 px-2.5 py-1.5',
          'text-xs leading-snug text-ink shadow-floating',
          'opacity-0 transition-all duration-[140ms] ease-premium',
          positions[side],
          open ? 'translate-y-0 scale-100 opacity-100' : 'scale-[0.97] opacity-0',
          className,
        )}
      >
        {label}
      </span>
    </span>
  )
}
