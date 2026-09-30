import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Sparkles, CornerDownLeft, ArrowUp, ArrowDown, LayoutGrid, Radar } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button, Kbd, ProvenanceBadge, EmptyState } from '@/design/primitives'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useHotkey } from '@/hooks/useHotkey'
import { useAIStream } from '@/hooks/useAIStream'
import { useUIStore } from '@/store/ui-store'
import { useMarketStore } from '@/store/market-store'
import { useCommandStore } from '@/store/command-store'
import { useIntelligenceStore } from '@/store/intelligence-store'
import { useAIStore } from '@/store/ai-store'
import { ask } from '@/components/ai-core/ask'
import { looksLikeQuestion } from '@/engine/answers'
import { buildCommands, rankCommands, GROUP_LABEL, type CommandItem, type CommandGroup } from './commands'

const GROUP_ICON: Record<CommandGroup, typeof Sparkles> = {
  ai: Sparkles,
  asset: Search,
  navigate: Radar,
  action: LayoutGrid,
  recent: Sparkles,
}

const GROUP_ORDER: CommandGroup[] = ['ai', 'asset', 'navigate', 'action']

/** Recents display with a prefix; strip it so re-running dedupes cleanly. */
function baseId(id: string): string {
  return id.startsWith('recent-') ? id.slice('recent-'.length) : id
}

export function CommandPalette() {
  const open = useUIStore((s) => s.paletteOpen)
  const setOpen = useUIStore((s) => s.setPaletteOpen)
  const [params, setParams] = useSearchParams()
  const autoAsk = params.get('ask')

  const close = useCallback(() => {
    setOpen(false)
    if (params.toString() !== '') {
      const next = new URLSearchParams(params)
      next.delete('palette')
      next.delete('ask')
      setParams(next, { replace: true })
    }
  }, [params, setParams, setOpen])

  useHotkey('k', () => (open ? close() : setOpen(true)), { mod: true })

  if (!open) return null
  return <PalettePanel autoAsk={autoAsk} onClose={close} />
}

interface PalettePanelProps {
  /** Question carried by the /?palette=open&ask=… deep link. */
  autoAsk: string | null
  onClose: () => void
}

function PalettePanel({ autoAsk, onClose }: PalettePanelProps) {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const setCustomize = useUIStore((s) => s.setCustomizeMode)
  const setOnboarded = useUIStore((s) => s.setOnboarded)
  const setFeedPaused = useMarketStore((s) => s.setFeedPaused)
  const recents = useCommandStore((s) => s.recents)
  const pushRecent = useCommandStore((s) => s.pushRecent)
  const intelStatus = useIntelligenceStore((s) => s.status)
  const marketStatus = useMarketStore((s) => s.status)

  const navigate = useNavigate()
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState(() => autoAsk ?? '')
  const [active, setActive] = useState(0)
  const [askedQuestion, setAskedQuestion] = useState<{ q: string; route?: string } | null>(() =>
    autoAsk ? { q: autoAsk } : null,
  )

  const { text: streamText, status: streamStatus, finish, start } = useAIStream('')

  useFocusTrap(true, panelRef)

  useEffect(() => {
    const raf = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(raf)
  }, [])

  // Answer only once the stores have settled (ready or failed).
  const settled = (intelStatus === 'ready' && marketStatus === 'ready') || intelStatus === 'error'
  const answer = useMemo(
    () => (askedQuestion && settled ? ask(askedQuestion.q, askedQuestion.route) : null),
    [askedQuestion, settled],
  )
  const composed = answer?.text ?? ''

  // Reveal the composed answer in chunks; restarts whenever the answer changes.
  useEffect(() => {
    if (!composed) return
    const id = window.setTimeout(() => start(composed), 0)
    return () => window.clearTimeout(id)
  }, [composed, start])

  // Reflect "answering a question" on the AI core while a question is in flight.
  const answering = askedQuestion !== null && streamStatus !== 'done'
  useEffect(() => {
    if (!answering) return
    const ai = useAIStore.getState()
    const previous = { state: ai.state, label: ai.label }
    ai.setState('thinking', 'Answering a question')
    return () => {
      const current = useAIStore.getState()
      if (current.label === 'Answering a question') current.setState(previous.state, previous.label)
    }
  }, [answering])

  const results = useMemo(() => {
    const built = buildCommands(query)
    const ranked = rankCommands(built, query)
    const trimmed = query.trim()

    // Question-like input gets a first-class ask row above everything else.
    const askItem: CommandItem | null =
      trimmed && looksLikeQuestion(trimmed)
        ? {
            id: 'ask-sharrow',
            group: 'ai',
            title: trimmed,
            subtitle: 'Ask SHARROW and read the interpretation here',
            icon: Sparkles,
            keywords: '',
          }
        : null

    if (trimmed) return [...(askItem ? [askItem] : []), ...ranked].slice(0, 40)

    // Empty query: curated AI intents first, then recents.
    const recentItems: CommandItem[] = recents.map((r) => ({
      id: `recent-${r.id}`,
      group: r.group === 'ai' ? ('ai' as const) : ('recent' as const),
      title: r.title,
      subtitle: r.subtitle,
      icon: r.group === 'ai' ? Sparkles : GROUP_ICON[r.group],
      keywords: '',
      route: r.route,
    }))
    return [
      ...ranked.filter((i) => i.group === 'ai').slice(0, 6),
      ...recentItems,
      ...ranked.filter((i) => i.group !== 'ai').slice(0, 12),
    ]
  }, [query, recents])

  const groups = useMemo(() => {
    const map = new Map<CommandGroup, CommandItem[]>()
    for (const item of results) {
      const list = map.get(item.group) ?? []
      list.push(item)
      map.set(item.group, list)
    }
    return GROUP_ORDER.filter((g) => map.has(g))
      .map((g) => ({ group: g, items: map.get(g)! }))
      .concat(
        ['recent' as CommandGroup]
          .filter((g) => map.has(g))
          .map((g) => ({ group: g, items: map.get(g)! })),
      )
  }, [results])

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups])

  useEffect(() => {
    const el = document.getElementById(`cmd-item-${active}`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const runAction = (action: NonNullable<CommandItem['action']>) => {
    switch (action) {
      case 'toggle-sidebar':
        toggleSidebar()
        break
      case 'customize-overview':
        setCustomize(true)
        navigate('/')
        break
      case 'pause-feed':
        setFeedPaused(true)
        break
      case 'resume-feed':
        setFeedPaused(false)
        break
      case 'start-onboarding':
        setOnboarded(false)
        navigate('/onboarding')
        break
    }
  }

  const startAnswer = (q: string, route?: string) => {
    setActive(0)
    setAskedQuestion({ q, route })
  }

  const run = (item: CommandItem) => {
    const id = baseId(item.id)
    // The ask row and every AI-group item answer in place first; the full
    // analysis opens from the answer footer with ↵.
    if (item.id === 'ask-sharrow') {
      pushRecent({ id: `ask:${item.title}`, group: 'ai', title: item.title })
      startAnswer(item.title)
      return
    }
    if (item.group === 'ai') {
      pushRecent({ id, group: 'ai', title: item.title, subtitle: item.subtitle, route: item.route })
      startAnswer(item.title, item.route)
      return
    }
    pushRecent({ id, group: item.group, title: item.title, subtitle: item.subtitle, route: item.route })
    if (item.action) runAction(item.action)
    if (item.route) navigate(item.route)
    onClose()
  }

  const openAnalysis = () => {
    if (!answer) return
    pushRecent({
      id: `ask:${answer.question}`,
      group: 'ai',
      title: answer.question,
      route: answer.route,
    })
    navigate(answer.route)
    onClose()
  }

  const exitAnswer = () => {
    setAskedQuestion(null)
    setActive(0)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (flat.length ? (a + 1) % flat.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (flat.length ? (a - 1 + flat.length) % flat.length : 0))
    } else if (e.key === 'Home') {
      e.preventDefault()
      setActive(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setActive(Math.max(0, flat.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (askedQuestion) {
        if (!answer) return
        if (streamStatus === 'streaming') finish()
        else openAnalysis()
        return
      }
      const item = flat[active]
      if (item) run(item)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      if (askedQuestion) exitAnswer()
      else onClose()
    }
  }

  let runningIndex = -1

  return createPortal(
    <div className="fixed inset-0 z-[var(--sh-z-palette)]">
      <div className="anim-fade absolute inset-0 bg-scrim backdrop-blur-[3px]" onClick={onClose} aria-hidden="true" />
      <div className="relative flex min-h-full items-start justify-center px-4 pt-[12vh]">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          className="anim-rise glass w-full max-w-2xl overflow-hidden rounded-lg shadow-floating"
          onKeyDown={onKeyDown}
        >
          {/* Input */}
          <div className="flex items-center gap-3 border-b border-line-glass px-4 py-3">
            <Search className="size-4 shrink-0 text-ink-3" aria-hidden="true" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActive(0)
                if (askedQuestion) exitAnswer()
              }}
              placeholder="Search, analyze, ask SHARROW…"
              aria-label="Search or ask SHARROW"
              aria-controls="command-results"
              aria-expanded={!askedQuestion}
              aria-activedescendant={
                askedQuestion ? undefined : flat[active] ? `cmd-item-${active}` : undefined
              }
              role="combobox"
              className="min-w-0 flex-1 bg-transparent text-md text-ink placeholder:text-ink-3 focus:outline-none"
              autoComplete="off"
              spellCheck={false}
            />
            <ProvenanceBadge kind="ai" bare className="hidden sm:inline-flex" />
            <Kbd>Esc</Kbd>
          </div>

          {/* Results / answer */}
          <div
            id="command-results"
            role={askedQuestion ? undefined : 'listbox'}
            aria-label={askedQuestion ? 'Answer' : 'Results'}
            aria-busy={askedQuestion ? streamStatus === 'streaming' : undefined}
            ref={listRef}
            className="max-h-[52vh] overflow-y-auto p-2"
          >
            {askedQuestion ? (
              <div className="px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 flex-1 text-sm text-ink">{askedQuestion.q}</p>
                  <ProvenanceBadge kind="ai" bare />
                </div>
                {answer ? (
                  <>
                    <p className="mt-3 text-sm leading-relaxed text-ink-2">
                      {streamText}
                      {streamStatus === 'streaming' && (
                        <span
                          className="ml-px inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-accent"
                          aria-hidden="true"
                        />
                      )}
                    </p>
                    <p className="sr-only" role="status">
                      {streamStatus === 'streaming' ? 'Composing the answer' : 'Answer complete'}
                    </p>
                    <p className="mt-3 text-2xs text-ink-3">Opens {answer.route}</p>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-ink-3" role="status">
                    Synthesizing…
                  </p>
                )}
              </div>
            ) : flat.length === 0 ? (
              <EmptyState
                size="sm"
                title="No matching command"
                body={
                  <>
                    Try an asset symbol, a destination, or ask SHARROW something like
                    <span className="text-ink-2"> “Why did NIFTY move today?”</span>
                  </>
                }
                action={
                  <Button variant="soft" size="sm" onClick={() => startAnswer(query.trim())}>
                    Ask SHARROW
                  </Button>
                }
              />
            ) : (
              groups.map(({ group, items }) => {
                return (
                  <div key={group} className="mb-1.5 last:mb-0">
                    <p className="px-2 pt-2 pb-1 font-mono text-2xs uppercase tracking-[0.14em] text-ink-3">
                      {GROUP_LABEL[group]}
                    </p>
                    <ul>
                      {items.map((item) => {
                        runningIndex += 1
                        const index = runningIndex
                        const isActive = index === active
                        const Icon = item.icon
                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              id={`cmd-item-${index}`}
                              role="option"
                              aria-selected={isActive}
                              onClick={() => run(item)}
                              onMouseMove={() => setActive(index)}
                              className={cn(
                                'flex w-full items-center gap-3 rounded-sm px-2.5 py-2 text-left transition-colors duration-[100ms]',
                                isActive ? 'bg-surface-4' : 'hover:bg-surface-3/60',
                              )}
                            >
                              <span
                                className={cn(
                                  'flex size-7 shrink-0 items-center justify-center rounded-sm border',
                                  item.group === 'ai'
                                    ? 'border-accent/30 bg-accent-soft text-accent'
                                    : 'border-line bg-surface-2 text-ink-3',
                                )}
                              >
                                <Icon className="size-3.5" aria-hidden="true" strokeWidth={1.9} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className={cn('block truncate text-sm', isActive ? 'text-ink' : 'text-ink-2')}>
                                  {item.title}
                                </span>
                                {item.subtitle && (
                                  <span className="block truncate text-xs text-ink-3">{item.subtitle}</span>
                                )}
                              </span>
                              {item.group === 'ai' && (
                                <span className="shrink-0 rounded-full bg-accent-soft px-1.5 py-0.5 font-mono text-2xs text-accent">
                                  AI
                                </span>
                              )}
                              {isActive && <CornerDownLeft className="size-3.5 shrink-0 text-ink-3" aria-hidden="true" />}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 border-t border-line-glass px-4 py-2.5">
            {askedQuestion ? (
              <>
                <div className="flex items-center gap-3 text-2xs text-ink-3">
                  <span className="flex items-center gap-1">
                    <Kbd>↵</Kbd>
                    {streamStatus === 'streaming' ? 'skip to full' : 'open analysis'}
                  </span>
                  <span className="hidden items-center gap-1 sm:flex">
                    <Kbd>esc</Kbd> back
                  </span>
                </div>
                <span className="hidden font-mono text-2xs text-ink-3 sm:block">
                  {answer ? answer.topic : 'answer'}
                </span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 text-2xs text-ink-3">
                  <span className="flex items-center gap-1">
                    <ArrowUp className="size-3" aria-hidden="true" />
                    <ArrowDown className="size-3" aria-hidden="true" />
                    navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <Kbd>↵</Kbd> select
                  </span>
                  <span className="hidden items-center gap-1 sm:flex">
                    <Kbd>esc</Kbd> close
                  </span>
                </div>
                <span className="hidden font-mono text-2xs text-ink-3 sm:block">
                  {flat.length} result{flat.length === 1 ? '' : 's'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
