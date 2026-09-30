import type { MarketRegime } from '@/engine/types'
import { lastSma, maxDrawdown, roc, slopePct, volatility } from './indicators'

/* =========================================================================
   Market regime classifier.
   Combines trend, momentum, volatility and breadth into one labelled state
   with explicit evidence — the anchor for every downstream interpretation.
   ========================================================================= */

export interface RegimeInputs {
  closes: number[]
  /** 0–1 fraction of constituents advancing or above their short average. */
  breadth: number
}

export interface RegimeAssessment {
  regime: MarketRegime
  /** 40–92. Capped low: the classifier is a judgement, not a fact. */
  confidence: number
  /** −100 (risk-off) … +100 (strongly constructive). */
  score: number
  evidence: string[]
  components: {
    trend: number
    momentum: number
    volatility: number
    drawdown: number
    breadth: number
  }
}

const REGIME_ORDER: MarketRegime[] = ['risk-off', 'stressed', 'defensive', 'neutral', 'constructive']

export function regimeLabel(regime: MarketRegime): string {
  return (
    {
      constructive: 'Constructive',
      neutral: 'Neutral',
      defensive: 'Defensive',
      stressed: 'Stressed',
      'risk-off': 'Risk-off',
    } as const
  )[regime]
}

export function regimeDescription(regime: MarketRegime): string {
  return (
    {
      constructive: 'Conditions favour risk-taking — breadth and momentum are expanding.',
      neutral: 'No dominant condition — participation and momentum are mixed.',
      defensive: 'Conditions favour capital preservation — leadership is narrowing.',
      stressed: 'Volatility is elevated — position sizing and risk matter more than direction.',
      'risk-off': 'Systematic selling conditions — capital is rotating toward safety.',
    } as const
  )[regime]
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

export function assessRegime({ closes, breadth }: RegimeInputs): RegimeAssessment {
  const evidence: string[] = []

  // --- Trend component ---
  const sma50 = lastSma(closes, 50)
  const price = closes[closes.length - 1]
  const vsAverage = sma50 ? (price / sma50 - 1) * 100 : 0
  const trendSlope = slopePct(closes, 50, 10) ?? 0

  let trend = 0
  if (vsAverage > 6) trend += 2
  else if (vsAverage > 1.5) trend += 1
  else if (vsAverage < -6) trend -= 2
  else if (vsAverage < -1.5) trend -= 1
  if (trendSlope > 1.2) trend += 1
  else if (trendSlope < -1.2) trend -= 1

  evidence.push(
    sma50
      ? `Price ${Math.abs(vsAverage).toFixed(1)}% ${vsAverage >= 0 ? 'above' : 'below'} its 50-day average`
      : 'Insufficient history for the 50-day average',
  )

  // --- Momentum component ---
  const momentum20 = roc(closes, 20) ?? 0
  let momentum = 0
  if (momentum20 > 6) momentum += 2
  else if (momentum20 > 1.5) momentum += 1
  else if (momentum20 < -6) momentum -= 2
  else if (momentum20 < -1.5) momentum -= 1
  evidence.push(`Benchmark ${momentum20 >= 0 ? 'gained' : 'fell'} ${Math.abs(momentum20).toFixed(1)}% over 20 sessions`)

  // --- Volatility component ---
  const volNow = volatility(closes, 20) ?? 0
  const volBaseline = volatility(closes.slice(0, -20), 120) ?? volNow
  const volRatio = volBaseline > 0 ? volNow / volBaseline : 1
  let vol = 0
  if (volRatio > 1.6) vol -= 2
  else if (volRatio > 1.25) vol -= 1
  evidence.push(
    `20-day volatility runs ${(volNow * 100).toFixed(0)}% annualised, ${(volRatio * 100 - 100).toFixed(0)}% versus its longer baseline`,
  )

  // --- Drawdown component ---
  const dd = maxDrawdown(closes.slice(-60))
  let drawdown = 0
  if (dd < -14) drawdown -= 2
  else if (dd < -7) drawdown -= 1
  evidence.push(`Largest peak-to-trough decline in 60 sessions: ${dd.toFixed(1)}%`)

  // --- Breadth component ---
  let breadthScore = 0
  if (breadth >= 0.65) breadthScore += 2
  else if (breadth >= 0.53) breadthScore += 1
  else if (breadth < 0.35) breadthScore -= 2
  else if (breadth < 0.45) breadthScore -= 1
  evidence.push(`${(breadth * 100).toFixed(0)}% of constituents are advancing`)

  const raw =
    trend * 2.4 + momentum * 2.2 + vol * 1.6 + drawdown * 1.6 + breadthScore * 1.8
  // raw range ≈ −18 … +18
  const score = clamp(Math.round((raw / 16) * 100), -100, 100)

  let regime: MarketRegime
  if (score >= 52) regime = 'constructive'
  else if (score >= 12) regime = 'neutral'
  else if (score >= -28) regime = 'defensive'
  else if (score >= -64) regime = 'stressed'
  else regime = 'risk-off'

  const components = {
    trend,
    momentum,
    volatility: vol,
    drawdown,
    breadth: breadthScore,
  }

  // Agreement: how many components lean the same way as the verdict.
  const directionSign = Math.sign(score)
  const values = Object.values(components)
  const agreeing = values.filter((v) => Math.sign(v) === directionSign || v === 0).length
  const agreement = agreeing / values.length
  const magnitude = Math.abs(score) / 100
  const confidence = Math.round(clamp(44 + agreement * 26 + magnitude * 22, 40, 92))

  return { regime, confidence, score, evidence, components }
}

export function nextRegimeWorse(a: MarketRegime, b: MarketRegime): MarketRegime {
  const ia = REGIME_ORDER.indexOf(a)
  const ib = REGIME_ORDER.indexOf(b)
  return REGIME_ORDER[Math.max(ia, ib)]
}
