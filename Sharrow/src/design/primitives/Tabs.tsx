import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { tabButtonId, tabPanelId } from './tab-ids'

export interface TabItem {
  id: string
  label: ReactNode
  icon?: ReactNode
  count?: number
  disabled?: boolean
}

interface TabsProps {
  items: TabItem[]
  value: string
  onChange: (id: string) => void
  /** Unique group id — links buttons to their panels. */
  groupId: string
  ariaLabel: string
  className?: string
  variant?: 'underline' | 'segmented'
}

export function Tabs({
  items,
  value,
  onChange,
  groupId,
  ariaLabel,
  className,
  variant = 'underline',
}: TabsProps) {
  const listRef = useRef<HTMLDivElement>(null)

  const move = (dir: 1 | -1 | 'first' | 'last') => {
    const enabled = items.filter((i) => !i.disabled)
    if (!enabled.length) return
    let next: TabItem
    if (dir === 'first') next = enabled[0]
    else if (dir === 'last') next = enabled[enabled.length - 1]
    else {
      const idx = enabled.findIndex((i) => i.id === value)
      next = enabled[(idx + dir + enabled.length) % enabled.length]
    }
    onChange(next.id)
    requestAnimationFrame(() => {
      document.getElementById(tabButtonId(groupId, next.id))?.focus()
    })
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        move(1)
        break
      case 'ArrowLeft':
        e.preventDefault()
        move(-1)
        break
      case 'Home':
        e.preventDefault()
        move('first')
        break
      case 'End':
        e.preventDefault()
        move('last')
        break
    }
  }

  if (variant === 'segmented') {
    return (
      <div
        role="tablist"
        aria-label={ariaLabel}
        ref={listRef}
        onKeyDown={onKeyDown}
        className={cn('inline-flex items-center gap-0.5 rounded-sm border border-line bg-surface-1 p-0.5', className)}
      >
        {items.map((item) => {
          const selected = item.id === value
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={tabButtonId(groupId, item.id)}
              aria-selected={selected}
              aria-controls={tabPanelId(groupId, item.id)}
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              onClick={() => onChange(item.id)}
              className={cn(
                'inline-flex h-7 items-center gap-1.5 rounded-[6px] px-2.5 text-xs font-medium transition-all duration-[140ms]',
                'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent',
                selected
                  ? 'bg-surface-4 text-ink shadow-surface'
                  : 'text-ink-3 hover:bg-surface-2 hover:text-ink-2',
                item.disabled && 'pointer-events-none opacity-40',
              )}
            >
              {item.icon}
              {item.label}
              {typeof item.count === 'number' && <span className="num text-2xs text-ink-3">{item.count}</span>}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      ref={listRef}
      onKeyDown={onKeyDown}
      className={cn('flex items-center gap-1 overflow-x-auto no-scrollbar', className)}
    >
      {items.map((item) => {
        const selected = item.id === value
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={tabButtonId(groupId, item.id)}
            aria-selected={selected}
            aria-controls={tabPanelId(groupId, item.id)}
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onChange(item.id)}
            className={cn(
              'relative inline-flex h-9 items-center gap-2 whitespace-nowrap px-3 text-sm transition-colors duration-[140ms]',
              'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent',
              selected ? 'text-ink' : 'text-ink-3 hover:text-ink-2',
              item.disabled && 'pointer-events-none opacity-40',
            )}
          >
            {item.icon}
            {item.label}
            {typeof item.count === 'number' && <span className="num text-2xs text-ink-3">{item.count}</span>}
            <span
              aria-hidden="true"
              className={cn(
                'absolute inset-x-2 bottom-0 h-px transition-all duration-[140ms]',
                selected ? 'bg-accent' : 'bg-transparent',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

/** Panel that pairs with a Tabs group. */
export function TabPanel({
  groupId,
  id,
  active,
  children,
  className,
}: {
  groupId: string
  id: string
  active: boolean
  children: ReactNode
  className?: string
}) {
  if (!active) return null
  return (
    <div
      role="tabpanel"
      id={tabPanelId(groupId, id)}
      aria-labelledby={tabButtonId(groupId, id)}
      tabIndex={0}
      className={cn('focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent', className)}
    >
      {children}
    </div>
  )
}
