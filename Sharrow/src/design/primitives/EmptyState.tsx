import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  /** Intelligent context — never just "No data". Explain what will appear and why. */
  body?: ReactNode
  action?: ReactNode
  secondaryAction?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  align?: 'center' | 'left'
  className?: string
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  secondaryAction,
  size = 'md',
  align = 'center',
  className,
}: EmptyStateProps) {
  const sizes = {
    sm: { wrap: 'px-6 py-8', icon: 'size-8', title: 'text-sm' },
    md: { wrap: 'px-8 py-12', icon: 'size-10', title: 'text-md' },
    lg: { wrap: 'px-10 py-16', icon: 'size-12', title: 'text-lg' },
  } as const

  const s = sizes[size]

  return (
    <div
      className={cn(
        'flex flex-col',
        align === 'center' ? 'items-center text-center' : 'items-start text-left',
        s.wrap,
        className,
      )}
    >
      {icon && (
        <div
          className={cn(
            'mb-4 flex items-center justify-center rounded-full border border-line bg-surface-2 text-ink-3',
            s.icon,
          )}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <h3 className={cn('font-medium text-ink', s.title)}>{title}</h3>
      {body && <div className="mt-2 max-w-prose text-sm leading-relaxed text-ink-3">{body}</div>}
      {(action || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  )
}
