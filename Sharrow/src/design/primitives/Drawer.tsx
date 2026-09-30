import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { IconButton } from './IconButton'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  side?: 'right' | 'bottom'
  width?: number | string
  className?: string
  ariaLabel?: string
}

/**
 * Contextual layer — used for the right intelligence rail, asset details
 * and mobile sheets. Not a generic container.
 */
export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  side = 'right',
  width = 420,
  className,
  ariaLabel,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useFocusTrap(open, panelRef)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const panel =
    side === 'right' ? (
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title ? undefined : ariaLabel}
        aria-labelledby={title ? titleId : undefined}
        style={{ width: typeof width === 'number' ? `${width}px` : width }}
        className={cn(
          'anim-drawer-r relative flex h-full w-full max-w-[92vw] flex-col border-l border-line-strong',
          'bg-surface-1 shadow-floating',
          className,
        )}
      >
        <DrawerHeader title={title} titleId={titleId} description={description} onClose={onClose} />
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <footer className="border-t border-line bg-surface-1 px-5 py-3.5">{footer}</footer>}
      </div>
    ) : (
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title ? undefined : ariaLabel}
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          'anim-drawer-b relative flex max-h-[88dvh] w-full flex-col rounded-t-lg border-t border-line-strong',
          'bg-surface-1 shadow-floating',
          className,
        )}
      >
        <DrawerHeader title={title} titleId={titleId} description={description} onClose={onClose} />
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <footer className="border-t border-line px-5 py-3.5">{footer}</footer>}
      </div>
    )

  return createPortal(
    <div className="fixed inset-0 z-[var(--sh-z-drawer)]">
      <div className="anim-fade absolute inset-0 bg-scrim backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        className={cn(
          'absolute inset-0 flex',
          side === 'right' ? 'justify-end' : 'items-end justify-center',
        )}
      >
        {panel}
      </div>
    </div>,
    document.body,
  )
}

function DrawerHeader({
  title,
  titleId,
  description,
  onClose,
}: {
  title?: ReactNode
  titleId: string
  description?: ReactNode
  onClose: () => void
}) {
  if (!title && !description) return null
  return (
    <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div className="min-w-0">
        {title && (
          <h2 id={titleId} className="text-md font-medium text-ink">
            {title}
          </h2>
        )}
        {description && <p className="mt-1 text-sm text-ink-3">{description}</p>}
      </div>
      <IconButton label="Close" size="sm" onClick={onClose} className="-mr-1 -mt-0.5">
        <X className="size-4" aria-hidden="true" />
      </IconButton>
    </header>
  )
}
