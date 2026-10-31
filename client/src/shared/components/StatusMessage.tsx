import type { ReactNode } from 'react'

type StatusMessageTone = 'success' | 'error'

type StatusMessageProps = {
  tone: StatusMessageTone
  className?: string
  children: ReactNode
}

const TONE_CLASSES: Record<StatusMessageTone, string> = {
  success: 'border-success bg-success-soft text-success',
  error: 'border-signal-strong bg-signal-soft text-signal-strong',
}

export function StatusMessage({ tone, className = '', children }: StatusMessageProps) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={`border px-4 py-3 text-sm font-semibold ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </p>
  )
}
