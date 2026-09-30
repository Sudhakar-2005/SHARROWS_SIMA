import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PageLayout } from '@/components/shell/PageLayout'
import {
  Button,
  EmptyState,
  ErrorState,
  ProvenanceBadge,
  SectionHeader,
  Skeleton,
  Surface,
  Tabs,
} from '@/design/primitives'
import { LineChart } from 'lucide-react'
import { StarToggle } from '@/components/domain/StarToggle'
import { ASSET_BY_SYMBOL, SECTOR_NAME } from '@/data/universe'
import { useMarketStore } from '@/store/market-store'
import { useIntelligenceStore } from '@/store/intelligence-store'
import type { Timeframe } from '@/engine/types'
import { plain, percent, signed } from '@/lib/format'
import { PriceChart } from '@/components/charts/PriceChart'
import { TIMEFRAMES, chartCandles, periodStats } from './asset/asset-data'
import { QuoteStats } from './asset/QuoteStats'
import { FundamentalsCard } from './asset/FundamentalsCard'
import { ContextCard } from './asset/ContextCard'
import { ConvictionPanel } from './asset/ConvictionPanel'
import { AssetScenarios } from './asset/AssetScenarios'
import { AssetNews } from './asset/AssetNews'
import { cn } from '@/lib/cn'

export default function AssetPage() {
  const { symbol = '' } = useParams()
  const asset = ASSET_BY_SYMBOL[symbol]
  const [timeframe, setTimeframe] = useState<Timeframe>('1D')

  const quote = useMarketStore((s) => s.quotes[symbol])
  const news = useMarketStore((s) => s.news)
  const status = useIntelligenceStore((s) => s.status)
  const error = useIntelligenceStore((s) => s.error)
  const snapshot = useIntelligenceStore((s) => s.snapshot)
  const analysis = useIntelligenceStore((s) => s.analyses[symbol])
  const predictions = useIntelligenceStore((s) => s.predictions)

  useEffect(() => {
    void useIntelligenceStore.getState().initialize()
  }, [])

  if (!asset) {
    return (
      <PageLayout eyebrow="Asset" title={symbol || 'Unknown asset'}>
        <div className="rounded-md border border-line bg-surface-1">
          <EmptyState
            size="md"
            icon={<LineChart className="size-5" aria-hidden="true" />}
            title="SHARROW is not tracking this asset"
            body="The symbol could not be matched to the monitored universe."
            action={
              <Link to="/markets">
                <Button size="sm">Browse markets</Button>
              </Link>
            }
          />
        </div>
      </PageLayout>
    )
  }

  const candles = chartCandles(symbol, timeframe)
  const stats = periodStats(candles)
  const symbolNews = news.filter((n) => n.affectedSymbols.includes(symbol))
  const symbolPredictions = predictions.filter((p) => p.symbol === symbol)

  const retry = () => {
    useIntelligenceStore.getState().reset()
    void useIntelligenceStore.getState().initialize()
  }

  const changeTone = !quote
    ? 'text-ink-3'
    : quote.changePct > 0
      ? 'text-pos'
      : quote.changePct < 0
        ? 'text-neg'
        : 'text-flow'

  const timeframeItems = TIMEFRAMES.map((tf) => ({ id: tf, label: tf }))

  return (
    <PageLayout
      eyebrow={asset.kind === 'index' ? 'Index intelligence' : 'Stock intelligence'}
      title={`${asset.symbol} · ${asset.name}`}
      subtitle={`${asset.description} · ${SECTOR_NAME[asset.sector]}`}
      provenance="simulated"
      actions={
        <div className="flex items-end justify-end gap-3">
          {quote ? (
            <div className="text-right">
              <div className="num text-2xl font-semibold tracking-[-0.01em] text-ink">
                {plain(quote.price, 2)}
              </div>
              <div className={cn('num text-xs font-medium', changeTone)}>
                {signed(quote.change, 2)} · {percent(quote.changePct, 2)}
              </div>
            </div>
          ) : (
            <Skeleton className="h-12 w-32" />
          )}
          <StarToggle symbol={symbol} className="mb-0.5" />
        </div>
      }
      rail={
        quote ? (
          <div className="space-y-4">
            <QuoteStats symbol={symbol} quote={quote} />
            {asset.kind === 'equity' && <FundamentalsCard symbol={symbol} />}
            {snapshot && <ContextCard snapshot={snapshot} sector={asset.sector} />}
          </div>
        ) : undefined
      }
    >
      <div className="space-y-4">
        <Surface level="base" radius="lg" className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">
                Price · close{stats ? ` · ${percent(stats.changePct, 2)} over period` : ''}
              </span>
              <div className="mt-0.5 flex items-center gap-3 text-2xs text-ink-3">
                <span>
                  high <span className="num">{stats ? plain(stats.high, 2) : '—'}</span>
                </span>
                <span>
                  low <span className="num">{stats ? plain(stats.low, 2) : '—'}</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ProvenanceBadge kind="simulated" />
              <Tabs
                items={timeframeItems}
                value={timeframe}
                onChange={(id) => setTimeframe(id as Timeframe)}
                groupId={`asset-${symbol}`}
                ariaLabel="Chart timeframe"
                variant="segmented"
              />
            </div>
          </div>
          <div className="mt-3">
            <PriceChart candles={candles} symbol={symbol} timeframe={timeframe} />
          </div>
        </Surface>

        {status === 'error' ? (
          <ErrorState
            title="The intelligence layer could not start"
            body={error ?? 'Price data is fine — the engine read is unavailable.'}
            onRetry={retry}
          />
        ) : status !== 'ready' ? (
          <Surface level="base" radius="lg" className="p-4" aria-busy="true">
            <SectionHeader title="Engine read" context="Signals and conviction are assembling." />
            <div className="mt-3 space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </Surface>
        ) : analysis ? (
          <ConvictionPanel analysis={analysis} />
        ) : (
          <Surface level="base" radius="lg" className="p-4">
            <EmptyState
              size="sm"
              title="Per-asset conviction covers equities"
              body="Index views stop at price, session statistics and news context. Open any constituent from Markets for the full signal breakdown."
            />
          </Surface>
        )}

        <div className="grid gap-4 xl:grid-cols-2">
          <AssetScenarios predictions={symbolPredictions} />
          <AssetNews news={symbolNews} />
        </div>
      </div>
    </PageLayout>
  )
}
