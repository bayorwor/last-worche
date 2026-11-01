// Reads one sentence such as "gestern 9 bis 5 am Portal, 1 h Mittag" with plain rules, in German and English.
// It needs no AI service, so one-sentence booking also works with AI_MOCK and when the AI service is down.
import { addDays, minutesOfDay } from "./booking.ts";

export type ParsedSentence = {
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  description: string;
};

const DEFAULT_START_TIME = "09:00";
const WEEKDAYS: [RegExp, number][] = [
  [/\b(sonntag|sunday)\b/, 0],
  [/\b(montag|monday)\b/, 1],
  [/\b(dienstag|tuesday)\b/, 2],
  [/\b(mittwoch|wednesday)\b/, 3],
  [/\b(donnerstag|thursday)\b/, 4],
  [/\b(freitag|friday)\b/, 5],
  [/\b(samstag|saturday)\b/, 6],
];

const BREAK_WORDS = "mittag\\w*|pause\\w*|lunch|break";
const AMOUNT = "(\\d+(?:[.,]\\d+)?)\\s*(h|std\\.?|stunden?|hours?|min\\.?|minuten?|minutes?)";

function twoDigits(value: number) {
  return String(value).padStart(2, "0");
}

function toTime(totalMinutes: number) {
  return `${twoDigits(Math.floor(totalMinutes / 60))}:${twoDigits(totalMinutes % 60)}`;
}

function amountInMinutes(amount: string, unit: string) {
  const value = Number(amount.replace(",", "."));
  return unit.startsWith("m") ? value : value * 60;
}

function readDate(text: string, today: string) {
  const explicit = text.match(/\b(\d{1,2})\.(\d{1,2})\.(\d{4}|\d{2})?(?!\d)/);
  if (explicit) {
    const year = explicit[3] ? explicit[3].padStart(4, "20") : today.slice(0, 4);
    return `${year}-${twoDigits(Number(explicit[2]))}-${twoDigits(Number(explicit[1]))}`;
  }
  if (/\b(vorgestern|day before yesterday)\b/.test(text)) return addDays(today, -2);
  if (/\b(gestern|yesterday)\b/.test(text)) return addDays(today, -1);
  if (/\b(heute|today)\b/.test(text)) return today;

  const weekday = WEEKDAYS.find(([pattern]) => pattern.test(text))?.[1];
  if (weekday === undefined) return today;

  // The most recent such day, because people book work they have already done.
  const todayNumber = new Date(`${today}T00:00:00Z`).getUTCDay();
  return addDays(today, -((todayNumber - weekday + 7) % 7));
}

function readBreakMinutes(text: string) {
  const amountFirst = text.match(new RegExp(`${AMOUNT}\\s*(?:${BREAK_WORDS})`));
  const wordFirst = text.match(new RegExp(`(?:${BREAK_WORDS})\\s*(?:von\\s+|of\\s+)?${AMOUNT}`));
  const match = amountFirst ?? wordFirst;
  return match ? amountInMinutes(match[1] as string, match[2] as string) : 0;
}

// "9 bis 5" means 09:00 to 17:00: an end that is not after the start is read as an afternoon time.
function readTimeRange(text: string) {
  const match = text.match(/(\d{1,2})(?:[:.](\d{2}))?\s*(?:uhr\s*)?(?:bis|to|until|-|–)\s*(\d{1,2})(?:[:.](\d{2}))?/);
  if (!match) return null;

  const start = Number(match[1]) * 60 + Number(match[2] ?? 0);
  let end = Number(match[3]) * 60 + Number(match[4] ?? 0);
  if (end <= start && end <= 12 * 60) end += 12 * 60;

  return start < 24 * 60 && end < 24 * 60 && end > start ? { start, end } : null;
}

function readDurationOnly(text: string) {
  const withoutBreak = text.replace(new RegExp(`${AMOUNT}\\s*(?:${BREAK_WORDS})`, "g"), " ");
  const match = withoutBreak.match(new RegExp(AMOUNT));
  return match ? amountInMinutes(match[1] as string, match[2] as string) : null;
}

export function parseBookingSentence(sentence: string, today: string): ParsedSentence | null {
  const text = sentence.toLowerCase();
  const date = readDate(text, today);
  // The date comes first and is then removed, so 27.10. cannot be read as a time.
  const withoutDate = text.replace(/\b\d{1,2}\.\d{1,2}\.(\d{4}|\d{2})?(?!\d)/, " ");

  const range = readTimeRange(withoutDate);
  if (range) {
    const workedMinutes = range.end - range.start - readBreakMinutes(withoutDate);
    if (workedMinutes <= 0) return null;
    return {
      date,
      startTime: toTime(range.start),
      endTime: toTime(range.end),
      hours: Math.round((workedMinutes / 60) * 100) / 100,
      description: sentence.trim(),
    };
  }

  const duration = readDurationOnly(withoutDate);
  const start = minutesOfDay(DEFAULT_START_TIME);
  if (!duration || duration <= 0 || start + duration >= 24 * 60) return null;
  return {
    date,
    startTime: DEFAULT_START_TIME,
    endTime: toTime(start + Math.round(duration)),
    hours: Math.round((duration / 60) * 100) / 100,
    description: sentence.trim(),
  };
}

// The order the sentence clearly names. Two matches or none means the person must choose (story #4).
export function matchOrderInSentence(sentence: string, orders: { id: string; title: string }[]): string | null {
  const text = sentence.toLowerCase();
  const matches = orders.filter(
    ({ id, title }) => text.includes(id) || title.toLowerCase().split(/\W+/).some((word) => word.length >= 5 && text.includes(word)),
  );
  return matches.length === 1 ? (matches[0] as { id: string }).id : null;
}
