import { forwardRef, type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

/* ------------------------------------------------------------------ *
 * Pills are reserved for status, tags, confidence and market regime.
 * Everything else uses Tag (square-ish metadata chip).
 * ------------------------------------------------------------------ */

const badgeVariants = cva(
  [
    'inline-flex items-center gap-1.5 whitespace-nowrap font-medium',
    'transition-colors duration-[140ms]',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
  ],
  {
    variants: {
      variant: {
        accent: 'bg-accent-soft text-accent',
        violet: 'bg-accent-soft-2 text-accent-2',
        pos: 'bg-pos-soft text-pos',
        neg: 'bg-neg-soft text-neg',
        warn: 'bg-warn-soft text-warn',
        flow: 'bg-flow-soft text-flow',
        outline: 'border border-line-strong text-ink-2',
        solid: 'bg-surface-4 text-ink',
      },
      size: {
        sm: 'h-5 px-2 text-2xs',
        md: 'h-6 px-2.5 text-xs',
        lg: 'h-7 px-3 text-xs',
      },
      shape: {
        pill: 'rounded-full',
        chip: 'rounded-sm',
      },
    },
    defaultVariants: { variant: 'flow', size: 'md', shape: 'pill' },
  },
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, shape, dot = false, children, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant, size, shape }), className)} {...props}>
      {dot && <span className="size-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />}
      {children}
    </span>
  ),
)
Badge.displayName = 'Badge'

export interface PillProps extends Omit<BadgeProps, 'shape'> {
  /** Leading glyph — a status mark, icon or numeric signal. */
  leading?: React.ReactNode
}

/** Status / confidence / regime pill. */
export const Pill = forwardRef<HTMLSpanElement, PillProps>(
  ({ leading, children, className, ...props }, ref) => (
    <Badge ref={ref} shape="pill" className={className} {...props}>
      {leading}
      {children}
    </Badge>
  ),
)
Pill.displayName = 'Pill'

/** Square metadata chip — sources, sectors, dates. */
export const Tag = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, className, ...props }, ref) => (
    <Badge ref={ref} shape="chip" size="sm" variant="outline" className={className} {...props}>
      {children}
    </Badge>
  ),
)
Tag.displayName = 'Tag'
