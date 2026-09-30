import { cn } from '@/lib/cn'
import { AICore } from './AICore'
import { AI_STATE_LABEL, AI_STATE_TONE, AI_STATE_SHORT } from './ai-state'
import { useAIStore } from '@/store/ai-store'

interface AIStatusProps {
  size?: number
  compact?: boolean
  className?: string
}

/** Header/inline AI presence: core + state label. */
export function AIStatus({ size = 22, compact = false, className }: AIStatusProps) {
  const state = useAIStore((s) => s.state)
  const label = useAIStore((s) => s.label)

  return (
    <div
      role="status"
      aria-live="polite"
      title={label}
      className={cn(
        'flex items-center gap-2 rounded-full border border-line bg-surface-2 py-1 pr-3 pl-1',
        'transition-colors duration-[260ms]',
        className,
      )}
    >
      <AICore size={size} label={AI_STATE_LABEL[state]} />
      <span className={cn('text-2xs font-medium tracking-[0.01em]', AI_STATE_TONE[state])}>
        {compact ? AI_STATE_SHORT[state] : AI_STATE_LABEL[state]}
      </span>
    </div>
  )
}
