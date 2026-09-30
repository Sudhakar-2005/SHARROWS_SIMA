import { ASSET_BY_SYMBOL } from '@/data/universe'

/** Curated starter symbols for onboarding — quick way to shape the watchlist. */
export const STARTER_SYMBOLS = [
  'TCS',
  'INFY',
  'HDFCBANK',
  'RELIANCE',
  'MARUTI',
  'TATASTEEL',
  'SUNPHARMA',
  'LT',
] as const

export function starterName(symbol: string): string {
  return ASSET_BY_SYMBOL[symbol]?.name ?? symbol
}

export const STEP_LABELS = ['What SHARROW is', 'Tune the experience', 'Your watchlist'] as const
