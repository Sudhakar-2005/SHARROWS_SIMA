import { create } from 'zustand'
import type { AIState } from '@/design/tokens'
import type {
  ActivityEvent,
  IntelligenceVersion,
  Insight,
  LearningEvent,
  Prediction,
  SignalDirection,
} from '@/engine/types'
import {
  buildAssetAnalysis,
  buildMarketSnapshot,
  generateActivity,
  generateInsights,
  type AssetAnalysis,
  type MarketSnapshot,
} from '@/engine/cycle'
import { computeConviction } from '@/engine/conviction'
import { deriveLearnings, deriveVersions, ENGINE_VERSION } from '@/engine/learning'
import { assessRegime } from '@/engine/regime'
import { createPrediction, evaluatePrediction, resolvePrediction } from '@/engine/predictions'
import { technicalSignals } from '@/engine/signals'
import { closes as toCloses } from '@/engine/indicators'
import { EQUITY_SYMBOLS, INDEX_SYMBOLS } from '@/data/universe'
import { getDailySeries, withLiveTail } from '@/services/market-data'
import { useAIStore } from './ai-store'
import { useMarketStore } from './market-store'

/* =========================================================================
   Intelligence store: runs the observation cycle and owns everything the
   engine produces — snapshot, analyses, insights, predictions, learning.
   ========================================================================= */

const SESSION_MS = 86_400_000
const BACKTEST_SYMBOLS = ['TCS', 'HDFCBANK', 'RELIANCE', 'INFY', 'ITC', 'LT', 'SUNPHARMA', 'TATAMOTORS']
const ENTRY_OFFSETS = [26, 14]
const MAX_ACTIVE = 4
const MAX_ACTIVITY = 60
const MAX_HISTORY = 6

export type IntelligenceStatus = 'idle' | 'loading' | 'ready' | 'error'

/** One cycle's conviction reading, kept for shift detection across cycles. */
export interface ConvictionPoint {
  score: number
  direction: SignalDirection
  at: number
}

/** Appends the cycle's readings, keeping the most recent points per symbol. */
function appendHistory(
  analyses: Record<string, AssetAnalysis>,
  prev: Record<string, ConvictionPoint[]>,
  at: number,
): Record<string, ConvictionPoint[]> {
  const out: Record<string, ConvictionPoint[]> = {}
  for (const [symbol, analysis] of Object.entries(analyses)) {
    const series = prev[symbol] ?? []
    out[symbol] = [
      ...series,
      { score: analysis.conviction.score, direction: analysis.conviction.direction, at },
    ].slice(-MAX_HISTORY)
  }
  return out
}

interface IntelligenceStore {
  status: IntelligenceStatus
  error: string | null
  snapshot: MarketSnapshot | null
  analyses: Record<string, AssetAnalysis>
  /** Recent conviction readings per symbol, oldest first. */
  history: Record<string, ConvictionPoint[]>
  insights: Insight[]
  predictions: Prediction[]
  learnings: LearningEvent[]
  versions: IntelligenceVersion[]
  activity: ActivityEvent[]
  cycleCount: number
  lastCycleAt: number | null
  initialize: () => Promise<void>
  runCycle: () => void
  getAnalysis: (symbol: string) => AssetAnalysis | undefined
  reset: () => void
}

function setAI(state: AIState, label: string) {
  useAIStore.getState().setState(state, label)
}

function pushAll(events: ActivityEvent[]) {
  const ai = useAIStore.getState()
  for (const e of [...events].reverse()) ai.pushActivity(e)
}

/** Waits for the market feed without stomping an in-flight load. */
async function waitUntilMarketReady(timeoutMs = 8000): Promise<void> {
  if (useMarketStore.getState().status === 'idle') void useMarketStore.getState().load()
  const start = Date.now()
  for (;;) {
    const market = useMarketStore.getState()
    if (market.status === 'ready') {
      if (Object.keys(market.quotes).length > 0) return
    } else if (market.status === 'error') {
      throw new Error(market.error ?? 'The market feed failed to start.')
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error('The market feed did not become ready in time.')
    }
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
}

/** Deterministic backtest: scenarios created on past sessions, resolved with what followed. */
function seedBacktestPredictions(now: number): Prediction[] {
  const indexCloses = toCloses(getDailySeries(INDEX_SYMBOLS[0]))
  const out: Prediction[] = []

  for (const symbol of BACKTEST_SYMBOLS) {
    const candles = getDailySeries(symbol)
    if (candles.length < 90) continue
    const allCloses = candles.map((c) => c.c)

    for (const offset of ENTRY_OFFSETS) {
      const i = candles.length - 1 - offset
      if (i < 80) continue
      const at = candles[i].t
      const slice = candles.slice(0, i + 1)
      const sliceCloses = allCloses.slice(0, i + 1)

      const regime = assessRegime({ closes: indexCloses.slice(0, i + 1), breadth: 0.5 })
      const signals = technicalSignals(symbol, slice, at)
      const conviction = computeConviction({ signals, regime: regime.regime, now: at })

      const pred = createPrediction({
        symbol,
        conviction,
        signals,
        closes: sliceCloses,
        regime: regime.regime,
        now: at,
        id: `pred-bt-${symbol}-${offset}`,
      })
      if (!pred) continue

      const resolutionIndex = i + pred.horizonDays
      if (resolutionIndex >= candles.length) continue

      const resolved = resolvePrediction(pred, allCloses[resolutionIndex], now)
      if (!resolved) continue
      out.push(evaluatePrediction(resolved, now, ENGINE_VERSION))
    }
  }
  return out
}

function createLivePredictions(
  analyses: AssetAnalysis[],
  regime: MarketSnapshot['regime']['regime'],
  existing: Prediction[],
  now: number,
): Prediction[] {
  const activeSymbols = new Set(
    existing.filter((p) => p.status === 'active' || p.status === 'created').map((p) => p.symbol),
  )
  const ranked = [...analyses]
    .filter((a) => !activeSymbols.has(a.symbol))
    .sort((a, b) => b.conviction.score - a.conviction.score)

  const out: Prediction[] = []
  for (const a of ranked) {
    if (out.length >= MAX_ACTIVE) break
    const closes = toCloses(withLiveTail(a.symbol, getDailySeries(a.symbol)))
    const pred = createPrediction({
      symbol: a.symbol,
      conviction: a.conviction,
      signals: a.signals,
      closes,
      regime,
      now,
      id: `pred-live-${a.symbol}-${now}`,
    })
    if (pred) out.push(pred)
  }
  return out
}

export const useIntelligenceStore = create<IntelligenceStore>((set, get) => ({
  status: 'idle',
  error: null,
  snapshot: null,
  analyses: {},
  history: {},
  insights: [],
  predictions: [],
  learnings: [],
  versions: [],
  activity: [],
  cycleCount: 0,
  lastCycleAt: null,

  initialize: async () => {
    if (get().status === 'loading' || get().status === 'ready') return
    set({ status: 'loading', error: null })

    try {
      await waitUntilMarketReady()
      const { quotes, news } = useMarketStore.getState()

      const now = Date.now()

      setAI('observing', 'Observing markets')
      const snapshot = buildMarketSnapshot({ quotes, now })

      setAI('analyzing', 'Mapping signals')
      const analyses: Record<string, AssetAnalysis> = {}
      for (const symbol of EQUITY_SYMBOLS) {
        analyses[symbol] = buildAssetAnalysis({
          symbol,
          quotes,
          snapshot,
          news,
          now,
        })
      }

      setAI('thinking', 'Drafting scenarios')
      const seeds = seedBacktestPredictions(now)
      const live = createLivePredictions(
        Object.values(analyses),
        snapshot.regime.regime,
        seeds,
        now,
      )
      const predictions = [...seeds, ...live]

      const learnings = deriveLearnings(predictions, now)
      const versions = deriveVersions(learnings, now)

      const insights = generateInsights({
        snapshot,
        analyses: Object.values(analyses),
        quotes,
        predictions,
        now,
      })

      const activity = generateActivity({
        snapshot,
        analyses: Object.values(analyses),
        insightCount: insights.length,
        predictions,
        evaluationCount: predictions.filter((p) => p.evaluation).length,
        now,
      })
      pushAll(activity)

      set({
        status: 'ready',
        snapshot,
        analyses,
        history: appendHistory(analyses, {}, now),
        insights,
        predictions,
        learnings,
        versions,
        activity,
        cycleCount: 1,
        lastCycleAt: now,
      })

      setAI('ready', 'Monitoring markets')
    } catch (e) {
      set({
        status: 'error',
        error: e instanceof Error ? e.message : 'The intelligence cycle could not start.',
      })
      setAI('idle', 'Engine unavailable')
    }
  },

  runCycle: () => {
    const state = get()
    if (state.status !== 'ready' || !state.snapshot) return

    const market = useMarketStore.getState()
    if (market.status !== 'ready') return
    const quotes = market.quotes
    const news = market.news
    const now = Date.now()

    setAI('observing', 'Observing markets')
    const previousRegime = { regime: state.snapshot.regime.regime, at: state.snapshot.at }
    const snapshot = buildMarketSnapshot({ quotes, now })

    setAI('analyzing', 'Updating conviction')
    const analyses: Record<string, AssetAnalysis> = {}
    for (const symbol of EQUITY_SYMBOLS) {
      analyses[symbol] = buildAssetAnalysis({ symbol, quotes, snapshot, news, now })
    }

    // Resolve any active scenario whose horizon has elapsed.
    let resolvedAny = false
    const predictions = state.predictions.map((p) => {
      if (p.status !== 'active' && p.status !== 'created') return p
      if (now - p.createdAt < p.horizonDays * SESSION_MS) return p
      const price = quotes[p.symbol]?.price
      if (price === undefined) return p
      const resolved = resolvePrediction(p, price, now)
      if (!resolved) return p
      resolvedAny = true
      return evaluatePrediction(resolved, now, ENGINE_VERSION)
    })

    // Top up live scenarios if slots freed up.
    const topped = [...predictions, ...createLivePredictions(Object.values(analyses), snapshot.regime.regime, predictions, now)]

    const learnings = resolvedAny ? deriveLearnings(topped, now) : state.learnings
    const versions = resolvedAny ? deriveVersions(learnings, now) : state.versions

    setAI('thinking', 'Drafting insights')
    const insights = generateInsights({
      snapshot,
      analyses: Object.values(analyses),
      quotes,
      previousRegime,
      predictions: topped,
      now,
    })

    const activity = generateActivity({
      snapshot,
      analyses: Object.values(analyses),
      insightCount: insights.length,
      predictions: topped,
      evaluationCount: topped.filter((p) => p.evaluation).length,
      now,
    }).slice(0, 3)
    pushAll(activity)

    const mergedActivity = [...activity, ...state.activity].slice(0, MAX_ACTIVITY)

    set({
      snapshot,
      analyses,
      history: appendHistory(analyses, state.history, now),
      insights,
      predictions: topped,
      learnings,
      versions,
      activity: mergedActivity,
      cycleCount: state.cycleCount + 1,
      lastCycleAt: now,
    })

    setAI('ready', 'Monitoring markets')
  },

  getAnalysis: (symbol) => get().analyses[symbol],

  reset: () =>
    set({
      status: 'idle',
      error: null,
      snapshot: null,
      analyses: {},
      history: {},
      insights: [],
      predictions: [],
      learnings: [],
      versions: [],
      activity: [],
      cycleCount: 0,
      lastCycleAt: null,
    }),
}))

/* ------------------------------- Selectors ------------------------------ */

export function selectActive(predictions: Prediction[]): Prediction[] {
  return predictions.filter((p) => p.status === 'active' || p.status === 'created')
}

export function selectEvaluated(predictions: Prediction[]): Prediction[] {
  return predictions.filter((p) => p.evaluation)
}

export function selectPortfolioTotal(
  holdings: { symbol: string; quantity: number }[],
  quotes: Record<string, { price: number }>,
): number {
  return holdings.reduce((sum, h) => sum + h.quantity * (quotes[h.symbol]?.price ?? 0), 0)
}
