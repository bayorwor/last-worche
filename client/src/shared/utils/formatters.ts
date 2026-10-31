const hoursFormatter = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 2 })
const personDaysFormatter = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 3 })
const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
})

// A non-breaking space keeps the number and its unit on one line.
export function formatHours(hours: number): string {
  return `${hoursFormatter.format(hours)} h`
}

export function formatPersonDays(personDays: number): string {
  return `${personDaysFormatter.format(personDays)} PT`
}

// Expects YYYY-MM-DD. UTC on both sides, so the shown day never shifts with the viewer's time zone.
export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(`${isoDate}T00:00:00Z`))
}
