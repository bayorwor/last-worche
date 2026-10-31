type ProgressBarProps = {
  label: string
  percent: number
  className?: string
}

export function ProgressBar({ label, percent, className = '' }: ProgressBarProps) {
  const boundedPercent = Math.min(Math.max(percent, 0), 100)

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(boundedPercent)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`h-4 border border-ink bg-panel ${className}`}
    >
      <div className="h-full bg-ink" style={{ width: `${boundedPercent}%` }} />
    </div>
  )
}
