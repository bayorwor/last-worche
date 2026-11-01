// When an order's budget runs out at the current pace (stories #10, #14, #34). It walks through the coming
// days one by one, so vacations, holidays and shutdowns simply count as days nobody books.
import { addDays, HOURS_PER_PERSON_DAY, type ConsultantCalendar, type DateRange } from "./booking.ts";
import { publicHolidayOn } from "./publicHolidays.ts";

export const MIN_BOOKED_DAYS_FOR_FORECAST = 5;
export const PACE_WINDOW_DAYS = 56; // only the last 8 weeks count as the current pace
export const PURCHASING_LEAD_WEEKS = 4; // how long purchasing needs to place a follow-up order
const MAX_FORECAST_DAYS = 3 * 365;
const SCENARIO_HOURS_PER_DAY = 8;

export type BookedDay = { consultantId: string; date: string; hours: number };

export type ConsultantPace = ConsultantCalendar & {
  consultantId: string;
  hoursPerWorkingDay: number;
  startDate?: string; // a scenario's extra consultant only counts from this day
};

export type ForecastScenario = {
  extraConsultants?: number;
  extraFromDate?: string;
  projectEndShiftWeeks?: number;
};

export type ForecastInput = {
  today: string;
  orderedPersonDays: number;
  bookedHours: number;
  projectEndDate: string;
  consultants: ConsultantPace[];
  shutdowns: DateRange[];
};

function isWeekend(date: string) {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
}

function isInside(ranges: DateRange[], date: string) {
  return ranges.some(({ startDate, endDate }) => startDate <= date && date <= endDate);
}

// ISO 8601: a week belongs to the year of its Thursday, and week 1 holds the first Thursday.
export function isoWeekOf(date: string) {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + 3 - ((day.getUTCDay() + 6) % 7));
  const year = day.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(year, 0, 4));
  firstThursday.setUTCDate(firstThursday.getUTCDate() + 3 - ((firstThursday.getUTCDay() + 6) % 7));
  return { year, week: 1 + Math.round((day.getTime() - firstThursday.getTime()) / (7 * 86_400_000)) };
}

function workingDaysBetween(first: string, last: string) {
  let count = 0;
  for (let date = first; date <= last; date = addDays(date, 1)) {
    if (!isWeekend(date)) count += 1;
  }
  return count;
}

// Each consultant's hours per working day in the last weeks, from their first to their last booking there.
export function calculatePaces(bookedDays: BookedDay[], today: string) {
  const windowStart = addDays(today, -PACE_WINDOW_DAYS);
  const recent = bookedDays.filter(({ date }) => date >= windowStart && date <= today);
  const consultantIds = [...new Set(recent.map(({ consultantId }) => consultantId))];

  return consultantIds.map((consultantId) => {
    const own = recent.filter((day) => day.consultantId === consultantId);
    const dates = own.map(({ date }) => date).sort();
    const hours = own.reduce((total, { hours: dayHours }) => total + dayHours, 0);
    const workingDays = Math.max(workingDaysBetween(dates[0] as string, dates.at(-1) as string), 1);
    return { consultantId, hoursPerWorkingDay: hours / workingDays };
  });
}

export function hasEnoughDataForForecast(bookedDays: BookedDay[], today: string) {
  const windowStart = addDays(today, -PACE_WINDOW_DAYS);
  const recentDays = new Set(bookedDays.filter(({ date }) => date >= windowStart && date <= today).map(({ date }) => date));
  return recentDays.size >= MIN_BOOKED_DAYS_FOR_FORECAST;
}

function bookableHoursOn(date: string, input: ForecastInput) {
  if (isWeekend(date) || isInside(input.shutdowns, date)) return 0;
  return input.consultants.reduce((total, consultant) => {
    const isAway =
      (consultant.startDate !== undefined && date < consultant.startDate) ||
      isInside(consultant.vacations, date) ||
      publicHolidayOn(date, consultant.federalState) !== null;
    return isAway ? total : total + consultant.hoursPerWorkingDay;
  }, 0);
}

export function withScenario(input: ForecastInput, scenario: ForecastScenario): ForecastInput {
  const extraConsultants: ConsultantPace[] = Array.from({ length: scenario.extraConsultants ?? 0 }, (_, index) => ({
    consultantId: `scenario-${index + 1}`,
    hoursPerWorkingDay: SCENARIO_HOURS_PER_DAY,
    federalState: null,
    vacations: [],
    startDate: scenario.extraFromDate ?? input.today,
  }));

  return {
    ...input,
    consultants: [...input.consultants, ...extraConsultants],
    projectEndDate: addDays(input.projectEndDate, (scenario.projectEndShiftWeeks ?? 0) * 7),
  };
}

export function calculateForecast(input: ForecastInput) {
  const { today, projectEndDate } = input;
  const orderedHours = input.orderedPersonDays * HOURS_PER_PERSON_DAY;
  const toPersonDays = (hours: number) => Math.round((hours / HOURS_PER_PERSON_DAY) * 1000) / 1000;

  let remainingHours = orderedHours - input.bookedHours;
  let exhaustionDate: string | null = remainingHours <= 0 ? today : null;
  let remainingAtProjectEnd: number | null = projectEndDate <= today ? remainingHours : null;
  const series = [{ date: today, remainingPersonDays: toPersonDays(Math.max(remainingHours, 0)) }];

  for (let offset = 1; offset <= MAX_FORECAST_DAYS; offset += 1) {
    const date = addDays(today, offset);
    remainingHours -= bookableHoursOn(date, input);

    if (exhaustionDate === null && remainingHours <= 0) exhaustionDate = date;
    if (date === projectEndDate) remainingAtProjectEnd = remainingHours;
    if (offset % 7 === 0 && (exhaustionDate === null || date <= exhaustionDate || date <= projectEndDate)) {
      series.push({ date, remainingPersonDays: toPersonDays(Math.max(remainingHours, 0)) });
    }
    if (exhaustionDate !== null && remainingAtProjectEnd !== null) break;
  }

  const lastPoint = series.at(-1) as { date: string };
  if (exhaustionDate !== null && lastPoint.date < exhaustionDate) {
    series.push({ date: exhaustionDate, remainingPersonDays: 0 });
  }

  const remainingAtEndPersonDays = toPersonDays(remainingAtProjectEnd ?? remainingHours);
  const runsOutBeforeProjectEnd = exhaustionDate !== null && exhaustionDate < projectEndDate;
  const orderByDate = runsOutBeforeProjectEnd ? addDays(exhaustionDate as string, -PURCHASING_LEAD_WEEKS * 7) : null;

  return {
    exhaustionDate,
    exhaustionWeek: exhaustionDate ? isoWeekOf(exhaustionDate) : null,
    projectEndDate,
    remainingAtProjectEndPersonDays: remainingAtEndPersonDays,
    warning: orderByDate
      ? {
          orderByDate,
          orderByWeek: isoWeekOf(orderByDate),
          isOverdue: orderByDate < today,
          followUpPersonDays: Math.ceil(-remainingAtEndPersonDays),
        }
      : null,
    series,
  };
}

// What the forecast assumed, so a project lead can judge it instead of trusting a number.
export function describeAssumptions(input: ForecastInput, untilDate: string) {
  let holidayDays = 0;
  let vacationDays = 0;
  let shutdownDays = 0;

  for (let date = addDays(input.today, 1); date <= untilDate; date = addDays(date, 1)) {
    if (isWeekend(date)) continue;
    if (isInside(input.shutdowns, date)) {
      shutdownDays += 1;
      continue;
    }
    for (const consultant of input.consultants) {
      if (isInside(consultant.vacations, date)) vacationDays += 1;
      else if (publicHolidayOn(date, consultant.federalState)) holidayDays += 1;
    }
  }

  const hoursPerDay = input.consultants.reduce((total, consultant) => total + consultant.hoursPerWorkingDay, 0);
  return {
    pacePersonDaysPerWeek: Math.round(((hoursPerDay * 5) / HOURS_PER_PERSON_DAY) * 10) / 10,
    consultantCount: input.consultants.length,
    holidayDays,
    vacationDays,
    shutdownDays,
    paceWindowWeeks: PACE_WINDOW_DAYS / 7,
    purchasingLeadWeeks: PURCHASING_LEAD_WEEKS,
  };
}
