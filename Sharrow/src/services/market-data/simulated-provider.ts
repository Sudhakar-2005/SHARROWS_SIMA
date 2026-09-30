import type { AssetMeta, MarketEvent, NewsItem, Quote, Series, Timeframe } from '@/engine/types'
import type { MarketDataProvider } from './provider'
import { ASSETS, buildEvents, buildNews } from '@/data/universe'
import { TIMEFRAME_DAYS, getDailySeries, getIntraday } from './simulated'
import { computeQuote, withLiveTail } from './quotes'

/**
 * SHARROW Simulated NSE Feed.
 * Deterministic, clearly labelled sample market data — never presented as real.
 */
export const simulatedProvider: MarketDataProvider = {
  id: 'simulated-nse',
  displayName: 'SHARROW Simulated NSE Feed',
  provenance: 'simulated',

  getUniverse(): AssetMeta[] {
    return ASSETS
  },

  async getSeries(symbol: string, timeframe: Timeframe): Promise<Series> {
    let candles
    if (timeframe === '1D') {
      candles = withLiveTail(symbol, getIntraday(symbol))
    } else {
      const all = getDailySeries(symbol)
      const size = Math.min(TIMEFRAME_DAYS[timeframe], all.length)
      candles = withLiveTail(symbol, all.slice(-size))
    }
    return { symbol, timeframe, candles, provenance: 'simulated' }
  },

  async getQuote(symbol: string): Promise<Quote> {
    return computeQuote(symbol)
  },

  getNews(): NewsItem[] {
    return buildNews(Date.now())
  },

  getEvents(): MarketEvent[] {
    return buildEvents(Date.now())
  },
}
