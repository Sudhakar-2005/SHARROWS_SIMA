import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, Info, TriangleAlert, XCircle, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useToastStore, type ToastTone } from '@/store/toast-store'

const TONE: Record<ToastTone, { icon: typeof Info; className: string }> = {
  info: { icon: Info, className: 'border-line-strong bg-surface-3 text-ink-2' },
  success: { icon: CheckCircle2, className: 'border-pos/30 bg-surface-3 text-pos' },
  warning: { icon: TriangleAlert, className: 'border-warn/30 bg-surface-3 text-warn' },
  risk: { icon: XCircle, className: 'border-neg/30 bg-surface-3 text-neg' },
  ai: { icon: Sparkles, className: 'border-accent/30 bg-surface-3 text-accent' },
}

/**
 * Toasts announce meaningful state changes. They never carry the only
 * copy of critical information.
 */
export function Toaster() {
  const items = useToastStore((s) => s.items)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-4 right-4 z-[var(--sh-z-toast)] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2"
    >
      <AnimatePresence initial={false}>
        {items.map((item) => {
          const cfg = TONE[item.tone]
          const Icon = cfg.icon
          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'pointer-events-auto rounded-md border shadow-floating',
                cfg.className,
              )}
            >
              <div className="flex items-start gap-3 px-4 py-3">
                <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" strokeWidth={2} />
                <div className="min-w-0 flex-1 bg-surface-3/0">
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                  {item.body && <p className="mt-0.5 text-xs leading-relaxed text-ink-3">{item.body}</p>}
                  {item.action && (
                    <button
                      type="button"
                      onClick={() => {
                        item.action?.onClick()
                        dismiss(item.id)
                      }}
                      className="mt-2 text-xs font-medium text-accent underline-offset-4 hover:underline"
                    >
                      {item.action.label}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Dismiss notification"
                  onClick={() => dismiss(item.id)}
                  className="-mr-1 shrink-0 rounded-sm p-1 text-ink-3 transition-colors hover:bg-surface-4 hover:text-ink"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
