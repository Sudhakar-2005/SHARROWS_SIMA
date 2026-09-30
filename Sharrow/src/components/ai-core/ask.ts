import { ASSET_BY_SYMBOL } from '@/data/universe'
import { useIntelligenceStore } from '@/store/intelligence-store'
import { useMarketStore } from '@/store/market-store'
import { dayDrivers, holdingRows, portfolioTotals } from '@/pages/portfolio/portfolio-data'
import {
  answerQuestion,
  type AnswerContext,
  type AnswerResult,
  type PortfolioAnswer,
} from '@/engine/answers'

/* =========================================================================
   Ask context builder.
   Collects plain data from the stores — no hooks, no subscriptions — so the
   palette can compose an answer outside render. Lives in its own .ts file:
   non-component exports keep react-refresh happy.
   ========================================================================= */

function buildPortfolio(quotes: AnswerContext['quotes']): PortfolioAnswer | null {
  const rows = holdingRows(quotes)
  const totals = portfolioTotals(rows)
  if (!totals) return null
  const toDriver = (rows: ReturnType<typeof holdingRows>) =>
    rows.map((r) => ({ symbol: r.symbol, dayPnl: r.dayPnl, changePct: r.changePct }))
  return {
    value: totals.value,
    dayPnl: totals.dayPnl,
    dayChangePct: totals.dayChangePct,
    pnl: totals.pnl,
    pnlPct: totals.pnlPct,
    count: totals.count,
    topGainers: toDriver(dayDrivers(rows, 'gain', 2)),
    topLosers: toDriver(dayDrivers(rows, 'loss', 2)),
  }
}

/** Widest mover among equity quotes — what "the tape" is actually doing. */
function findTopMover(quotes: AnswerContext['quotes']): { symbol: string; changePct: number } | null {
  let best: { symbol: string; changePct: number } | null = null
  for (const q of Object.values(quotes)) {
    if (ASSET_BY_SYMBOL[q.symbol]?.kind !== 'equity') continue
    if (!best || Math.abs(q.changePct) > Math.abs(best.changePct)) {
      best = { symbol: q.symbol, changePct: q.changePct }
    }
  }
  return best
}

/** Snapshot of everything `answerQuestion` reads, taken at call time. */
export function buildAskContext(): AnswerContext {
  const intel = useIntelligenceStore.getState()
  const market = useMarketStore.getState()
  return {
    snapshot: intel.snapshot,
    quotes: market.quotes,
    analyses: intel.analyses,
    news: market.news,
    predictions: intel.predictions,
    learnings: intel.learnings,
    insights: intel.insights,
    portfolio: buildPortfolio(market.quotes),
    topMover: findTopMover(market.quotes),
  }
}

/** Compose an answer for a question from the current store state. */
export function ask(question: string, routeOverride?: string): AnswerResult {
  return answerQuestion(question, buildAskContext(), routeOverride)
}
