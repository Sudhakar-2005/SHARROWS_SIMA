import { cn } from '@/lib/cn'

/** Keyboard key chip. */
export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-line-strong',
        'bg-surface-3 px-1.5 font-mono text-2xs text-ink-3 shadow-[inset_0_-1px_0_rgba(255,255,255,0.04)]',
        className,
      )}
    >
      {children}
    </kbd>
  )
}

/** Renders ⌘ / Ctrl correctly per platform. */
export function ModKey({ className }: { className?: string }) {
  const isApple =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.userAgent ?? '')
  return <Kbd className={className}>{isApple ? '⌘' : 'Ctrl'}</Kbd>
}
