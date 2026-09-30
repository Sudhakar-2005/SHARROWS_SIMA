import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { IconButton } from './IconButton'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  /** Disable the close button for destructive confirmation flows. */
  hideClose?: boolean
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
  hideClose = false,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descId = `${titleId}-desc`
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

  return createPortal(
    <div className="fixed inset-0 z-[var(--sh-z-modal)] flex items-end justify-center p-4 sm:items-center sm:p-6">
      <div
        className="anim-fade absolute inset-0 bg-scrim backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        className={cn(
          'anim-rise relative w-full rounded-lg border border-line-strong bg-surface-2 shadow-floating',
          'max-h-[85dvh] overflow-hidden',
          sizes[size],
          className,
        )}
      >
        {(title || !hideClose) && (
          <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div className="min-w-0">
              {title && (
                <h2 id={titleId} className="text-md font-medium text-ink">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descId} className="mt-1 text-sm text-ink-3">
                  {description}
                </p>
              )}
            </div>
            {!hideClose && (
              <IconButton label="Close" size="sm" onClick={onClose} className="-mr-1 -mt-0.5">
                <X className="size-4" aria-hidden="true" />
              </IconButton>
            )}
          </header>
        )}
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-line bg-surface-1/60 px-5 py-3.5">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  )
}
