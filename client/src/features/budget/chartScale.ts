// Turns days and person-days into positions on the chart. Plain numbers, so it can be tested without a browser.
const MS_PER_DAY = 86_400_000

export function dayNumber(isoDate: string) {
  return Date.parse(`${isoDate}T00:00:00Z`) / MS_PER_DAY
}

export function scaleLinear(domainStart: number, domainEnd: number, rangeStart: number, rangeEnd: number) {
  const domainLength = domainEnd - domainStart || 1
  return (value: number) => rangeStart + ((value - domainStart) / domainLength) * (rangeEnd - rangeStart)
}

// The value on a line at any day, so hovering between two weekly points still shows a true figure.
export function remainingOnDay(series: { date: string; remainingPersonDays: number }[], day: number) {
  const first = series[0]
  const last = series.at(-1)
  if (!first || !last) return null
  if (day <= dayNumber(first.date)) return first.remainingPersonDays
  if (day >= dayNumber(last.date)) return last.remainingPersonDays

  const nextIndex = series.findIndex((point) => dayNumber(point.date) >= day)
  const before = series[nextIndex - 1] as { date: string; remainingPersonDays: number }
  const after = series[nextIndex] as { date: string; remainingPersonDays: number }
  const scale = scaleLinear(dayNumber(before.date), dayNumber(after.date), before.remainingPersonDays, after.remainingPersonDays)
  return Math.round(scale(day) * 10) / 10
}
