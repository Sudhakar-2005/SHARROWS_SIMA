import { forwardRef, type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const surfaceVariants = cva('relative border border-line', {
  variants: {
    level: {
      /** Recessed panel against the background. */
      sunken: 'bg-surface-1',
      /** Default content surface. */
      base: 'bg-surface-2',
      /** Raised, interactive surface. */
      raised: 'bg-surface-3 shadow-surface sheen',
      /** Floating command surface — glass is reserved for these. */
      floating: 'glass shadow-floating',
      /** Focused / selected surface. */
      focused: 'bg-surface-4 border-line-strong',
    },
    radius: {
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      none: 'rounded-none',
    },
    interactive: {
      true: 'transition-all duration-[140ms] ease-premium hover:border-line-strong hover:bg-surface-hover cursor-pointer',
      false: '',
    },
  },
  defaultVariants: { level: 'base', radius: 'md', interactive: false },
})

export interface SurfaceProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof surfaceVariants> {}

export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(
  ({ className, level, radius, interactive, children, ...props }, ref) => (
    <div ref={ref} className={cn(surfaceVariants({ level, radius, interactive }), className)} {...props}>
      {children}
    </div>
  ),
)
Surface.displayName = 'Surface'

/** Standard section header: title + optional context + trailing actions. */
export function SectionHeader({
  title,
  context,
  actions,
  className,
  id,
}: {
  title: React.ReactNode
  context?: React.ReactNode
  actions?: React.ReactNode
  className?: string
  id?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <h2 id={id} className="text-base font-medium tracking-[-0.01em] text-ink">
          {title}
        </h2>
        {context && <p className="mt-0.5 text-xs text-ink-3">{context}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
