import type { Insight, LearningEvent, NewsItem, Prediction, Quote } from './types'
import type { AssetAnalysis, MarketSnapshot } from './cycle'
import { ASSETS, ASSET_BY_SYMBOL, SECTOR_NAME } from '@/data/universe'
import { direction, inr, percent, percentPlain } from '@/lib/format'
import { assertSafeLanguage, directionPhrase } from './narrative'
import { regimeLabel } from './regime'
import { scoreBucket } from './conviction'
import { ENGINE_VERSION } from './learning'

/* =========================================================================
   Answer composer for Ask SHARROW.
   Pure: question + plain context snapshot in, deterministic copy and a
   destination route out. Nothing here fetches, subscribes or reads the
   clock — the palette feeds it already-collected store state.
   ========================================================================= */

export type AnswerTopic =
  | 'regime'
  | 'market'
  | 'portfolio'
  | 'accuracy'
  | 'learning'
  | 'predictions'
  | 'news'
  | 'alerts'
  | 'asset'
  | 'general'

/** Fixed closing line every composed answer ends with. */
export const ANSWER_SUFFIX =
  'Reads are simulated and labeled — explanations of observed state, not instructions.'

export interface PortfolioAnswer {
  value: number
  dayPnl: number
  dayChangePct: number
  pnl: number
  pnlPct: number
  count: number
  topGainers: { symbol: string; dayPnl: number; changePct: number }[]
  topLosers: { symbol: string; dayPnl: number; changePct: number }[]
}

export interface AnswerContext {
  snapshot: MarketSnapshot | null
  quotes: Record<string, Quote>
  analyses: Record<string, AssetAnalysis>
  news: NewsItem[]
  predictions: Prediction[]
  learnings: LearningEvent[]
  insights: Insight[]
  portfolio: PortfolioAnswer | null
  topMover: { symbol: string; changePct: number } | null
}

export interface AnswerResult {
  question: string
  topic: AnswerTopic
  symbol: string | null
  text: string
  route: string
}

/* ----------------------------- Detection -------------------------------- */

const TOPIC_RULES: ReadonlyArray<readonly [AnswerTopic, RegExp]> = [
  ['accuracy', /accura|calibrat|hit[- ]rate|track[- ]record|success rate|evaluation record|how well/i],
  ['learning', /learn(?:ed|ing|ings)?|improve(?:d|ment|ments)?/i],
  ['predictions', /predict|scenario|forecast/i],
  ['alerts', /alert|notification|urgent|warning/i],
  ['news', /\bnews\b|headline|research|article|press/i],
  ['portfolio', /portfolio|holdings?\b|my (?:positions|pnl|investments|money)|exposure|concentration/i],
  ['regime', /regime|market condition|risk appetite|defensive|stressed|constructive|risk[- ]off/i],
  [
    'market',
    /\bmarket\b|nifty|sensex|\bindex\b|indices|mover|\bmoved?\b|\bchange[ds]?\b|breadth|sector|benchmark|session|stocks?|shares?/i,
  ],
]

/** Which topic bucket a free-text question falls into. Ordered rules win. */
export function detectTopic(question: string): AnswerTopic {
  const q = question.trim()
  for (const [topic, pattern] of TOPIC_RULES) {
    if (pattern.test(q)) return topic
  }
  return 'general'
}

const QUESTION_START =
  /^(why|what|how|when|where|who|which|should|can|is|are|do|does|explain|tell|show)\b/i

/** Cheap "is the user asking something" test for the palette's ask affordance. */
export function looksLikeQuestion(input: string): boolean {
  const q = input.trim()
  if (!q) return false
  return q.endsWith('?') || QUESTION_START.test(q)
}

/** Why/explain phrasing routes market-level questions to the intelligence desk. */
function isWhyQuestion(q: string): boolean {
  return /\bwhy\b/i.test(q) || /^(explain|what happened|what caused|what makes|how come)\b/i.test(q)
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function tokenMatches(upper: string, token: string): boolean {
  return new RegExp(`(^|[^A-Z0-9])${escapeRe(token)}([^A-Z0-9]|$)`).test(upper)
}

const SYMBOLS_BY_LEN = ASSETS.map((a) => a.symbol).sort((a, b) => b.length - a.length)

const NAMES_BY_LEN = ASSETS.map((a) => ({ symbol: a.symbol, name: a.name.toUpperCase() })).sort(
  (a, b) => b.name.length - a.name.length,
)

/** Conversational spellings that differ from symbol or legal name. */
const SYMBOL_ALIASES: [string, string][] = Object.entries({
  'MARUTI SUZUKI': 'MARUTI',
  'ADANI PORTS': 'ADANIPORTS',
  'TATA MOTORS': 'TATAMOTORS',
  'BANK NIFTY': 'BANKNIFTY',
  'NIFTY BANK': 'BANKNIFTY',
  'POWER GRID': 'POWERGRID',
  'BAJAJ AUTO': 'BAJAJ-AUTO',
  'SUN PHARMA': 'SUNPHARMA',
  'HDFC BANK': 'HDFCBANK',
  'ULTRATECH': 'ULTRACEMCO',
  'NIFTY 50': 'NIFTY50',
  'NIFTY IT': 'NIFTYIT',
  'DR REDDY': 'DRREDDY',
  'INFOSYS': 'INFY',
  'NESTLE': 'NESTLEIND',
  'VEDANTA': 'VEDL',
  'KOTAK': 'KOTAKBANK',
  'HDFC': 'HDFCBANK',
  'NIFTY': 'NIFTY50',
  'SBI': 'SBIN',
  'HUL': 'HINDUNILVR',
}).sort((a, b) => b[0].length - a[0].length)

/**
 * Longest-match symbol resolution: exact symbol tokens first, then
 * conversational aliases, then full legal names. Returns null when the
 * question names nothing in the universe.
 */
export function findSymbol(question: string): string | null {
  const upper = question.toUpperCase()
  for (const symbol of SYMBOLS_BY_LEN) {
    if (tokenMatches(upper, symbol)) return symbol
  }
  for (const [alias, symbol] of SYMBOL_ALIASES) {
    if (tokenMatches(upper, alias)) return symbol
  }
  for (const { symbol, name } of NAMES_BY_LEN) {
    if (upper.includes(name)) return symbol
  }
  return null
}

/* ------------------------------ Composing ------------------------------- */

function sent(...parts: string[]): string {
  return [...parts, ANSWER_SUFFIX].join(' ')
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

function moveWord(value: number): string {
  const d = direction(value)
  return d === 'up' ? 'higher' : d === 'down' ? 'lower' : 'flat'
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

function composeRegime(ctx: AnswerContext): string {
  const s = ctx.snapshot
  if (!s) {
    return sent(
      'The intelligence cycle has not emitted a market snapshot yet, so there is no regime reading to report.',
      'The classifier labels conditions once the first cycle completes.',
    )
  }
  return sent(
    `The market reads ${regimeLabel(s.regime.regime)} with ${s.regime.confidence}% classifier confidence, scoring ${s.regime.score} on the −100 to +100 scale.`,
    `Breadth stands at ${percentPlain(s.breadth * 100, 0)} advancing — ${s.advancing} up, ${s.declining} down and ${s.unchanged} unchanged.`,
    `Volatility across 20 sessions is ${s.volatilityPct}% against a ${s.volatilityBaselinePct}% baseline, which is why the label moves as evidence moves.`,
  )
}

function composeMarket(ctx: AnswerContext): string {
  const s = ctx.snapshot
  if (!s) {
    return sent(
      'Market readings are unavailable until the first intelligence cycle completes.',
      'Breadth, sector leadership and the regime label all arrive with that snapshot.',
    )
  }
  const lead = s.sectorPerformance[0]
  const mover = ctx.topMover
  const leadSentence = lead
    ? `Sector leadership: ${lead.name} at ${percent(lead.changePct)}${
        mover ? ` while ${mover.symbol} is the widest mover at ${percent(mover.changePct)}` : ''
      }.`
    : 'Sector leadership is not ranked in this cycle.'
  return sent(
    `The ${s.indexSymbol} is ${moveWord(s.indexChangePct)} ${percent(s.indexChangePct)} on the session, with ${percentPlain(
      s.breadth * 100,
      0,
    )} of constituents advancing (${s.advancing} up, ${s.declining} down).`,
    `${regimeLabel(s.regime.regime)} conditions with ${s.regime.confidence}% classifier confidence frame the move.`,
    leadSentence,
    `Twenty-session volatility reads ${s.volatilityPct}% against a ${s.volatilityBaselinePct}% baseline, which sets how unusual today's range looks.`,
  )
}

function composePortfolio(ctx: AnswerContext): string {
  const p = ctx.portfolio
  if (!p) {
    return sent(
      'The sample book has not loaded, so there is no movement to explain.',
      'Portfolio answers appear once holdings and quotes are both present.',
    )
  }
  const gainers = p.topGainers.map((g) => g.symbol)
  const losers = p.topLosers.map((l) => l.symbol)
  const driverSentence =
    gainers.length > 0 || losers.length > 0
      ? [
          gainers.length > 0
            ? `${joinList(gainers)} ${gainers.length === 1 ? 'was' : 'were'} the largest contributor${
                gainers.length === 1 ? '' : 's'
              } to the upside`
            : '',
          losers.length > 0
            ? `${joinList(losers)} ${losers.length === 1 ? 'was' : 'were'} the main drag`
            : '',
        ]
          .filter(Boolean)
          .join('; ') + '.'
      : 'No holding moved enough to lead either side of the session.'
  const parts = [
    `Your ${p.count} holdings are ${p.dayPnl >= 0 ? 'up' : 'down'} ${inr(Math.abs(p.dayPnl), 0)} today (${percent(
      p.dayChangePct,
    )}), valuing the book at ${inr(p.value, 0)}.`,
    driverSentence,
    `Against invested value the book is ${p.pnl >= 0 ? 'ahead' : 'behind'} ${inr(Math.abs(p.pnl), 0)} (${percent(
      p.pnlPct,
    )}).`,
  ]
  if (ctx.snapshot) {
    parts.push(`The ${ctx.snapshot.indexSymbol} moved ${percent(ctx.snapshot.indexChangePct)} the same session.`)
  }
  return sent(...parts)
}

type EvaluatedPrediction = Prediction & { evaluation: NonNullable<Prediction['evaluation']> }

function composeAccuracy(ctx: AnswerContext): string {
  const evaluated = ctx.predictions.filter(
    (p): p is EvaluatedPrediction => p.evaluation !== undefined,
  )
  if (evaluated.length === 0) {
    return sent(
      'No scenario has completed evaluation yet, so an accuracy figure would be empty.',
      'Results appear here once open scenarios reach their horizon and get scored.',
    )
  }
  let matched = 0
  let partial = 0
  let missed = 0
  let inconclusive = 0
  for (const p of evaluated) {
    if (p.evaluation.verdict === 'matched') matched++
    else if (p.evaluation.verdict === 'partial') partial++
    else if (p.evaluation.verdict === 'missed') missed++
    else inconclusive++
  }
  const rate = (matched / evaluated.length) * 100
  const breakdown = [`${partial} partial`, `${missed} missed`, inconclusive > 0 ? `${inconclusive} inconclusive` : '']
    .filter(Boolean)
    .join(', ')
  return sent(
    `Of ${plural(evaluated.length, 'evaluated scenario')}, ${matched} matched — a strict matched-only rate of ${percentPlain(
      rate,
      0,
    )}.`,
    `${breakdown.charAt(0).toUpperCase()}${breakdown.slice(1)} outcomes sit alongside that figure and are never blended into it.`,
    'Readings are bucketed by conviction before comparison, so high-conviction calls are judged against their own history.',
  )
}

function composeLearning(ctx: AnswerContext): string {
  const learnings = ctx.learnings
  if (learnings.length === 0) {
    return sent(
      'No learning events are on record yet.',
      'They accumulate as evaluated scenarios repeat into validated patterns.',
    )
  }
  const deployed = learnings.filter((l) => l.status === 'deployed').length
  const recent = learnings.slice(0, 2).map((l) => l.title)
  return sent(
    `${plural(learnings.length, 'learning event')} on record, ${deployed} of them already deployed into engine ${ENGINE_VERSION}.`,
    `Recent additions: ${joinList(recent)}.`,
    'Each event stores sample size, evidence and effect size, so any behaviour change traces back to what was observed.',
  )
}

function composePredictions(ctx: AnswerContext): string {
  const predictions = ctx.predictions
  if (predictions.length === 0) {
    return sent(
      'No scenarios are open in this cycle.',
      'New ones appear when a conviction reading clears the creation gate.',
    )
  }
  const live = predictions.filter((p) => p.status === 'active' || p.status === 'created')
  const evaluated = predictions.filter((p) => p.evaluation)
  const matched = evaluated.filter((p) => p.evaluation?.verdict === 'matched').length
  const missed = evaluated.filter((p) => p.evaluation?.verdict === 'missed').length
  const symbols = new Set(live.map((p) => p.symbol))
  return sent(
    `${plural(live.length, 'scenario')} open across ${plural(symbols.size, 'symbol')}, with ${evaluated.length} already evaluated.`,
    `The ledger reads ${matched} matched and ${missed} missed so far, each record keeping its original invalidation note.`,
    'Confidence figures are calibrated readings — they describe how often comparable reads held up, nothing more.',
  )
}

function composeNews(ctx: AnswerContext): string {
  const news = ctx.news
  if (news.length === 0) {
    return sent(
      'The news feed returned no items this cycle.',
      'Headlines arrive with source, sentiment and relevance scores when the provider responds.',
    )
  }
  const relevant = news.filter(
    (n) => n.portfolioRelevance === 'material' || n.portfolioRelevance === 'relevant',
  ).length
  const high = news.filter((n) => n.marketImpact === 'high').length
  return sent(
    `${plural(news.length, 'headline')} in the feed — ${relevant} ranked relevant or material to your holdings, ${high} flagged high impact.`,
    'Every item carries its source, sentiment and affected symbols, so the weighting is visible.',
    'Research orders by portfolio relevance rather than raw recency.',
  )
}

function composeAlerts(ctx: AnswerContext): string {
  const insights = ctx.insights
  if (insights.length === 0) {
    return sent(
      'No insights are open in this cycle.',
      'They populate once the cycle scores momentum, regime, sector and risk observations.',
    )
  }
  const critical = insights.filter((i) => i.importance === 'critical').length
  const important = insights.filter((i) => i.importance === 'important').length
  return sent(
    `${critical} critical and ${important} important open against ${plural(insights.length, 'insight')} this cycle.`,
    'Each pairs a headline with what changed, why it matters and the condition that would invalidate it.',
    'Importance reflects potential impact on the book, not urgency to act.',
  )
}

function composeAsset(symbol: string, ctx: AnswerContext): string {
  const meta = ASSET_BY_SYMBOL[symbol]
  const quote = ctx.quotes[symbol]
  const analysis = ctx.analyses[symbol]
  const name = meta?.name ?? symbol
  const head = quote
    ? `${name} trades at ${inr(quote.price)} (${percent(quote.changePct)} on the session).`
    : `${name} has no quote in this cycle, so only recorded readings are available.`
  const sectorName = meta ? SECTOR_NAME[meta.sector] : undefined
  const sectorPerf = ctx.snapshot?.sectorPerformance.find((sp) => meta && sp.sector === meta.sector)
  const sectorLine = sectorName
    ? `${sectorName} is ${sectorPerf ? `${percent(sectorPerf.changePct)} today` : 'unranked in this cycle'}.`
    : 'No sector context is available for this instrument.'
  if (!analysis) {
    return sent(
      head,
      `${symbol} is quoted by the cycle but not scored — conviction covers equity constituents once analyses run.`,
      sectorLine,
    )
  }
  const conviction = analysis.conviction
  const strongest = conviction.contributing[0]
  return sent(
    head,
    `Conviction reads ${conviction.score} (${scoreBucket(conviction.score)}) leaning ${directionPhrase(
      conviction.direction,
    )} — ${plural(conviction.contributing.length, 'contributing signal')} against ${conviction.counterSignals.length}.`,
    strongest ? `${strongest.title} carries the most weight in that reading.` : 'No single signal dominates the reading.',
    sectorLine,
  )
}

function composeGeneral(ctx: AnswerContext): string {
  const s = ctx.snapshot
  const evaluated = ctx.predictions.filter((p) => p.evaluation).length
  const head = s
    ? `That did not map to one topic, so here is the current state: ${s.indexSymbol} ${moveWord(
        s.indexChangePct,
      )} ${percent(s.indexChangePct)} under ${regimeLabel(s.regime.regime)} conditions.`
    : 'That did not map to one topic, and the first intelligence cycle has not produced a snapshot yet.'
  return sent(
    head,
    `${plural(evaluated, 'scenario')} evaluated, ${plural(ctx.learnings.length, 'learning')} on record.`,
    'Try a symbol such as TCS or NIFTY, ask "what is the market regime", or ask "how accurate is SHARROW right now".',
  )
}

/* -------------------------------- Routing ------------------------------- */

function routeFor(topic: AnswerTopic, q: string, symbol: string | null, why: boolean): string {
  const ask = `/intelligence?q=${encodeURIComponent(q)}`
  switch (topic) {
    case 'regime':
      return '/markets?focus=regime'
    case 'market':
      return why ? ask : '/markets?focus=changes'
    case 'portfolio':
      return '/portfolio?explain=today'
    case 'accuracy':
      return '/evolution?focus=accuracy'
    case 'learning':
      return '/evolution?focus=learnings'
    case 'predictions':
      return /missed|failed|wrong/i.test(q) ? '/predictions?status=missed' : '/predictions'
    case 'news':
      return '/research?focus=portfolio'
    case 'alerts':
      return '/alerts?priority=important'
    case 'asset':
      return symbol ? `/asset/${symbol}` : ask
    case 'general':
      return ask
  }
}

/**
 * Compose an answer for a free-text question.
 * `routeOverride` wins over derived routing — the palette passes the route
 * of the AI intent or analysis command the user actually picked.
 */
export function answerQuestion(
  question: string,
  ctx: AnswerContext,
  routeOverride?: string,
): AnswerResult {
  const q = question.trim()
  const symbol = findSymbol(q)
  const why = isWhyQuestion(q)
  const meta = symbol ? ASSET_BY_SYMBOL[symbol] : undefined

  let topic = detectTopic(q)
  // Named instruments resolve to the asset desk — except a why/explain
  // question about an index, which stays market-level and routes to the
  // intelligence desk with the question attached.
  if (symbol && (topic === 'general' || topic === 'market') && !(why && meta?.kind === 'index')) {
    topic = 'asset'
  }

  const text =
    topic === 'regime'
      ? composeRegime(ctx)
      : topic === 'market'
        ? composeMarket(ctx)
        : topic === 'portfolio'
          ? composePortfolio(ctx)
          : topic === 'accuracy'
            ? composeAccuracy(ctx)
            : topic === 'learning'
              ? composeLearning(ctx)
              : topic === 'predictions'
                ? composePredictions(ctx)
                : topic === 'news'
                  ? composeNews(ctx)
                  : topic === 'alerts'
                    ? composeAlerts(ctx)
                    : topic === 'asset' && symbol
                      ? composeAsset(symbol, ctx)
                      : composeGeneral(ctx)

  assertSafeLanguage(text, 'answerQuestion')

  return {
    question: q,
    topic,
    symbol,
    text,
    route: routeOverride ?? routeFor(topic, q, symbol, why),
  }
}
