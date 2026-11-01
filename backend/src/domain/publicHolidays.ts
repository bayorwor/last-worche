// German public holidays per federal state, calculated rather than stored, so every year works.
// State-wide holidays only: local ones, such as the Augsburg peace festival, are left out.
export const FEDERAL_STATES = ["BW", "BY", "BE", "BB", "HB", "HH", "HE", "MV", "NI", "NW", "RP", "SL", "SN", "ST", "SH", "TH"] as const;

export type FederalState = (typeof FEDERAL_STATES)[number];

export type PublicHoliday = {
  date: string; // YYYY-MM-DD
  nameDe: string;
  nameEn: string;
  states: readonly FederalState[] | "all";
};

function isoDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

// The Gregorian Easter calculation (Meeus/Jones/Butcher). Moving holidays count from this day.
function easterSunday(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return Date.UTC(year, month - 1, day);
}

// Repentance Day is the Wednesday before 23 November.
function repentanceDay(year: number) {
  const date = new Date(Date.UTC(year, 10, 22));
  while (date.getUTCDay() !== 3) date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function publicHolidaysOfYear(year: number): PublicHoliday[] {
  const easter = easterSunday(year);
  const fromEaster = (days: number) => new Date(easter + days * 86_400_000).toISOString().slice(0, 10);

  return [
    { date: isoDate(year, 1, 1), nameDe: "Neujahr", nameEn: "New Year's Day", states: "all" },
    { date: isoDate(year, 1, 6), nameDe: "Heilige Drei Könige", nameEn: "Epiphany", states: ["BW", "BY", "ST"] },
    { date: isoDate(year, 3, 8), nameDe: "Internationaler Frauentag", nameEn: "International Women's Day", states: ["BE", "MV"] },
    { date: fromEaster(-2), nameDe: "Karfreitag", nameEn: "Good Friday", states: "all" },
    { date: fromEaster(0), nameDe: "Ostersonntag", nameEn: "Easter Sunday", states: ["BB"] },
    { date: fromEaster(1), nameDe: "Ostermontag", nameEn: "Easter Monday", states: "all" },
    { date: isoDate(year, 5, 1), nameDe: "Tag der Arbeit", nameEn: "Labour Day", states: "all" },
    { date: fromEaster(39), nameDe: "Christi Himmelfahrt", nameEn: "Ascension Day", states: "all" },
    { date: fromEaster(49), nameDe: "Pfingstsonntag", nameEn: "Whit Sunday", states: ["BB"] },
    { date: fromEaster(50), nameDe: "Pfingstmontag", nameEn: "Whit Monday", states: "all" },
    { date: fromEaster(60), nameDe: "Fronleichnam", nameEn: "Corpus Christi", states: ["BW", "BY", "HE", "NW", "RP", "SL"] },
    { date: isoDate(year, 8, 15), nameDe: "Mariä Himmelfahrt", nameEn: "Assumption Day", states: ["SL"] },
    { date: isoDate(year, 9, 20), nameDe: "Weltkindertag", nameEn: "World Children's Day", states: ["TH"] },
    { date: isoDate(year, 10, 3), nameDe: "Tag der Deutschen Einheit", nameEn: "German Unity Day", states: "all" },
    {
      date: isoDate(year, 10, 31),
      nameDe: "Reformationstag",
      nameEn: "Reformation Day",
      states: ["BB", "HB", "HH", "MV", "NI", "SN", "ST", "SH", "TH"],
    },
    { date: isoDate(year, 11, 1), nameDe: "Allerheiligen", nameEn: "All Saints' Day", states: ["BW", "BY", "NW", "RP", "SL"] },
    { date: repentanceDay(year), nameDe: "Buß- und Bettag", nameEn: "Repentance Day", states: ["SN"] },
    { date: isoDate(year, 12, 25), nameDe: "1. Weihnachtstag", nameEn: "Christmas Day", states: "all" },
    { date: isoDate(year, 12, 26), nameDe: "2. Weihnachtstag", nameEn: "Boxing Day", states: "all" },
  ];
}

// With no state known, only the holidays of the whole country count.
export function publicHolidayOn(date: string, state: FederalState | null): PublicHoliday | null {
  const holidays = publicHolidaysOfYear(Number(date.slice(0, 4)));
  return (
    holidays.find(
      (holiday) => holiday.date === date && (holiday.states === "all" || (state !== null && holiday.states.includes(state))),
    ) ?? null
  );
}
