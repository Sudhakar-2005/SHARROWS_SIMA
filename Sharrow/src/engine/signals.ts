import type {
  Candle,
  MarketRegime,
  SectorId,
  Signal,
  SignalDirection,
  SourceRef,
} from './types'
import type { Fundamental } from '@/data/universe'
import { lastSma, roc, rsi, volatility, zscore, closes as toCloses } from './indicators'

/* =========================================================================
   Signal generation.
   Each family is independent; confidence combines them later. Every signal
   carries evidence and a source so the UI can show its provenance.
   ========================================================================= */

const HOUR = 3_600_000

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

function makeSource(label: string, at: number): SourceRef {
  return { label, kind: 'dataset', at }
}

function signal(partial: Omit<Signal, 'observedAt' | 'sources' | 'evidence'> & {
  evidence: Signal['evidence']
  at: number
  sourceLabel: string
  validHours?: number
}): Signal {
  const { at, sourceLabel, validHours = 24, ...rest } = partial
  return {
    ...rest,
    observedAt: at,
    sources: [makeSource(sourceLabel, at)],
    validUntil: at + validHours * HOUR,
  }
}

/* ------------------------------- Technical ------------------------------ */

export function technicalSignals(symbol: string, candles: Candle[], at: number): Signal[] {
  if (candles.length < 60) return []
  const values = toCloses(candles)
  const price = values[values.length - 1]
  const sma20 = lastSma(values, 20)
  const sma50 = lastSma(values, 50)
  const rsi14 = rsi(values, 14)
  const roc20 = roc(values, 20) ?? 0
  const vol20 = volatility(values, 20) ?? 0
  const volBaseline = volatility(values.slice(0, -20), 120) ?? vol20
  const volRatio = volBaseline > 0 ? vol20 / volBaseline : 1
  const z = zscore(values, 20) ?? 0

  const out: Signal[] = []
  const sourceLabel = 'Simulated daily price series'

  // 1. Trend structure
  if (sma20 !== null && sma50 !== null) {
    const aligned = price > sma20 && sma20 > sma50
    const broken = price < sma20 && sma20 < sma50
    const direction: SignalDirection = aligned ? 'bullish' : broken ? 'bearish' : 'neutral'
    out.push(
      signal({
        id: `${symbol}-tech-trend`,
        symbol,
        kind: 'technical',
        direction,
        strength: aligned || broken ? clamp01(Math.abs(price / (aligned ? sma20 : sma50) - 1) * 12 + 0.45) : 0.3,
        confidence: aligned || broken ? 72 : 52,
        title: aligned ? 'Moving-average structure is positive' : broken ? 'Moving-average structure is negative' : 'Moving averages are mixed',
        summary: aligned
          ? 'Price is holding above its 20-day average, which is itself above the 50-day — a structure that has historically persisted for multiple sessions.'
          : broken
            ? 'Price is below its 20-day average and that average is below the 50-day — sustained selling pressure in the recent window.'
            : 'Short and long averages are interleaved, offering no clear structural edge.',
        evidence: [
          { label: 'Price', value: price.toFixed(2) },
          { label: '20-day average', value: sma20.toFixed(2) },
          { label: '50-day average', value: sma50.toFixed(2) },
        ],
        at,
        sourceLabel,
      }),
    )
  }

  // 2. Momentum
  if (rsi14 !== null) {
    const direction: SignalDirection = rsi14 >= 62 ? 'bearish' : rsi14 <= 38 ? 'bullish' : roc20 > 0 ? 'bullish' : 'bearish'
    out.push(
      signal({
        id: `${symbol}-tech-momentum`,
        symbol,
        kind: 'technical',
        direction,
        strength: clamp01(Math.abs(rsi14 - 50) / 35),
        confidence: 66,
        title: rsi14 >= 68 ? 'Momentum is extended' : rsi14 <= 32 ? 'Momentum is washed out' : 'Momentum is moderate',
        summary:
          rsi14 >= 68
            ? `RSI at ${rsi14.toFixed(0)} sits in the extended zone where forward returns have historically compressed.`
            : rsi14 <= 32
              ? `RSI at ${rsi14.toFixed(0)} is near oversold territory, a zone from which rebounds have historically been more frequent.`
              : `RSI at ${rsi14.toFixed(0)} with a ${roc20 >= 0 ? 'positive' : 'negative'} 20-session change of ${roc20.toFixed(1)}%.`,
        evidence: [
          { label: 'RSI (14)', value: rsi14.toFixed(1) },
          { label: '20-session change', value: `${roc20 >= 0 ? '+' : ''}${roc20.toFixed(1)}%` },
        ],
        at,
        sourceLabel,
      }),
    )
  }

  // 3. Volatility state
  out.push(
    signal({
      id: `${symbol}-tech-volatility`,
      symbol,
      kind: 'technical',
      direction: volRatio > 1.5 ? 'bearish' : volRatio < 0.8 ? 'bullish' : 'neutral',
      strength: clamp01(Math.abs(volRatio - 1)),
      confidence: 58,
      title: volRatio > 1.5 ? 'Volatility is expanding' : volRatio < 0.8 ? 'Volatility is compressed' : 'Volatility is normal',
      summary:
        volRatio > 1.5
          ? `Annualised volatility of ${(vol20 * 100).toFixed(0)}% is ${((volRatio - 1) * 100).toFixed(0)}% above its longer baseline — larger moves are more likely in both directions.`
          : volRatio < 0.8
            ? `Volatility is running below baseline, a compression that often precedes an expansionary move.`
            : `Volatility of ${(vol20 * 100).toFixed(0)}% annualised is close to its recent baseline.`,
      evidence: [
        { label: '20-day volatility', value: `${(vol20 * 100).toFixed(1)}%` },
        { label: 'Versus baseline', value: `${((volRatio - 1) * 100).toFixed(0)}%` },
      ],
      at,
      sourceLabel,
    }),
  )

  // 4. Extension vs the 20-day mean
  if (Math.abs(z) >= 1.6) {
    out.push(
      signal({
        id: `${symbol}-tech-extension`,
        symbol,
        kind: 'technical',
        direction: z > 0 ? 'bearish' : 'bullish',
        strength: clamp01((Math.abs(z) - 1.2) / 2),
        confidence: 60,
        title: z > 0 ? 'Price is extended above its mean' : 'Price is stretched below its mean',
        summary: `The latest close sits ${Math.abs(z).toFixed(1)} standard deviations ${z > 0 ? 'above' : 'below'} its 20-session mean — conditions where reversion attempts have historically been more common.`,
        evidence: [{ label: 'Z-score (20)', value: z.toFixed(2) }],
        at,
        sourceLabel,
      }),
    )
  }

  return out
}

/* ------------------------------ Fundamental ----------------------------- */
export function fundamentalSignals(
  symbol: string,
  fundamental: Fundamental | undefined,
  sectorRange: { pe: [number, number] },
  at: number,
): Signal[] {
  if (!fundamental) return []
  const out: Signal[] = []
  const sourceLabel = 'Simulated fundamental snapshot'
  const [peLow, peHigh] = sectorRange.pe
  const peMid = (peLow + peHigh) / 2

  const valuation: SignalDirection =
    fundamental.pe <= peLow * 1.05 ? 'bullish' : fundamental.pe >= peHigh * 0.95 ? 'bearish' : 'neutral'
  out.push(
    signal({
      id: `${symbol}-fund-valuation`,
      symbol,
      kind: 'fundamental',
      direction: valuation,
      strength: valuation === 'neutral' ? 0.3 : clamp01(Math.abs(fundamental.pe - peMid) / peMid + 0.35),
      confidence: 62,
      title: valuation === 'bullish' ? 'Valuation sits at the cheap end of its sector band' : valuation === 'bearish' ? 'Valuation sits at the rich end of its sector band' : 'Valuation sits inside its sector band',
      summary: `P/E of ${fundamental.pe.toFixed(1)} versus a sector reference band of ${peLow}–${peHigh} (${valuation === 'bullish' ? 'near the cheap end' : valuation === 'bearish' ? 'near the rich end' : 'in line with the band'}).`,
      evidence: [
        { label: 'P/E', value: fundamental.pe.toFixed(1) },
        { label: 'P/B', value: fundamental.pb.toFixed(1) },
        { label: 'Sector band', value: `${peLow}–${peHigh}` },
      ],
      at,
      sourceLabel,
    }),
  )

  const quality: SignalDirection = fundamental.roe >= 18 ? 'bullish' : fundamental.roe <= 10 ? 'bearish' : 'neutral'
  out.push(
    signal({
      id: `${symbol}-fund-quality`,
      symbol,
      kind: 'fundamental',
      direction: quality,
      strength: quality === 'neutral' ? 0.3 : 0.6,
      confidence: 64,
      title: quality === 'bullish' ? 'Returns on equity are strong' : quality === 'bearish' ? 'Returns on equity are weak' : 'Returns on equity are moderate',
      summary: `ROE of ${fundamental.roe.toFixed(1)}% with earnings growth of ${fundamental.earningsGrowth.toFixed(1)}% year-on-year (simulated).`,
      evidence: [
        { label: 'ROE', value: `${fundamental.roe.toFixed(1)}%` },
        { label: 'Earnings growth', value: `${fundamental.earningsGrowth.toFixed(1)}%` },
        { label: 'Debt / equity', value: fundamental.de.toFixed(2) },
      ],
      at,
      sourceLabel,
    }),
  )

  const balance: SignalDirection =
    fundamental.de > 1.2 ? 'bearish' : fundamental.de < 0.35 ? 'bullish' : 'neutral'
  out.push(
    signal({
      id: `${symbol}-fund-balance`,
      symbol,
      kind: 'fundamental',
      direction: balance,
      strength: balance === 'neutral' ? 0.25 : 0.55,
      confidence: 58,
      title: balance === 'bearish' ? 'Leverage is elevated' : balance === 'bullish' ? 'Balance sheet carries little debt' : 'Leverage is manageable',
      summary: `Debt-to-equity of ${fundamental.de.toFixed(2)} ${balance === 'bearish' ? 'raises sensitivity to funding conditions' : balance === 'bullish' ? 'provides flexibility through cycles' : 'is within a normal range for the sector'}.`,
      evidence: [
        { label: 'Debt / equity', value: fundamental.de.toFixed(2) },
        { label: 'Dividend yield', value: `${fundamental.divYield.toFixed(2)}%` },
      ],
      at,
      sourceLabel,
    }),
  )

  return out
}

/* --------------------------------- News --------------------------------- */

export interface NewsLike {
  id: string
  headline: string
  sentiment: 'positive' | 'negative' | 'neutral'
  confidence: number
  marketImpact: 'low' | 'moderate' | 'high'
  affectedSymbols?: string[]
}

export function newsSignals(symbol: string, news: NewsLike[], at: number): Signal[] {
  const weighted = news.map((n) => {
    const s = n.sentiment === 'positive' ? 1 : n.sentiment === 'negative' ? -1 : 0
    const impact = n.marketImpact === 'high' ? 1 : n.marketImpact === 'moderate' ? 0.7 : 0.4
    return { n, score: s * (n.confidence / 100) * impact }
  })
  const net = weighted.reduce((a, b) => a + b.score, 0)
  const top = [...weighted].sort((a, b) => Math.abs(b.score) - Math.abs(a.score))[0]

  if (news.length === 0 || Math.abs(net) < 0.15) {
    return [
      signal({
        id: `${symbol}-news-balance`,
        symbol,
        kind: 'news',
        direction: 'neutral',
        strength: 0.3,
        confidence: 55,
        title: 'News flow is balanced',
        summary: 'Recent headlines affecting this asset show no dominant sentiment skew worth acting on.',
        evidence: [{ label: 'Headlines considered', value: String(news.length) }],
        at,
        sourceLabel: 'Simulated news intelligence',
        validHours: 12,
      }),
    ]
  }

  const direction: SignalDirection = net > 0 ? 'bullish' : 'bearish'
  return [
    signal({
      id: `${symbol}-news-sentiment`,
      symbol,
      kind: 'news',
      direction,
      strength: clamp01(Math.abs(net)),
      confidence: Math.round(55 + Math.min(Math.abs(net), 1) * 20),
      title: direction === 'bullish' ? 'News flow tilts positive' : 'News flow tilts negative',
      summary: top ? `“${top.n.headline}” carries the most weight in a net ${direction === 'bullish' ? 'positive' : 'negative'} headline set.` : '',
      evidence: [
        { label: 'Net sentiment', value: `${net > 0 ? '+' : ''}${net.toFixed(2)}` },
        { label: 'Headlines considered', value: String(news.length) },
      ],
      at,
      sourceLabel: 'Simulated news intelligence',
      validHours: 12,
    }),
  ]
}

/* -------------------------------- Context ------------------------------- */

const CYCLICAL: SectorId[] = ['banks', 'auto', 'metals', 'energy', 'infra']

export function contextSignals(
  symbol: string,
  sector: SectorId,
  regime: MarketRegime,
  regimeConfidence: number,
  sectorReturn: number,
  indexReturn: number,
  dayPosition: number,
  at: number,
): Signal[] {
  const out: Signal[] = []
  const isCyclical = CYCLICAL.includes(sector)

  const regimeSupports =
    regime === 'constructive' ? (isCyclical ? 1 : 0.4) : regime === 'defensive' || regime === 'stressed' ? (isCyclical ? -1 : 0.5) : regime === 'risk-off' ? (isCyclical ? -1 : 0.2) : 0

  out.push(
    signal({
      id: `${symbol}-ctx-regime`,
      symbol,
      kind: 'context',
      direction: regimeSupports > 0.3 ? 'bullish' : regimeSupports < 0 ? 'bearish' : 'neutral',
      strength: clamp01(Math.abs(regimeSupports)),
      confidence: Math.round(50 + regimeConfidence * 0.3),
      title: regimeSupports > 0.3 ? 'Regime is supportive' : regimeSupports < 0 ? 'Regime is a headwind' : 'Regime is neutral for this asset',
      summary: isCyclical
        ? `A ${regime} regime amplifies cyclical exposure — cyclical leadership behaves differently in this state.`
        : `A ${regime} regime is tolerated by defensive exposure — defensives have historically held up better in this state.`,
      evidence: [
        { label: 'Regime', value: regime },
        { label: 'Regime confidence', value: `${regimeConfidence}%` },
        { label: 'Profile', value: isCyclical ? 'Cyclical' : 'Structural / defensive' },
      ],
      at,
      sourceLabel: 'SHARROW regime classifier',
    }),
  )

  const rs = sectorReturn - indexReturn
  out.push(
    signal({
      id: `${symbol}-ctx-relstrength`,
      symbol,
      kind: 'context',
      direction: rs > 0.6 ? 'bullish' : rs < -0.6 ? 'bearish' : 'neutral',
      strength: clamp01(Math.abs(rs) / 3),
      confidence: 60,
      title: rs > 0.6 ? 'Sector is outperforming' : rs < -0.6 ? 'Sector is lagging' : 'Sector is tracking the market',
      summary: `Sector return of ${sectorReturn.toFixed(1)}% against the benchmark’s ${indexReturn.toFixed(1)}% — relative strength of ${rs >= 0 ? '+' : ''}${rs.toFixed(1)} points.`,
      evidence: [
        { label: 'Sector', value: `${sectorReturn.toFixed(2)}%` },
        { label: 'Benchmark', value: `${indexReturn.toFixed(2)}%` },
        { label: 'Relative', value: `${rs >= 0 ? '+' : ''}${rs.toFixed(2)}` },
      ],
      at,
      sourceLabel: 'Simulated sector snapshot',
    }),
  )

  out.push(
    signal({
      id: `${symbol}-ctx-dayposition`,
      symbol,
      kind: 'context',
      direction: dayPosition > 0.7 ? 'bullish' : dayPosition < 0.3 ? 'bearish' : 'neutral',
      strength: clamp01(Math.abs(dayPosition - 0.5) * 1.6),
      confidence: 48,
      title: dayPosition > 0.7 ? 'Closing near session highs' : dayPosition < 0.3 ? 'Trading near session lows' : 'Mid-range session',
      summary: `Price is sitting at ${(dayPosition * 100).toFixed(0)}% of the day’s range — a read on intraday commitment.`,
      evidence: [{ label: 'Position in range', value: `${(dayPosition * 100).toFixed(0)}%` }],
      at,
      sourceLabel: 'Simulated intraday session',
      validHours: 8,
    }),
  )
  return out
}
