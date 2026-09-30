import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Eye, Lightbulb, MessageSquareText } from 'lucide-react'
import { BrandMark } from '@/components/shell/Header'
import { MotionPicker } from '@/components/domain/MotionPicker'
import { SettingRow } from '@/pages/settings/SettingRow'
import { Badge, Button, ProvenanceBadge, Switch, Toaster } from '@/design/primitives'
import { toast } from '@/store/toast-store'
import { useUIStore } from '@/store/ui-store'
import { useWatchlistStore } from '@/store/watchlist-store'
import { STEP_LABELS, STARTER_SYMBOLS, starterName } from './onboarding/onboarding-data'

/**
 * Onboarding lives outside the app shell — a calm, full-screen walkthrough.
 * Three steps, each writing to real state: experience prefs, then the watchlist.
 */

const PILLARS = [
  {
    icon: Eye,
    title: 'Observe',
    line: 'Quotes, breadth and regime from a labeled simulated feed.',
  },
  {
    icon: Lightbulb,
    title: 'Understand',
    line: 'Signals, conviction and scenarios — scored, never stated as fact.',
  },
  {
    icon: MessageSquareText,
    title: 'Explain',
    line: 'Narratives with why, confidence, evidence and what changed.',
  },
] as const

function StepDots({ step }: { step: number }) {
  return (
    <div className="flex gap-1.5" aria-hidden="true">
      {STEP_LABELS.map((_, i) => (
        <span
          key={i}
          className={`h-1 w-8 rounded-full transition-colors ${
            i < step ? 'bg-accent' : 'bg-surface-3'
          }`}
        />
      ))}
    </div>
  )
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  // Deep link: /onboarding#step=2 opens a specific step (also used by checks).
  const [step, setStep] = useState(() => {
    const m = /step=(\d)/.exec(window.location.hash)
    const n = m ? Number(m[1]) : 1
    return n >= 1 && n <= 3 ? n : 1
  })

  const reducedMotion = useUIStore((s) => s.reducedMotion)
  const setReducedMotion = useUIStore((s) => s.setReducedMotion)
  const railHidden = useUIStore((s) => s.railHidden)
  const setRailHidden = useUIStore((s) => s.setRailHidden)
  const setOnboarded = useUIStore((s) => s.setOnboarded)

  const watched = useWatchlistStore((s) => s.symbols)
  const toggleSymbol = useWatchlistStore((s) => s.toggle)

  const starCount = STARTER_SYMBOLS.filter((s) => watched.includes(s)).length

  const finish = (skipped: boolean) => {
    setOnboarded(true)
    if (skipped) {
      toast({
        tone: 'info',
        title: 'Setup skipped',
        body: 'Replay it any time from Settings or the command palette.',
        duration: 4000,
      })
    } else {
      toast({
        tone: 'success',
        title: 'Setup complete',
        body: 'SHARROW is ready — every value labeled, every claim explained.',
        duration: 4000,
      })
    }
    navigate('/')
  }

  const next = () => (step < 3 ? setStep(step + 1) : finish(false))

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 py-12">
      <div className="w-full max-w-xl">
        <div className="mb-8 flex items-center gap-3">
          <BrandMark size={28} />
          <span className="text-lg font-semibold tracking-[0.06em] text-ink">SHARROW</span>
          <ProvenanceBadge kind="simulated" />
        </div>

        <div className="rounded-lg border border-line bg-surface-1 p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-2xs uppercase tracking-[0.14em] text-ink-3">
              Step {step} of 3 · {STEP_LABELS[step - 1]}
            </span>
            <StepDots step={step} />
          </div>

          <div className="mt-6 min-h-80" aria-live="polite">
            {step === 1 && (
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.01em] text-ink">
                  Observe. Understand. Explain.
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-3">
                  SHARROW watches a simulated market feed in real time, reads regime, conviction
                  and risk, then explains what changed and why — every claim labeled where it
                  appears.
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {PILLARS.map((p) => (
                    <div key={p.title} className="rounded-md border border-line bg-surface-2 p-4">
                      <p.icon className="size-4 text-accent" aria-hidden="true" />
                      <p className="mt-2 text-sm font-medium text-ink">{p.title}</p>
                      <p className="mt-1 text-2xs leading-relaxed text-ink-3">{p.line}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-start gap-3 rounded-md border border-line bg-surface-2 p-4">
                  <ProvenanceBadge kind="simulated" bare />
                  <p className="text-xs leading-relaxed text-ink-3">
                    Every number carries its provenance — simulated, derived or backtest. Context
                    to weigh, never an instruction to trade.
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.01em] text-ink">
                  Set the experience
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-3">
                  Two switches that shape how SHARROW feels — both stay available in Settings
                  whenever you want to change them.
                </p>

                <div className="mt-5 divide-y divide-line">
                  <SettingRow
                    label="Motion"
                    description="Reduced keeps fades but removes slides — or follow your system preference."
                    control={<MotionPicker value={reducedMotion} onChange={setReducedMotion} />}
                  />
                  <Switch
                    checked={railHidden}
                    onCheckedChange={setRailHidden}
                    label="Hide intelligence rail"
                    description="Collapse the contextual right column on every page. Settings restores it."
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.01em] text-ink">
                  Pick your starting watchlist
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-3">
                  Star the names you care about — this syncs with the Watchlist screen instantly
                  and you can tune it any time.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {STARTER_SYMBOLS.map((s) => {
                    const on = watched.includes(s)
                    return (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleSymbol(s)}
                        className={`flex items-center gap-2 rounded-sm border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                          on
                            ? 'border-accent/50 bg-accent-soft'
                            : 'border-line bg-surface-2 hover:border-line-strong'
                        }`}
                      >
                        {on && <Check className="size-3.5 text-accent" aria-hidden="true" />}
                        <span className="num text-xs font-medium text-ink">{s}</span>
                        <span className="text-2xs text-ink-3">{starterName(s)}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-2xs text-ink-3">
                    <span className="num text-ink-2">{starCount}</span> of{' '}
                    {STARTER_SYMBOLS.length} starred — defaults are already included.
                  </span>
                  <Badge variant="outline" size="sm" shape="chip">
                    watchlist
                  </Badge>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Back
            </Button>

            <button
              type="button"
              onClick={() => finish(true)}
              className="text-xs text-ink-3 underline-offset-2 transition-colors hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Skip for now
            </button>

            <Button size="sm" onClick={next}>
              {step < 3 ? 'Continue' : 'Finish setup'}
              {step < 3 ? (
                <ArrowRight className="size-3.5" aria-hidden="true" />
              ) : (
                <Check className="size-3.5" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-ink-3">
          SHARROW is a decision-support system. It produces scenarios, signals and confidence —
          never guaranteed outcomes.
        </p>
      </div>
      <Toaster />
    </div>
  )
}
