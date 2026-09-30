import { useEffect, useRef } from 'react'

type Handler = (e: KeyboardEvent) => void

/**
 * Global keyboard shortcut with correct modifier handling per platform.
 * Example: useHotkey('k', onOpen, { mod: true })
 */
export function useHotkey(
  key: string,
  handler: Handler,
  options: { mod?: boolean; shift?: boolean; enabled?: boolean; preventDefault?: boolean } = {},
) {
  const { mod = false, shift = false, enabled = true, preventDefault = true } = options
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== key.toLowerCase()) return
      const modPressed = e.metaKey || e.ctrlKey
      if (mod !== modPressed) return
      if (shift !== e.shiftKey) return
      if (preventDefault) e.preventDefault()
      handlerRef.current(e)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [key, mod, shift, enabled, preventDefault])
}
