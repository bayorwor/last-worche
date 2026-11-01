import { describe, expect, test } from "bun:test";
import {
  calculateForecast,
  calculatePaces,
  describeAssumptions,
  hasEnoughDataForForecast,
  isoWeekOf,
  withScenario,
  type ConsultantPace,
  type ForecastInput,
} from "./forecast.ts";

const TODAY = "2026-11-03";
const consultant = (id: string, overrides: Partial<ConsultantPace> = {}): ConsultantPace => ({
  consultantId: id,
  hoursPerWorkingDay: 8,
  federalState: "HH",
  vacations: [],
  ...overrides,
});

// The story's order: 140 PD ordered, 84 PD used, so 56 PD free.
const input: ForecastInput = {
  today: TODAY,
  orderedPersonDays: 140,
  bookedHours: 84 * 8,
  projectEndDate: "2027-01-29",
  consultants: [consultant("a"), consultant("b")],
  shutdowns: [],
};

describe("isoWeekOf", () => {
  test("follows ISO 8601, also around the turn of the year", () => {
    expect(isoWeekOf("2026-11-03")).toEqual({ year: 2026, week: 45 });
    expect(isoWeekOf("2026-12-31")).toEqual({ year: 2026, week: 53 });
    expect(isoWeekOf("2027-01-04")).toEqual({ year: 2027, week: 1 });
  });
});

describe("calculatePaces", () => {
  test("is the hours per working day from a consultant's first to last recent booking", () => {
    const days = [
      { consultantId: "a", date: "2026-10-26", hours: 8 }, // Monday
      { consultantId: "a", date: "2026-10-30", hours: 4 }, // Friday, with three days between them unbooked
    ];

    expect(calculatePaces(days, TODAY)).toEqual([{ consultantId: "a", hoursPerWorkingDay: 12 / 5 }]);
  });

  test("ignores bookings older than the 8-week window", () => {
    expect(calculatePaces([{ consultantId: "a", date: "2026-08-03", hours: 8 }], TODAY)).toEqual([]);
  });
});

describe("hasEnoughDataForForecast", () => {
  const days = (count: number) =>
    Array.from({ length: count }, (_, index) => ({ consultantId: "a", date: `2026-10-${String(index + 12).padStart(2, "0")}`, hours: 8 }));

  test("says no with too few booked days, so no made-up date appears", () => {
    expect(hasEnoughDataForForecast(days(4), TODAY)).toBe(false);
  });

  test("says yes from five booked days", () => {
    expect(hasEnoughDataForForecast(days(5), TODAY)).toBe(true);
  });
});

describe("calculateForecast", () => {
  test("finds the day the budget runs out, skipping weekends", () => {
    const forecast = calculateForecast(input);

    // 56 PD at 2 PD per working day takes 28 working days from Wednesday 4 November.
    expect(forecast.exhaustionDate).toBe("2026-12-11");
    expect(forecast.exhaustionWeek).toEqual({ year: 2026, week: 50 });
  });

  test("a consultant's vacation moves the end later", () => {
    const vacations = [{ startDate: "2026-11-16", endDate: "2026-11-20" }];
    const later = calculateForecast({ ...input, consultants: [consultant("a", { vacations }), consultant("b")] });

    expect(later.exhaustionDate as string > "2026-12-11").toBe(true);
  });

  test("a public holiday of the consultant's state moves the end later", () => {
    // Twelve working days from 4 November pass Repentance Day, which only Saxony has.
    const inHamburg = { ...input, consultants: [consultant("a", { federalState: "HH" })], bookedHours: input.orderedPersonDays * 8 - 96 };
    const inSaxony = { ...inHamburg, consultants: [consultant("a", { federalState: "SN" })] };

    expect(calculateForecast(inHamburg).exhaustionDate).toBe("2026-11-19");
    expect(calculateForecast(inSaxony).exhaustionDate).toBe("2026-11-20");
  });

  test("a shutdown moves the end later", () => {
    const shutdowns = [{ startDate: "2026-11-23", endDate: "2026-11-27" }];

    expect(calculateForecast({ ...input, shutdowns }).exhaustionDate).toBe("2026-12-18");
  });

  test("warns in time when the budget runs out before the project ends", () => {
    const { warning, remainingAtProjectEndPersonDays } = calculateForecast(input);

    expect(warning).toEqual({
      orderByDate: "2026-11-13",
      orderByWeek: { year: 2026, week: 46 },
      isOverdue: false,
      followUpPersonDays: Math.ceil(-remainingAtProjectEndPersonDays),
    });
    expect(remainingAtProjectEndPersonDays).toBeLessThan(0);
  });

  test("shows no warning when the budget lasts past the project end", () => {
    const forecast = calculateForecast({ ...input, projectEndDate: "2026-12-04" });

    expect(forecast.warning).toBeNull();
    expect(forecast.remainingAtProjectEndPersonDays).toBeGreaterThan(0);
  });

  test("marks a warning as overdue when the order date has passed", () => {
    const forecast = calculateForecast({ ...input, bookedHours: input.orderedPersonDays * 8 - 80 });

    expect(forecast.warning?.isOverdue).toBe(true);
  });

  test("an order with no budget left is exhausted today", () => {
    expect(calculateForecast({ ...input, bookedHours: 140 * 8 }).exhaustionDate).toBe(TODAY);
  });

  test("with nobody booking, the budget never runs out", () => {
    const forecast = calculateForecast({ ...input, consultants: [] });

    expect(forecast.exhaustionDate).toBeNull();
    expect(forecast.warning).toBeNull();
    expect(forecast.remainingAtProjectEndPersonDays).toBe(56);
  });

  test("the series starts at the free budget and ends at zero", () => {
    const { series } = calculateForecast(input);

    expect(series[0]).toEqual({ date: TODAY, remainingPersonDays: 56 });
    expect(series.at(-1)?.remainingPersonDays).toBe(0);
  });
});

describe("withScenario", () => {
  test("a third consultant moves the end earlier and leaves less at the project end", () => {
    const base = calculateForecast(input);
    const scenario = calculateForecast(withScenario(input, { extraConsultants: 1, extraFromDate: "2026-11-23" }));

    expect(scenario.exhaustionDate as string < (base.exhaustionDate as string)).toBe(true);
    expect(scenario.remainingAtProjectEndPersonDays).toBeLessThan(base.remainingAtProjectEndPersonDays);
  });

  test("the extra consultant only counts from the chosen day", () => {
    const fromLater = calculateForecast(withScenario(input, { extraConsultants: 1, extraFromDate: "2026-12-30" }));

    expect(fromLater.exhaustionDate).toBe("2026-12-11");
  });

  test("a later project end moves the order date's baseline, not the run-out day", () => {
    const base = calculateForecast(input);
    const scenario = calculateForecast(withScenario(input, { projectEndShiftWeeks: 4 }));

    expect(scenario.projectEndDate).toBe("2027-02-26");
    expect(scenario.exhaustionDate).toBe(base.exhaustionDate);
    expect(scenario.warning?.followUpPersonDays as number).toBeGreaterThan(base.warning?.followUpPersonDays as number);
  });

  test("changes nothing about the input it was given", () => {
    withScenario(input, { extraConsultants: 2 });

    expect(input.consultants).toHaveLength(2);
  });
});

describe("describeAssumptions", () => {
  test("states the pace and the days nobody books", () => {
    const vacations = [{ startDate: "2026-11-16", endDate: "2026-11-20" }];
    const shutdowns = [{ startDate: "2026-12-24", endDate: "2027-01-01" }];

    expect(
      describeAssumptions({ ...input, consultants: [consultant("a", { vacations, federalState: "BY" }), consultant("b")], shutdowns }, "2027-01-08"),
    ).toEqual({
      pacePersonDaysPerWeek: 10,
      consultantCount: 2,
      holidayDays: 1, // Epiphany on 6 January, which Bavaria has and Hamburg does not
      vacationDays: 5,
      shutdownDays: 7,
      paceWindowWeeks: 8,
      purchasingLeadWeeks: 4,
    });
  });
});
