import type { MarketRegime, PredictionOutcome, SignalDirection } from '@/engine/types'

/** Shared display mappings for the overview modules. */

export const DIRECTION_VARIANT: Record<SignalDirection, 'pos' | 'neg' | 'flow'> = {
  bullish: 'pos',
  bearish: 'neg',
  neutral: 'flow',
}

export const DIRECTION_LABEL: Record<SignalDirection, string> = {
  bullish: 'Upside-leaning',
  bearish: 'Downside-leaning',
  neutral: 'Two-sided',
}

export const REGIME_VARIANT: Record<MarketRegime, 'pos' | 'neg' | 'warn' | 'flow'> = {
  constructive: 'pos',
  neutral: 'flow',
  defensive: 'flow',
  stressed: 'warn',
  'risk-off': 'neg',
}

export const REGIME_LABEL: Record<MarketRegime, string> = {
  constructive: 'CONSTRUCTIVE',
  neutral: 'NEUTRAL',
  defensive: 'DEFENSIVE',
  stressed: 'STRESSED',
  'risk-off': 'RISK-OFF',
}

export const OUTCOME_VARIANT: Record<PredictionOutcome, 'pos' | 'neg' | 'warn' | 'flow'> = {
  matched: 'pos',
  partial: 'warn',
  missed: 'neg',
  inconclusive: 'flow',
}

export const OUTCOME_LABEL: Record<PredictionOutcome, string> = {
  matched: 'Matched',
  partial: 'Partial',
  missed: 'Missed',
  inconclusive: 'Inconclusive',
}

export const IMPORTANCE_VARIANT: Record<
  'informational' | 'important' | 'critical',
  'flow' | 'warn' | 'neg'
> = {
  informational: 'flow',
  important: 'warn',
  critical: 'neg',
}
