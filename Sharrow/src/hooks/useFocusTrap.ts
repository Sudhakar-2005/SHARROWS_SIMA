import { useEffect, type RefObject } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Traps focus inside a container while open, restores it on close,
 * and locks background scroll.
 */
export function useFocusTrap(open: boolean, containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return
    const node = containerRef.current
    if (!node) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const bodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const getFocusable = () =>
      Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute('aria-hidden') && el.offsetParent !== null,
      )

    const initial = getFocusable()[0] ?? node
    const raf = requestAnimationFrame(() => initial.focus())

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const els = getFocusable()
      if (els.length === 0) {
        e.preventDefault()
        node.focus()
        return
      }
      const first = els[0]
      const last = els[els.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || active === node)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    node.addEventListener('keydown', onKeyDown)
    if (!node.hasAttribute('tabindex')) node.setAttribute('tabindex', '-1')

    return () => {
      cancelAnimationFrame(raf)
      node.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = bodyOverflow
      previouslyFocused?.focus?.()
    }
  }, [open, containerRef])
}
