import {
  Radar,
  CandlestickChart,
  Star,
  Briefcase,
  Target,
  Sparkles,
  Dna,
  Newspaper,
  BellRing,
  Settings2,
  Search,
  LineChart,
  TrendingUp,
  TrendingDown,
  CircleHelp,
  History,
  FlaskConical,
  PanelLeft,
  LayoutGrid,
  CalendarCheck,
  BookOpen,
  type LucideIcon,
} from 'lucide-react'
import { ASSETS } from '@/data/universe'
import { NAV_GROUPS } from './nav-config'

export type CommandGroup = 'ai' | 'asset' | 'navigate' | 'action' | 'recent'

export interface CommandItem {
  id: string
  group: CommandGroup
  title: string
  subtitle?: string
  icon: LucideIcon
  keywords: string
  /** Query parameter appended to the route so the target page can react. */
  route?: string
  action?: 'toggle-sidebar' | 'customize-overview' | 'pause-feed' | 'resume-feed' | 'start-onboarding'
}

export interface CommandContext {
  navigate: (to: string) => void
  close: () => void
  runAction: (action: NonNullable<CommandItem['action']>) => void
}

export const GROUP_LABEL: Record<CommandGroup, string> = {
  ai: 'Ask SHARROW',
  asset: 'Assets',
  navigate: 'Navigate',
  action: 'Actions',
  recent: 'Recent',
}

/* ------------------------- Natural-language intents ---------------------- */

const AI_INTENTS: { id: string; label: string; subtitle: string; route: string; keywords: string }[] = [
  {
    id: 'analyze-top-movers',
    label: 'What changed since yesterday?',
    subtitle: 'Compare today’s session with the previous close',
    route: '/markets?focus=changes',
    keywords: 'changed difference yesterday today move movers',
  },
  {
    id: 'why-nifty-fall',
    label: 'Why did NIFTY move today?',
    subtitle: 'Regime, sector and flow interpretation',
    route: '/intelligence?q=Why%20did%20NIFTY%20move%20today%3F',
    keywords: 'nifty index fall rise why reason move today',
  },
  {
    id: 'explain-portfolio',
    label: 'Explain today’s portfolio movement',
    subtitle: 'Contributors, detractors and what changed',
    route: '/portfolio?explain=today',
    keywords: 'portfolio explain movement today up down pnl',
  },
  {
    id: 'failed-predictions',
    label: 'Show my failed predictions',
    subtitle: 'Missed scenarios and what the engine learned',
    route: '/predictions?status=missed',
    keywords: 'failed wrong missed predictions evaluated bad',
  },
  {
    id: 'learned-week',
    label: 'What has SHARROW learned recently?',
    subtitle: 'Validated patterns and deployed improvements',
    route: '/evolution?focus=learnings',
    keywords: 'learned learning recent pattern improvement evolution',
  },
  {
    id: 'prediction-accuracy',
    label: 'How accurate is SHARROW right now?',
    subtitle: 'Evaluation record and confidence calibration',
    route: '/evolution?focus=accuracy',
    keywords: 'accuracy accurate calibration performance score hit rate',
  },
  {
    id: 'market-regime',
    label: 'What is the market regime?',
    subtitle: 'Current classification and supporting evidence',
    route: '/markets?focus=regime',
    keywords: 'regime market condition constructive defensive stressed',
  },
  {
    id: 'portfolio-risk',
    label: 'Where is my portfolio most exposed?',
    subtitle: 'Concentration, sector and scenario risk',
    route: '/portfolio?focus=risk',
    keywords: 'risk exposure concentration sector portfolio danger',
  },
  {
    id: 'important-alerts',
    label: 'Show important alerts',
    subtitle: 'High-signal events that need attention',
    route: '/alerts?priority=important',
    keywords: 'alerts important urgent high risk notification',
  },
  {
    id: 'recent-research',
    label: 'What news matters to my portfolio?',
    subtitle: 'News ranked by portfolio relevance',
    route: '/research?focus=portfolio',
    keywords: 'news research matter portfolio relevance headlines',
  },
]

/* ------------------------------- Builders -------------------------------- */

const NAV_ICONS: Record<string, LucideIcon> = {
  overview: Radar,
  markets: CandlestickChart,
  watchlist: Star,
  portfolio: Briefcase,
  predictions: Target,
  intelligence: Sparkles,
  evolution: Dna,
  research: Newspaper,
  alerts: BellRing,
  settings: Settings2,
}

function score(text: string, query: string): number {
  if (!query) return 0
  const t = text.toLowerCase()
  const q = query.toLowerCase()
  if (t === q) return 100
  if (t.startsWith(q)) return 80
  const idx = t.indexOf(q)
  if (idx >= 0) return 60 - Math.min(idx, 20)
  // subsequence match
  let qi = 0
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++
  }
  return qi === q.length ? 25 : 0
}

export function buildCommands(query: string): CommandItem[] {
  const q = query.trim()
  const out: CommandItem[] = []

  // Assets — symbol, name and description.
  if (q) {
    for (const asset of ASSETS) {
      const s = Math.max(
        score(asset.symbol, q),
        score(asset.name, q) * 0.9,
        score(asset.description, q) * 0.5,
      )
      if (s > 0) {
        out.push({
          id: `asset-${asset.symbol}`,
          group: 'asset',
          title: asset.symbol,
          subtitle: asset.name,
          icon: asset.kind === 'index' ? LineChart : Search,
          keywords: `${asset.symbol} ${asset.name} ${asset.description}`.toLowerCase(),
          route: `/asset/${asset.symbol}`,
        })
      }
    }
  }

  // Natural-language AI intents.
  for (const intent of AI_INTENTS) {
    const s = Math.max(score(intent.label, q), score(intent.keywords, q) * 0.6)
    if (!q || s > 0) {
      out.push({
        id: `ai-${intent.id}`,
        group: 'ai',
        title: intent.label,
        subtitle: intent.subtitle,
        icon: Sparkles,
        keywords: intent.keywords,
        route: intent.route,
      })
    }
  }

  // Per-asset analysis commands.
  if (q) {
    for (const asset of ASSETS.slice(0, 60)) {
      const s = score(asset.symbol, q)
      if (s >= 60) {
        out.push({
          id: `analyze-${asset.symbol}`,
          group: 'ai',
          title: `Analyze ${asset.symbol}`,
          subtitle: `Full intelligence workspace for ${asset.name}`,
          icon: TrendingUp,
          keywords: `analyze ${asset.symbol}`.toLowerCase(),
          route: `/asset/${asset.symbol}?analyze=1`,
        })
      }
    }
  }

  // Navigation.
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      const s = Math.max(score(item.label, q), score(item.hint, q) * 0.5)
      if (!q || s > 0) {
        out.push({
          id: `nav-${item.id}`,
          group: 'navigate',
          title: item.label,
          subtitle: item.hint,
          icon: NAV_ICONS[item.id] ?? item.icon,
          keywords: `${item.label} ${item.hint}`.toLowerCase(),
          route: item.to,
        })
      }
    }
  }

  // System actions.
  const actions: {
    id: string
    title: string
    subtitle: string
    icon: LucideIcon
    keywords: string
    action?: NonNullable<CommandItem['action']>
    route?: string
  }[] = [
    {
      id: 'toggle-sidebar',
      title: 'Toggle navigation',
      subtitle: 'Collapse or expand the sidebar',
      icon: PanelLeft,
      keywords: 'sidebar navigation collapse expand toggle',
      action: 'toggle-sidebar',
    },
    {
      id: 'customize-overview',
      title: 'Customize overview',
      subtitle: 'Reorder and hide intelligence modules',
      icon: LayoutGrid,
      keywords: 'customize overview modules layout reorder widgets',
      action: 'customize-overview',
    },
    {
      id: 'pause-feed',
      title: 'Pause market feed',
      subtitle: 'Freeze simulated price updates',
      icon: History,
      keywords: 'pause freeze stop feed market prices',
      action: 'pause-feed',
    },
    {
      id: 'resume-feed',
      title: 'Resume market feed',
      subtitle: 'Continue simulated price updates',
      icon: TrendingDown,
      keywords: 'resume start play feed market prices',
      action: 'resume-feed',
    },
    {
      id: 'start-onboarding',
      title: 'Replay onboarding',
      subtitle: 'Teach SHARROW about your goals again',
      icon: BookOpen,
      keywords: 'onboarding setup goals intro replay tour',
      action: 'start-onboarding',
    },
    {
      id: 'data-provenance',
      title: 'About data & provenance',
      subtitle: 'How SHARROW labels simulated and live data',
      icon: FlaskConical,
      keywords: 'data provenance simulated live sources trust',
      route: '/settings?section=data',
    },
    {
      id: 'help',
      title: 'Keyboard shortcuts',
      subtitle: 'Command palette and navigation keys',
      icon: CircleHelp,
      keywords: 'help keyboard shortcuts keys command palette',
      route: '/settings?section=shortcuts',
    },
    {
      id: 'schedule',
      title: 'Evaluation schedule',
      subtitle: 'When predictions resolve and get evaluated',
      icon: CalendarCheck,
      keywords: 'schedule evaluation resolve predictions timing',
      route: '/predictions?focus=schedule',
    },
  ]

  for (const a of actions) {
    const s = Math.max(score(a.title, q), score(a.keywords, q) * 0.6)
    if (!q || s > 0) {
      out.push({
        id: `action-${a.id}`,
        group: 'action',
        title: a.title,
        subtitle: a.subtitle,
        icon: a.icon,
        keywords: a.keywords,
        route: a.route,
        action: a.action,
      })
    }
  }

  return out
}

export function rankCommands(items: CommandItem[], query: string): CommandItem[] {
  const q = query.trim().toLowerCase()
  if (!q) {
    const order: CommandGroup[] = ['ai', 'asset', 'navigate', 'action']
    return [...items].sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group))
  }
  return items
    .map((item) => {
      const s = Math.max(
        score(item.title, q),
        score(item.subtitle ?? '', q) * 0.7,
        score(item.keywords, q) * 0.5,
      )
      return { item, s }
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.item.group.localeCompare(b.item.group))
    .map((x) => x.item)
}
