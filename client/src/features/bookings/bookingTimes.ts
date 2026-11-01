// A booking stores start, end and worked hours. People think in breaks, so the form shows the difference.
function minutesOfDay(time: string) {
  const [hours = 0, minutes = 0] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function spanInMinutes(startTime: string, endTime: string) {
  return minutesOfDay(endTime) - minutesOfDay(startTime)
}

export function breakMinutesOf({ startTime, endTime, hours }: { startTime: string; endTime: string; hours: number }) {
  return Math.max(Math.round(spanInMinutes(startTime, endTime) - hours * 60), 0)
}

// Two decimals, like the database. Zero or less means the times do not work, which the server explains.
export function workedHours(startTime: string, endTime: string, breakMinutes: number) {
  return Math.round(((spanInMinutes(startTime, endTime) - breakMinutes) / 60) * 100) / 100
}
