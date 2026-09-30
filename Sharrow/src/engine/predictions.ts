import type {
  Conviction,
  MarketRegime,
  Prediction,
  PredictionEvaluation,
  PredictionOutcome,
  Signal,
} from './types'
import { assertSafeLanguage, directionPhrase } from './narrative'
import { lastSma, pctChange, volatility } from './indicators'
import { scoreBucket } from './conviction'
import { hashString, mulberry32 } from '@/lib/rng'

/* =========================================================================
   Prediction lifecycle: create → resolve → evaluate.
   Predictions are scenarios with explicit invalidation — never guarantees.
   ========================================================================= */

const SESSION_MS = 24 * 3_600_000

const UNEXPECTED_FACTORS = [
  'Sector rotation moved against the scenario mid-horizon',
  'Volatility expanded beyond the modelled range',
  'The prevailing regime shifted during the horizon',
  'A macro print repriced the entire factor complex',
  'Earnings-adjacent flows dominated price action',
]

export function horizonForScore(score: number): number {
  if (score >= 75) return 5
  if (score >= 55) return 10
  return 20
}

export function createPrediction(opts: {
  symbol: string
  conviction: Conviction
  signals: Signal[]
  closes: number[]
  regime: MarketRegime
  now: number
  createdBy?: 'engine' | 'user'
  id: string
}): Prediction | null {
  const { symbol, conviction, signals, closes, regime, now, createdBy = 'engine', id } = opts

  if (conviction.direction === 'neutral') return null
  if (conviction.score < 45) return null

  const price = closes[closes.length - 1]
  const horizonDays = horizonForScore(conviction.score)
  const dailyVol = (volatility(closes, 20) ?? 0.15) / Math.sqrt(252)
  const magnitude = dailyVol * Math.sqrt(horizonDays) * 100
  const sign = conviction.direction === 'bullish' ? 1 : -1
  const expectedMovePct = Number((sign * Math.max(magnitude, 0.6)).toFixed(2))
  const targetPrice = Number((price * (1 + expectedMovePct / 100)).toFixed(2))

  const contributing = conviction.contributing.length > 0 ? conviction.contributing : signals
  const support = contributing.slice(0, 4)
  const topCounter = conviction.counterSignals[0]
  const sma20 = lastSma(closes, 20)
  const sma50 = lastSma(closes, 50)

  const article = conviction.direction === 'bullish' ? 'an' : 'a'
  const scenario = `Scenario: if the observed pattern persists, ${symbol} would be consistent with ${article} ${directionPhrase(conviction.direction)} move of about ${Math.abs(expectedMovePct).toFixed(1)}% over the next ${horizonDays} sessions (confidence ${conviction.score}/100). This is a conditional scenario, not a forecast of fact.`

  const risks: Prediction['risks'] = [
    {
      label: 'Regime shift',
      detail: `A move to a weaker regime than “${regime}” would challenge this scenario — conditions drive more of the outcome than the pattern does.`,
    },
  ]
  if (topCounter) {
    risks.push({
      label: 'Counter-evidence',
      detail: `${topCounter.title}: ${topCounter.summary}`,
    })
  }
  risks.push({
    label: 'Volatility',
    detail: `A single session of ${(dailyVol * 100 * Math.sqrt(252)).toFixed(0)}% annualised volatility can consume a large share of the expected move.`,
  })

  const invalidation = [
    sma20 ? `Two consecutive closes below ${sma20.toFixed(2)} (20-day average)` : 'A sustained break of recent support',
    `Regime degrading from “${regime}” into a risk-off state`,
  ]

  assertSafeLanguage(scenario, `prediction(${symbol})`)

  return {
    id,
    symbol,
    title: `${symbol} ${conviction.direction === 'bullish' ? 'upside' : 'downside'} scenario · ${horizonDays} sessions`,
    scenario,
    direction: conviction.direction,
    horizon: `${horizonDays} sessions`,
    horizonDays,
    confidence: Math.min(conviction.score, 90),
    status: 'active',
    createdAt: now,
    createdBy,
    supportingSignals: support.map((s) => s.id),
    risks,
    invalidation,
    invalidationLevel: sma20 ?? sma50 ?? price,
    entryPrice: price,
    targetPrice,
    regimeAtCreation: regime,
    expectedMovePct,
  }
}

/** Resolves an active prediction at an explicit resolution price. */
export function resolvePrediction(
  pred: Prediction,
  resolutionPrice: number,
  now: number,
): Prediction | null {
  if (pred.status !== 'active' && pred.status !== 'created') return null

  const elapsed = Math.floor((now - pred.createdAt) / SESSION_MS)
  if (elapsed < pred.horizonDays) return null

  const entryPrice = pred.entryPrice ?? resolutionPrice
  const actualMovePct = Number(pctChange(entryPrice, resolutionPrice).toFixed(2))
  const expected = pred.expectedMovePct ?? 0
  const outcome = classifyOutcome(expected, actualMovePct)

  return {
    ...pred,
    status: 'resolved',
    resolvedAt: now,
    resolvedPrice: resolutionPrice,
    actualMovePct,
    outcome,
    actualNarrative: `Over ${pred.horizonDays} sessions the scenario played out as a ${actualMovePct >= 0 ? 'positive' : 'negative'} move of ${Math.abs(actualMovePct).toFixed(1)}%, against an expected ${Math.abs(expected).toFixed(1)}% ${expected >= 0 ? 'upside' : 'downside'}.`,
  }
}

export function classifyOutcome(expected: number, actual: number): PredictionOutcome {
  if (Math.abs(expected) < 0.3) return 'inconclusive'
  const sameSign = Math.sign(expected) === Math.sign(actual)
  const ratio = Math.abs(actual) / Math.abs(expected)
  if (!sameSign) return 'missed'
  if (ratio >= 0.6) return 'matched'
  return 'partial'
}

/** Builds the evaluation record for a resolved prediction. */
export function evaluatePrediction(pred: Prediction, now: number, engineVersion: string): Prediction {
  if (pred.status !== 'resolved' || !pred.outcome) return pred

  const expected = pred.expectedMovePct ?? 0
  const actual = pred.actualMovePct ?? 0
  const delta = `${actual >= 0 ? '+' : ''}${actual.toFixed(1)}% actual versus ${expected >= 0 ? '+' : ''}${expected.toFixed(1)}% expected (${(actual - expected).toFixed(1)} points of slippage)`

  const verdict = pred.outcome
  const headline =
    verdict === 'matched'
      ? `Matched: ${pred.symbol} moved as the scenario indicated`
      : verdict === 'partial'
        ? `Partial: direction matched, magnitude fell short`
        : verdict === 'missed'
          ? `Missed: ${pred.symbol} moved against the scenario`
          : `Inconclusive: too little movement to judge`

  const factors = [
    `Scenario framed at ${pred.entryPrice?.toFixed(2) ?? '—'} with horizon ${pred.horizon}`,
    `Resolved at ${pred.resolvedPrice?.toFixed(2) ?? '—'} after ${pred.horizonDays} sessions`,
    `Directional call was ${expected >= 0 ? 'upside' : 'downside'}; observed move was ${actual >= 0 ? 'positive' : 'negative'}`,
  ]

  let primaryUnexpectedFactor: string | undefined
  if (verdict === 'missed' || verdict === 'partial') {
    const rng = mulberry32(hashString(pred.id))
    primaryUnexpectedFactor = UNEXPECTED_FACTORS[Math.floor(rng() * UNEXPECTED_FACTORS.length)]
    factors.push(primaryUnexpectedFactor)
  }

  const bucket = scoreBucket(pred.confidence)
  const learningSummary = `A ${bucket} scenario (${pred.confidence}/100) resolved as “${verdict}”. Recorded for calibration of the ${bucket} band.`

  const evaluation: PredictionEvaluation = {
    at: now,
    verdict,
    headline,
    delta,
    factors,
    primaryUnexpectedFactor,
    learningSummary,
    engineVersion,
  }

  return { ...pred, status: 'evaluated', evaluation }
}
