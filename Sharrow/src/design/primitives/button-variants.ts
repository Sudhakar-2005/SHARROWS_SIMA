import { cva, type VariantProps } from 'class-variance-authority'

export const buttonVariants = cva(
  [
    'relative inline-flex select-none items-center justify-center gap-2 rounded-sm font-medium',
    'whitespace-nowrap transition-all duration-[140ms] ease-premium',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
    'disabled:pointer-events-none disabled:opacity-40',
    'active:scale-[0.985]',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-accent text-[#06101f] hover:bg-accent-strong shadow-surface',
        soft: 'border border-line bg-surface-3 text-ink hover:bg-surface-4 hover:border-line-strong',
        outline:
          'border border-line-strong bg-transparent text-ink-2 hover:bg-surface-2 hover:text-ink',
        ghost: 'bg-transparent text-ink-2 hover:bg-surface-2 hover:text-ink',
        danger: 'border border-neg/35 bg-neg-soft text-neg hover:bg-neg/15',
        link: 'bg-transparent text-accent underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm: 'h-7 px-2.5 text-xs',
        md: 'h-8 px-3.5 text-sm',
        lg: 'h-9.5 px-4 text-sm',
        xl: 'h-11 px-5 text-md',
      },
    },
    defaultVariants: { variant: 'soft', size: 'md' },
  },
)

export type ButtonVariantProps = VariantProps<typeof buttonVariants>
