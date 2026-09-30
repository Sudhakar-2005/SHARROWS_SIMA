import { useId } from 'react'
import { cn } from '@/lib/cn'
import { type AIState } from '@/design/tokens'
import { useAIStore } from '@/store/ai-store'

interface AICoreProps {
  /** Rendered pixel size. */
  size?: number
  /** Override the store-driven state (for previews and stories). */
  state?: AIState
  className?: string
  /** Accessible description. Omit when the status is announced nearby. */
  label?: string
}

const STATE_TONE: Record<AIState, { primary: string; secondary: string; dim: number }> = {
  idle: { primary: '#5a6172', secondary: '#5a6172', dim: 0.5 },
  ready: { primary: '#5b8cff', secondary: '#8b7cff', dim: 1 },
  observing: { primary: '#5b8cff', secondary: '#8b7cff', dim: 1 },
  analyzing: { primary: '#5b8cff', secondary: '#8b7cff', dim: 1 },
  thinking: { primary: '#8b7cff', secondary: '#5b8cff', dim: 1 },
  evaluating: { primary: '#5b8cff', secondary: '#35d39a', dim: 1 },
  learning: { primary: '#8b7cff', secondary: '#35d39a', dim: 1 },
  alert: { primary: '#ff6b6b', secondary: '#f4b740', dim: 1 },
}

/**
 * SHARROW AI CORE.
 * A state instrument, not a loader: each intelligence-loop state has its own
 * motion signature (orbit → converge → layered pulse → compare → reorganize
 * → controlled alert → stable luminous core).
 */
export function AICore({ size = 72, state, className, label }: AICoreProps) {
  const storeState = useAIStore((s) => s.state)
  const s = state ?? storeState
  const tone = STATE_TONE[s]
  const gradientId = useId()
  const glowId = useId()

  const isIdle = s === 'idle'
  const speedClass = s === 'analyzing' ? 'anim-orbit-fast' : 'anim-orbit'

  return (
    <span
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="sh-core-svg overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={gradientId} cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor={tone.primary} stopOpacity="0.95" />
            <stop offset="55%" stopColor={tone.secondary} stopOpacity="0.55" />
            <stop offset="100%" stopColor={tone.secondary} stopOpacity="0.05" />
          </radialGradient>
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={tone.primary} stopOpacity="0.35" />
            <stop offset="100%" stopColor={tone.primary} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient glow */}
        <circle cx="50" cy="50" r="46" fill={`url(#${glowId})`} opacity={isIdle ? 0.35 : 1} />

        {/* Static guide ring */}
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="1"
        />

        {/* Outer orbit — observation */}
        <g
          className={speedClass}
          style={{ animationDuration: s === 'alert' ? '4s' : s === 'thinking' ? '9s' : '14s' }}
          opacity={isIdle ? 0.4 : 1}
        >
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke={tone.primary}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="46 70 18 120"
            opacity="0.85"
          />
          <circle cx="50" cy="6" r="2.4" fill={tone.primary} opacity="0.9" />
        </g>

        {/* Mid layer — analysis / thinking */}
        <g
          className={cn(s === 'analyzing' ? 'anim-converge' : s === 'learning' ? 'anim-reorganize' : 'anim-orbit-reverse')}
          opacity={isIdle ? 0.35 : 1}
        >
          <circle
            cx="50"
            cy="50"
            r="33"
            fill="none"
            stroke={tone.secondary}
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeDasharray="30 26"
            opacity="0.7"
            className={s === 'thinking' ? 'anim-layer-pulse' : undefined}
          />
          <circle cx="50" cy="17" r="1.8" fill={tone.secondary} opacity="0.85" />
          <circle cx="76" cy="58" r="1.4" fill={tone.secondary} opacity="0.7" />
        </g>

        {/* Evaluation sweep — comparing prior signals */}
        {s === 'evaluating' && (
          <g className="anim-sweep">
            <circle
              cx="50"
              cy="50"
              r="39"
              fill="none"
              stroke={tone.secondary}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="120 300"
              opacity="0.9"
            />
          </g>
        )}

        {/* Core */}
        <circle
          cx="50"
          cy="50"
          r="15"
          fill={`url(#${gradientId})`}
          className={isIdle ? undefined : s === 'alert' ? 'anim-breathe' : 'anim-breathe'}
          style={{ animationDuration: s === 'alert' ? '1.2s' : '3.6s' }}
        />
        <circle
          cx="50"
          cy="50"
          r="15"
          fill="none"
          stroke={tone.primary}
          strokeWidth="1"
          opacity={isIdle ? 0.35 : 0.7}
        />
        <circle cx="50" cy="50" r="5.5" fill={tone.primary} opacity={isIdle ? 0.5 : 0.95} />

        {/* Alert pulse */}
        {s === 'alert' && (
          <>
            <circle
              cx="50"
              cy="50"
              r="24"
              fill="none"
              stroke="#ff6b6b"
              strokeWidth="1.5"
              className="anim-pulse-ring"
            />
            <circle
              cx="50"
              cy="50"
              r="24"
              fill="none"
              stroke="#ff6b6b"
              strokeWidth="1"
              className="anim-pulse-ring"
              style={{ animationDelay: '1.2s' }}
            />
          </>
        )}
      </svg>
    </span>
  )
}
