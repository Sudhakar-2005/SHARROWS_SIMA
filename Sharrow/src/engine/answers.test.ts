import { describe, expect, it } from 'vitest'
import {
  ANSWER_SUFFIX,
  answerQuestion,
  detectTopic,
  findSymbol,
  looksLikeQuestion,
  type AnswerContext,
} from './answers'
import { isSafeLanguage } from './narrative'
import type { MarketSnapshot } from './cycle'
import type { Conviction, Insight, LearningEvent, NewsItem, Prediction, Quote, Signal } from './types'

/* ------------------------------- Fixtures -------------------------------- */

const snapshot: MarketSnapshot = {
  at: 0,
  regime: {
    regime: 'neutral',
    confidence: 64,
    score: 18,
    evidence: [],
    components: { trend: 1, momentum: 0, volatility: -1, drawdown: 0, breadth: 1 },
  },
  breadth: 0.56,
  advancing: 28,
  declining: 18,
  unchanged: 4,
  indexSymbol: 'NIFTY50',
  indexChangePct: 0.42,
  volatilityPct: 13.2,
  volatilityBaselinePct: 12.4,
  sectorPerformance: [
    {
      sector: 'it',
      name: 'Information Technology',
      changePct: 1.2,
      relativePct: 0.78,
      leader: { symbol: 'TCS', changePct: 2.1 },
    },
  ],
  provenance: 'derived',
}

function quote(symbol: string, price: number, changePct: number): Quote {
  return {
    symbol,
    price,
    prevClose: price / (1 + changePct / 100),
    change: price - price / (1 + changePct / 100),
    changePct,
    dayHigh: price * 1.01,
    dayLow: price * 0.99,
    volume: 1_000_000,
    updatedAt: 0,
    provenance: 'simulated',
  }
}

const signal: Signal = {
  id: 'sig-1',
  symbol: 'TCS',
  kind: 'technical',
  direction: 'bullish',
  strength: 0.7,
  confidence: 60,
  title: 'TCS reclaims its 50-day average',
  summary: 'Price moved back above the medium-term mean.',
  evidence: [{ label: 'Position', value: '+1.8% above average' }],
  sources: [{ label: 'Engine', kind: 'engine', at: 0 }],
  observedAt: 0,
}

const conviction: Conviction = {
  score: 62,
  direction: 'bullish',
  regime: 'neutral',
  contributing: [signal],
  counterSignals: [],
  computedAt: 0,
  provenance: 'derived',
}

const evaluatedPrediction: Prediction = {
  id: 'pred-1',
  symbol: 'TCS',
  title: 'TCS holds its range',
  scenario: 'If the current pattern persists, price would be consistent with range-holding.',
  direction: 'neutral',
  horizon: '5 sessions',
  horizonDays: 5,
  confidence: 55,
  status: 'resolved',
  createdAt: 0,
  createdBy: 'engine',
  supportingSignals: [],
  risks: [],
  invalidation: [],
  evaluation: {
    at: 1,
    verdict: 'matched',
    headline: 'Range held',
    delta: '0.4% versus expected',
    factors: ['Low volatility'],
    learningSummary: 'Range persisted through the horizon.',
    engineVersion: 'v0.1.0',
  },
}

const livePrediction: Prediction = {
  id: 'pred-2',
  symbol: 'INFY',
  title: 'INFY drifts higher',
  scenario: 'If the current pattern persists, drift would be consistent with the trend.',
  direction: 'bullish',
  horizon: '10 sessions',
  horizonDays: 10,
  confidence: 64,
  status: 'active',
  createdAt: 0,
  createdBy: 'engine',
  supportingSignals: [],
  risks: [],
  invalidation: [],
}

const learning: LearningEvent = {
  id: 'lrn-1',
  kind: 'calibration',
  title: 'High-conviction reads after gap-down sessions',
  detail: 'Calibration drift detected in the high bucket.',
  status: 'deployed',
  detectedAt: 0,
  sampleSize: 42,
  evidence: ['42 evaluated records'],
  provenance: 'derived',
}

const insight: Insight = {
  id: 'ins-1',
  headline: 'Breadth narrows as leadership concentrates',
  kind: 'regime',
  why: 'Advancing share fell while the index held its level.',
  importance: 'critical',
  confidence: 70,
  changed: 'Breadth component dropped a band.',
  createdAt: 0,
  sources: [],
  provenance: 'derived',
}

const newsItem: NewsItem = {
  id: 'news-1',
  headline: 'IT majors sign large deal wins',
  source: 'Simulated wire',
  publishedAt: 0,
  summary: 'Order pipeline improves across tier-one providers.',
  sentiment: 'positive',
  confidence: 72,
  affectedSymbols: ['TCS', 'INFY'],
  affectedSectors: ['it'],
  marketImpact: 'high',
  portfolioRelevance: 'material',
  provenance: 'simulated',
}

const fullContext: AnswerContext = {
  snapshot,
  quotes: { NIFTY50: quote('NIFTY50', 24850, 0.42), TCS: quote('TCS', 4120, 1.8) },
  analyses: {
    TCS: { symbol: 'TCS', sector: 'it', signals: [signal], conviction, computedAt: 0 },
  },
  news: [newsItem],
  predictions: [evaluatedPrediction, livePrediction],
  learnings: [learning],
  insights: [insight],
  portfolio: {
    value: 1_842_000,
    dayPnl: 12_400,
    dayChangePct: 0.68,
    pnl: 96_500,
    pnlPct: 5.54,
    count: 11,
    topGainers: [{ symbol: 'TCS', dayPnl: 8_200, changePct: 1.8 }],
    topLosers: [{ symbol: 'ITC', dayPnl: -1_400, changePct: -0.6 }],
  },
  topMover: { symbol: 'TCS', changePct: 2.1 },
}

const emptyContext: AnswerContext = {
  snapshot: null,
  quotes: {},
  analyses: {},
  news: [],
  predictions: [],
  learnings: [],
  insights: [],
  portfolio: null,
  topMover: null,
}

const TOPIC_QUESTIONS: [string, string][] = [
  ['What is the market regime right now', 'regime'],
  ['What changed since yesterday', 'market'],
  ['Explain today\u2019s portfolio movement', 'portfolio'],
  ['How accurate is SHARROW right now', 'accuracy'],
  ['What has SHARROW learned recently', 'learning'],
  ['Show my failed predictions', 'predictions'],
  ['What news matters to my portfolio', 'news'],
  ['Show important alerts', 'alerts'],
  ['Tell me about TCS', 'asset'],
  ['hello there', 'general'],
]

/* --------------------------------- Tests --------------------------------- */

describe('detectTopic', () => {
  it.each(TOPIC_QUESTIONS)('reads %j as %s', (question, topic) => {
    // 'asset' only appears after the symbol override inside answerQuestion;
    // detectTopic itself reports the pre-override bucket.
    expect(detectTopic(question)).toBe(topic === 'asset' ? 'general' : topic)
  })

  it('prefers accuracy over market phrasing', () => {
    expect(detectTopic('How accurate is the NIFTY forecast')).toBe('accuracy')
  })
})

describe('findSymbol', () => {
  it.each([
    ['Why did NIFTY move today', 'NIFTY50'],
    ['How is Infosys doing', 'INFY'],
    ['Tell me about Sun Pharma', 'SUNPHARMA'],
    ['What about Bank Nifty', 'BANKNIFTY'],
    ['is m&m holding up', 'M&M'],
    ['How is NIFTY IT performing', 'NIFTYIT'],
    ['Where does Tata Motors stand', 'TATAMOTORS'],
    ['How is SBI doing', 'SBIN'],
    ['why did HDFC fall', 'HDFCBANK'],
  ])('resolves %j to %s', (question, symbol) => {
    expect(findSymbol(question)).toBe(symbol)
  })

  it('returns null when nothing in the universe is named', () => {
    expect(findSymbol('what happened in the world today')).toBeNull()
  })
})

describe('looksLikeQuestion', () => {
  it('accepts question openers and trailing question marks', () => {
    expect(looksLikeQuestion('Why did NIFTY move today')).toBe(true)
    expect(looksLikeQuestion('what is the regime?')).toBe(true)
    expect(looksLikeQuestion('explain the accuracy')).toBe(true)
  })

  it('rejects symbols, plain words and empty input', () => {
    expect(looksLikeQuestion('TCS')).toBe(false)
    expect(looksLikeQuestion('portfolio')).toBe(false)
    expect(looksLikeQuestion('')).toBe(false)
    expect(looksLikeQuestion('   ')).toBe(false)
  })
})

describe('answerQuestion routes', () => {
  it('sends a why-question about the index to the intelligence desk', () => {
    const a = answerQuestion('Why did NIFTY move today', fullContext)
    expect(a.topic).toBe('market')
    expect(a.symbol).toBe('NIFTY50')
    expect(a.route.startsWith('/intelligence?q=')).toBe(true)
    expect(a.route).toContain('Why%20did%20NIFTY%20move%20today')
  })

  it.each(TOPIC_QUESTIONS)('routes %j', (question, topic) => {
    const a = answerQuestion(question, fullContext)
    expect(a.topic).toBe(topic)
    switch (topic) {
      case 'regime':
        expect(a.route).toBe('/markets?focus=regime')
        break
      case 'market':
        expect(a.route).toBe('/markets?focus=changes')
        break
      case 'portfolio':
        expect(a.route).toBe('/portfolio?explain=today')
        break
      case 'accuracy':
        expect(a.route).toBe('/evolution?focus=accuracy')
        break
      case 'learning':
        expect(a.route).toBe('/evolution?focus=learnings')
        break
      case 'predictions':
        expect(a.route).toBe('/predictions?status=missed')
        break
      case 'news':
        expect(a.route).toBe('/research?focus=portfolio')
        break
      case 'alerts':
        expect(a.route).toBe('/alerts?priority=important')
        break
      case 'asset':
        expect(a.route).toBe('/asset/TCS')
        break
      case 'general':
        expect(a.route).toBe('/intelligence?q=hello%20there')
        break
    }
  })

  it('routes plain live predictions to the predictions desk without a filter', () => {
    expect(answerQuestion('Show my predictions', fullContext).route).toBe('/predictions')
  })

  it('sends equity questions to the asset page whatever the phrasing', () => {
    expect(answerQuestion('Why did RELIANCE move today', fullContext).route).toBe('/asset/RELIANCE')
    expect(answerQuestion('Why did RELIANCE fall today', fullContext).route).toBe('/asset/RELIANCE')
  })

  it('sends non-why index questions to the index page', () => {
    const a = answerQuestion('How is NIFTY IT performing', fullContext)
    expect(a.topic).toBe('asset')
    expect(a.route).toBe('/asset/NIFTYIT')
  })

  it('lets an explicit route override win', () => {
    const a = answerQuestion('What is the market regime', fullContext, '/markets?focus=regime&deep=1')
    expect(a.route).toBe('/markets?focus=regime&deep=1')
  })
})

describe('answerQuestion text', () => {
  it('answers every topic with safe language, the fixed suffix and 2–5 sentences', () => {
    for (const [question] of TOPIC_QUESTIONS) {
      const a = answerQuestion(question, fullContext)
      expect(isSafeLanguage(a.text)).toBe(true)
      expect(a.text.endsWith(ANSWER_SUFFIX)).toBe(true)
      const sentences = a.text.split('. ').length
      expect(sentences).toBeGreaterThanOrEqual(2)
      expect(sentences).toBeLessThanOrEqual(5)
    }
  })

  it('stays safe and complete with an empty context', () => {
    const questions = [
      'What is the market regime',
      'What changed today',
      'Explain my portfolio',
      'How accurate is SHARROW',
      'What has SHARROW learned',
      'Show my predictions',
      'What news matters',
      'Show important alerts',
      'Tell me about TCS',
      'hello there',
    ]
    for (const question of questions) {
      const a = answerQuestion(question, emptyContext)
      expect(isSafeLanguage(a.text)).toBe(true)
      expect(a.text.endsWith(ANSWER_SUFFIX)).toBe(true)
      expect(a.text.length).toBeGreaterThan(ANSWER_SUFFIX.length)
    }
  })

  it('mentions conviction for a scored asset', () => {
    const a = answerQuestion('Tell me about TCS', fullContext)
    expect(a.text).toContain('Conviction reads 62')
    expect(a.text).toContain('TCS reclaims its 50-day average')
  })

  it('reports strict matched-only accuracy', () => {
    const a = answerQuestion('How accurate is SHARROW right now', fullContext)
    expect(a.text).toContain('strict matched-only rate')
    expect(a.text).toContain('1 evaluated')
  })

  it('is deterministic for identical inputs', () => {
    const q = 'Why did NIFTY move today'
    expect(answerQuestion(q, fullContext)).toEqual(answerQuestion(q, fullContext))
  })
})
