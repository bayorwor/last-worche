type MetricTileProps = {
  label: string
  value: string
}

export function MetricTile({ label, value }: MetricTileProps) {
  return (
    <div className="bg-panel px-5 py-4.5">
      <p className="text-xs font-semibold tracking-widest text-muted uppercase">{label}</p>
      <p className="text-3xl font-extrabold tabular-nums">{value}</p>
    </div>
  )
}
