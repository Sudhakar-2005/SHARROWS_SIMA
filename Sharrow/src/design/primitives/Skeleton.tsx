import { cn } from '@/lib/cn'

interface SkeletonProps {
  className?: string
  /** Renders a shimmering block with an aspect ratio. */
  variant?: 'block' | 'text' | 'circle' | 'chart'
  width?: string | number
  height?: string | number
}

/**
 * Structure-communicating skeleton — never a generic spinner.
 * Shapes hint at the content that is loading (table rows, chart frames…).
 */
export function Skeleton({ className, variant = 'block', width, height }: SkeletonProps) {
  const base = 'anim-shimmer bg-surface-2 overflow-hidden'

  if (variant === 'text') {
    return (
      <div
        className={cn(base, 'h-3 rounded-sm', className)}
        style={{ width: width ?? '100%', height }}
        aria-hidden="true"
      />
    )
  }

  if (variant === 'circle') {
    return <div className={cn(base, 'rounded-full', className)} style={{ width, height }} aria-hidden="true" />
  }

  if (variant === 'chart') {
    return (
      <div className={cn(base, 'relative rounded-sm border border-line', className)} style={{ height: height ?? 180 }}>
        <div className="absolute inset-x-3 top-3 h-px bg-line" />
        <div className="absolute inset-x-3 top-1/2 h-px bg-line" />
        <div className="absolute inset-x-3 bottom-3 h-px bg-line" />
        <div className="anim-scan absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-accent/8 to-transparent" />
      </div>
    )
  }

  return <div className={cn(base, 'rounded-sm', className)} style={{ width, height }} aria-hidden="true" />
}

/** Paragraph skeleton with varied line widths for a natural rhythm. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  const widths = ['92%', '78%', '85%', '64%', '88%']
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="text" width={widths[i % widths.length]} />
      ))}
    </div>
  )
}
