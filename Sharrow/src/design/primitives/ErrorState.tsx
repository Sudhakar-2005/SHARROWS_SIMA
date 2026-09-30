import { AlertTriangle, RotateCw, MessageSquareWarning } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Button } from './Button'

interface ErrorStateProps {
  title?: string
  /** Human-readable cause — never a status code. */
  body?: ReactNode
  onRetry?: () => void
  retryLabel?: string
  onSecondary?: () => void
  secondaryLabel?: string
  onReport?: () => void
  className?: string
  compact?: boolean
}

/**
 * Errors are written for humans: what happened, what still works, what to do next.
 */
export function ErrorState({
  title = 'Market data is temporarily unavailable',
  body = 'SHARROW could not refresh this dataset. Your previously verified data remains available.',
  onRetry,
  retryLabel = 'Retry',
  onSecondary,
  secondaryLabel = 'View previous data',
  onReport,
  className,
  compact = false,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col rounded-md border border-neg/25 bg-neg-soft/50',
        compact ? 'gap-2 p-4' : 'gap-3 p-6',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-neg" aria-hidden="true" strokeWidth={2} />
        <div className="min-w-0">
          <h3 className={cn('font-medium text-ink', compact ? 'text-sm' : 'text-md')}>{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-ink-3">{body}</p>
        </div>
      </div>
      {(onRetry || onSecondary || onReport) && (
        <div className="flex flex-wrap items-center gap-2 pl-7">
          {onRetry && (
            <Button size="sm" variant="soft" onClick={onRetry}>
              <RotateCw className="size-3.5" aria-hidden="true" />
              {retryLabel}
            </Button>
          )}
          {onSecondary && (
            <Button size="sm" variant="ghost" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          )}
          {onReport && (
            <Button size="sm" variant="ghost" onClick={onReport}>
              <MessageSquareWarning className="size-3.5" aria-hidden="true" />
              Report issue
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
