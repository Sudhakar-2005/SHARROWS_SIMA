import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const iconButtonVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center rounded-sm',
    'transition-all duration-[140ms] ease-premium',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
    'disabled:pointer-events-none disabled:opacity-40',
    'active:scale-[0.96]',
  ],
  {
    variants: {
      variant: {
        ghost: 'text-ink-2 hover:bg-surface-3 hover:text-ink',
        subtle: 'border border-line bg-surface-2 text-ink-2 hover:bg-surface-3 hover:text-ink',
        accent: 'bg-accent/12 text-accent hover:bg-accent/20',
        danger: 'text-neg hover:bg-neg-soft',
      },
      size: {
        sm: 'size-6',
        md: 'size-8',
        lg: 'size-9',
      },
    },
    defaultVariants: { variant: 'ghost', size: 'md' },
  },
)

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  /** Required — icon-only controls must expose an accessible name. */
  label: string
  children: ReactNode
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, label, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cn(iconButtonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </button>
  ),
)
IconButton.displayName = 'IconButton'
