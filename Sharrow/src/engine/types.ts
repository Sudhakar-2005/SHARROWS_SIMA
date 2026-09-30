/* =========================================================================
   SHARROW domain types.
   Shared by the data layer, the intelligence engine and the UI.
   Nothing here is presentation — components map these to the design system.
   ========================================================================= */

export type Provenance = 'simulated' | 'live' | 'historical' | 'backtest' | 'derived'

export type Timeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y'

/* ----------------------------- Market data ----------------------------- */

export interface AssetMeta {
  symbol: string
  name: string
  sector: SectorId
  kind: 'equity' | 'index'
  /** Brief descriptor used in headers and search. */
  description: string
}

export interface Candle {
  /** epoch ms */
  t: number
  o: number
  h: number
  l: number
  c: number
  v: number
}

export interface Quote {
  symbol: string
  price: number
  prevClose: number
  change: number
  changePct: number
  dayHigh: number
  dayLow: number
  volume: number
  /** epoch ms of last tick */
  updatedAt: number
  provenance: Provenance
}

export interface Series {
  symbol: string
  timeframe: Timeframe
  candles: Candle[]
  provenance: Provenance
}

export type SectorId =
  | 'it'
  | 'banks'
  | 'fmcg'
  | 'auto'
  | 'pharma'
  | 'energy'
  | 'metals'
  | 'infra'

export interface Sector {
  id: SectorId
  name: string
  /** Grouping used for market breadth and rotation views. */
  riskBeta: 'cyclical' | 'defensive' | 'structural'
}

/* ------------------------------ Intelligence ---------------------------- */

export type MarketRegime = 'constructive' | 'neutral' | 'defensive' | 'stressed' | 'risk-off'

export type SignalKind = 'technical' | 'fundamental' | 'news' | 'context' | 'sentiment'

export type SignalDirection = 'bullish' | 'bearish' | 'neutral'

export interface EvidenceItem {
  label: string
  value: string
}

export interface SourceRef {
  label: string
  kind: 'engine' | 'dataset' | 'news' | 'exchange'
  at: number
}

export interface Signal {
  id: string
  symbol?: string
  kind: SignalKind
  direction: SignalDirection
  /** 0–1 — how strong the observed pattern is. */
  strength: number
  /** 0–100 — how much the engine trusts it given regime + history. */
  confidence: number
  title: string
  summary: string
  evidence: EvidenceItem[]
  sources: SourceRef[]
  observedAt: number
  /** Signals expire — stale evidence is never presented as current. */
  validUntil?: number
}

export interface Conviction {
  /** 0–100 */
  score: number
  direction: SignalDirection
  regime: MarketRegime
  contributing: Signal[]
  counterSignals: Signal[]
  /** Calibration: how often comparable conviction has been right historically. */
  historicalHitRate?: number
  computedAt: number
  provenance: Provenance
}

/* ------------------------------- Predictions ---------------------------- */

export type PredictionStatus =
  | 'created'
  | 'active'
  | 'resolved'
  | 'evaluated'
  | 'learned'

export type PredictionOutcome = 'matched' | 'partial' | 'missed' | 'inconclusive'

export interface PredictionRisk {
  label: string
  detail: string
}

export interface Prediction {
  id: string
  symbol: string
  title: string
  /** Plain-language expected scenario — never a guarantee. */
  scenario: string
  direction: SignalDirection
  /** e.g. '5 sessions' | '20 sessions' | '3M' */
  horizon: string
  horizonDays: number
  confidence: number
  status: PredictionStatus
  createdAt: number
  createdBy: 'engine' | 'user'
  supportingSignals: string[]
  risks: PredictionRisk[]
  invalidation: string[]
  /** Price / level that would invalidate the scenario, when applicable. */
  invalidationLevel?: number
  /** Price the scenario was framed from. */
  entryPrice?: number
  /** Scenario's expected endpoint price. */
  targetPrice?: number
  /** Regime at creation — used to segment calibration by condition. */
  regimeAtCreation?: MarketRegime
  resolvedAt?: number
  resolvedPrice?: number
  actualMovePct?: number
  expectedMovePct?: number
  outcome?: PredictionOutcome
  /** What actually happened — filled at resolution. */
  actualNarrative?: string
  evaluation?: PredictionEvaluation
  learningId?: string
}

export interface PredictionEvaluation {
  at: number
  verdict: PredictionOutcome
  headline: string
  /** Difference between expected and actual. */
  delta: string
  factors: string[]
  primaryUnexpectedFactor?: string
  learningSummary: string
  engineVersion: string
}

/* --------------------------------- Learning ----------------------------- */

export type LearningStatus = 'detected' | 'validated' | 'proposed' | 'deployed'

export interface LearningEvent {
  id: string
  kind: 'pattern' | 'calibration' | 'signal-performance' | 'regime-behavior'
  title: string
  detail: string
  status: LearningStatus
  detectedAt: number
  validatedAt?: number
  deployedAt?: number
  /** Records evaluated that support the learning. */
  sampleSize: number
  effectSize?: number
  evidence: string[]
  provenance: Provenance
}

export interface IntelligenceVersion {
  version: string
  releasedAt: number
  changeSummary: string
  previousBehavior: string
  newBehavior: string
  reason: string
  validation: string
  performanceImpact: string
  status: 'deployed' | 'validating' | 'proposed'
  relatedLearningIds: string[]
}

/* --------------------------------- Activity ----------------------------- */

export type ActivityKind =
  | 'observe'
  | 'understand'
  | 'analyze'
  | 'generate'
  | 'track'
  | 'evaluate'
  | 'learn'
  | 'validate'
  | 'improve'
  | 'alert'

export interface ActivityEvent {
  id: string
  kind: ActivityKind
  title: string
  detail?: string
  at: number
  /** 0–2: informational → important → high risk */
  priority: 0 | 1 | 2
  href?: string
}

/* --------------------------------- Insights ----------------------------- */

export interface Insight {
  id: string
  symbol?: string
  /** WHAT */
  headline: string
  kind: 'momentum' | 'regime' | 'sector' | 'risk' | 'portfolio' | 'event' | 'calibration'
  /** WHY */
  why: string
  /** HOW IMPORTANT */
  importance: 'informational' | 'important' | 'critical'
  /** CONFIDENCE */
  confidence: number
  /** WHAT CHANGED */
  changed: string
  risk?: string
  invalidation?: string
  createdAt: number
  sources: SourceRef[]
  provenance: Provenance
  href?: string
}

/* ---------------------------------- News -------------------------------- */

export interface NewsItem {
  id: string
  headline: string
  source: string
  publishedAt: number
  summary: string
  sentiment: 'positive' | 'negative' | 'neutral'
  confidence: number
  affectedSymbols: string[]
  affectedSectors: SectorId[]
  marketImpact: 'low' | 'moderate' | 'high'
  portfolioRelevance: 'none' | 'watch' | 'relevant' | 'material'
  provenance: Provenance
}

/* --------------------------------- Events ------------------------------- */

export type MarketEventKind = 'earnings' | 'policy' | 'macro' | 'corporate'

export interface MarketEvent {
  id: string
  date: number
  label: string
  kind: MarketEventKind
  symbols: string[]
}
