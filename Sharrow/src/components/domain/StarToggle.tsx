import type { MouseEvent } from 'react'
import { Star } from 'lucide-react'
import { IconButton } from '@/design/primitives'
import { useIsWatched, useWatchlistStore } from '@/store/watchlist-store'
import { cn } from '@/lib/cn'

interface StarToggleProps {
  symbol: string
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Watchlist star with pressed state, accessible label and toast feedback.
 * Stops click propagation so it works inside clickable table rows.
 */
export function StarToggle({ symbol, size = 'md', className }: StarToggleProps) {
  const watched = useIsWatched(symbol)

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    useWatchlistStore.getState().toggle(symbol)
  }

  return (
    <IconButton
      label={watched ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
      aria-pressed={watched}
      variant={watched ? 'subtle' : 'ghost'}
      size={size}
      onClick={handleClick}
      className={className}
    >
      <Star
        className={cn(size === 'sm' ? 'size-3.5' : 'size-4', watched && 'fill-warn text-warn')}
        aria-hidden="true"
      />
    </IconButton>
  )
}
