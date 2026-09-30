import type { AssetMeta, MarketEvent, NewsItem, Provenance, Quote, Series, Timeframe } from '@/engine/types'

/**
 * Market data access is provider-based so a live adapter can replace the
 * simulated one without touching any UI. Provenance travels with the data.
 */
export interface MarketDataProvider {
  readonly id: string
  readonly displayName: string
  readonly provenance: Provenance
  getUniverse(): AssetMeta[]
  /** Resolves with the requested window; results are cached per provider. */
  getSeries(symbol: string, timeframe: Timeframe): Promise<Series>
  getQuote(symbol: string): Promise<Quote>
  getNews(): NewsItem[]
  getEvents(): MarketEvent[]
}

let provider: MarketDataProvider | null = null

export function registerProvider(next: MarketDataProvider) {
  provider = next
}

export function getProvider(): MarketDataProvider {
  if (!provider) throw new Error('No market data provider registered')
  return provider
}
