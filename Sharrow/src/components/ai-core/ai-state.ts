import type { AIState } from '@/design/tokens'

export const AI_STATE_LABEL: Record<AIState, string> = {
  idle: 'Standby',
  ready: 'Ready',
  observing: 'Observing markets',
  analyzing: 'Analyzing signals',
  thinking: 'Synthesizing',
  evaluating: 'Evaluating outcomes',
  learning: 'Learning',
  alert: 'Attention required',
}

export const AI_STATE_SHORT: Record<AIState, string> = {
  idle: 'Standby',
  ready: 'Ready',
  observing: 'Observing',
  analyzing: 'Analyzing',
  thinking: 'Thinking',
  evaluating: 'Evaluating',
  learning: 'Learning',
  alert: 'Alert',
}

export const AI_STATE_TONE: Record<AIState, string> = {
  idle: 'text-ink-3',
  ready: 'text-accent',
  observing: 'text-accent',
  analyzing: 'text-accent',
  thinking: 'text-accent-2',
  evaluating: 'text-accent',
  learning: 'text-accent-2',
  alert: 'text-neg',
}
