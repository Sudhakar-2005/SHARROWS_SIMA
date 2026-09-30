import { afterEach, describe, expect, it } from 'vitest'
import { selectActive, selectEvaluated, useIntelligenceStore } from './intelligence-store'
import { useMarketStore } from './market-store'
import { useAIStore } from './ai-store'
import { stopTickEngine } from '@/services/market-data'

afterEach(() => {
  stopTickEngine()
  useIntelligenceStore.getState().reset()
})

describe('intelligence store', () => {
  it('initializes the full cycle from the market feed', async () => {
    await useIntelligenceStore.getState().initialize()
    const state = useIntelligenceStore.getState()

    expect(state.status).toBe('ready')
    expect(state.error).toBeNull()
    expect(state.snapshot).not.toBeNull()
    expect(state.snapshot!.regime.confidence).toBeGreaterThanOrEqual(40)
    expect(Object.keys(state.analyses).length).toBeGreaterThan(30)

    expect(state.insights.length).toBeGreaterThanOrEqual(3)
    for (const i of state.insights) {
      expect(i.sources.length).toBeGreaterThan(0)
      expect(i.confidence).toBeGreaterThan(0)
    }

    expect(state.predictions.length).toBeGreaterThanOrEqual(4)
    expect(selectEvaluated(state.predictions).length).toBeGreaterThanOrEqual(4)
    expect(selectActive(state.predictions).length).toBeGreaterThanOrEqual(1)

    expect(state.learnings.length).toBeGreaterThanOrEqual(1)
    expect(state.versions.length).toBeGreaterThanOrEqual(1)
    expect(state.activity.length).toBeGreaterThanOrEqual(5)

    // Activity also streams into the AI feed.
    expect(useAIStore.getState().activity.length).toBeGreaterThanOrEqual(5)
  })

  it('advances on a subsequent cycle without losing state', async () => {
    await useIntelligenceStore.getState().initialize()
    const before = useIntelligenceStore.getState()

    useIntelligenceStore.getState().runCycle()
    const after = useIntelligenceStore.getState()

    expect(after.cycleCount).toBe(before.cycleCount + 1)
    expect(after.status).toBe('ready')
    expect(after.snapshot).not.toBeNull()
    expect(after.predictions.length).toBeGreaterThanOrEqual(1)
    expect(Object.keys(after.analyses).length).toBe(Object.keys(before.analyses).length)
  })

  it('is idempotent on repeated initialize calls', async () => {
    await useIntelligenceStore.getState().initialize()
    await useIntelligenceStore.getState().initialize()
    expect(useIntelligenceStore.getState().status).toBe('ready')
    expect(useIntelligenceStore.getState().cycleCount).toBe(1)
  })

  it('exposes per-asset analysis', async () => {
    await useIntelligenceStore.getState().initialize()
    const analysis = useIntelligenceStore.getState().getAnalysis('TCS')
    expect(analysis).toBeDefined()
    expect(analysis!.signals.length).toBeGreaterThan(0)
    expect(useMarketStore.getState().status).toBe('ready')
  })
})
