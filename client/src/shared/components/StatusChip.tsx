import type { ReactNode } from 'react'

type StatusChipTone = 'neutral' | 'signal' | 'success'

type StatusChipProps = {
  tone: StatusChipTone
  children: ReactNode
}

const TONE_CLASSES: Record<StatusChipTone, string> = {
  neutral: 'border-muted bg-neutral-soft text-muted',
  signal: 'border-signal-strong bg-signal-soft text-signal-strong',
  success: 'border-success bg-success-soft text-success',
}

export function StatusChip({ tone, children }: StatusChipProps) {
  return (
    <span
      className={`inline-block border px-2 py-0.5 text-xs font-bold tracking-wide whitespace-nowrap uppercase ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  )
}
