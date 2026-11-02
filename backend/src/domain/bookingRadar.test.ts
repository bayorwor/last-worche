import { describe, expect, test } from "bun:test";
import {
  countFlagsPerSupplier,
  findBookingsJustUnderLimit,
  findFrequentLongDays,
  findPaceJumps,
  findUnusualPatterns,
  findWeekendWork,
  type RadarBooking,
} from "./bookingRadar.ts";

const TODAY = "2026-11-06"; // a Friday

let nextId = 1;
function booking(date: string, hours: number, consultantId = "consultant-a"): RadarBooking {
  return { id: nextId++, consultantId, consultantName: consultantId === "consultant-a" ? "L. Hoffmann" : "S. Tanriver", date, hours };
}

describe("frequent 10-hour days", () => {
  test("flags 10 h on 3 of the last 5 days, and lists those days, in the words of issue #66", () => {
    const bookings = [booking("2026-11-02", 10), booking("2026-11-03", 6), booking("2026-11-04", 10), booking("2026-11-05", 8), booking("2026-11-06", 10)];

    expect(findFrequentLongDays(bookings, TODAY)).toMatchObject([
      { kind: "frequent-long-days", consultantName: "L. Hoffmann", days: ["2026-11-02", "2026-11-04", "2026-11-06"] },
    ]);
  });

  test("counts a day split into several bookings", () => {
    const bookings = [booking("2026-11-04", 6), booking("2026-11-04", 4), booking("2026-11-05", 10), booking("2026-11-06", 10)];

    expect(findFrequentLongDays(bookings, TODAY)[0]?.days).toEqual(["2026-11-04", "2026-11-05", "2026-11-06"]);
  });

  test("does not flag two long days, or a third one outside the last 5 days", () => {
    const twoDays = [booking("2026-11-05", 10), booking("2026-11-06", 10)];
    const oneTooEarly = [booking("2026-11-01", 10), ...twoDays];

    expect(findFrequentLongDays(twoDays, TODAY)).toEqual([]);
    expect(findFrequentLongDays(oneTooEarly, TODAY)).toEqual([]);
  });

  test("looks at each consultant on their own", () => {
    const bookings = [booking("2026-11-04", 10), booking("2026-11-05", 10), booking("2026-11-06", 10, "consultant-b")];

    expect(findFrequentLongDays(bookings, TODAY)).toEqual([]);
  });
});

describe("weekend work", () => {
  test("flags bookings on a Saturday or Sunday of the last 4 weeks", () => {
    const bookings = [booking("2026-10-31", 4), booking("2026-11-01", 3), booking("2026-11-02", 8)];

    expect(findWeekendWork(bookings, TODAY)).toMatchObject([{ kind: "weekend-work", days: ["2026-10-31", "2026-11-01"] }]);
  });

  test("does not flag weekdays, or a weekend more than 4 weeks ago", () => {
    expect(findWeekendWork([booking("2026-11-02", 8), booking("2026-10-04", 4)], TODAY)).toEqual([]);
  });
});

describe("pace jumps", () => {
  const usualWeeks = ["2026-10-06", "2026-10-13", "2026-10-20", "2026-10-27"].map((date) => booking(date, 16));

  test("flags a week at 1.5 times the usual pace or more", () => {
    const bookings = [...usualWeeks, booking("2026-11-02", 10), booking("2026-11-03", 10), booking("2026-11-04", 6)];

    expect(findPaceJumps(bookings, TODAY)).toMatchObject([{ kind: "pace-jump", details: { recentHours: 26, usualWeeklyHours: 16 } }]);
  });

  test("does not flag a usual week, or a small jump of less than a person-day", () => {
    const usualWeek = [...usualWeeks, booking("2026-11-03", 16)];
    const smallJump = [...usualWeeks.map((week) => ({ ...week, hours: 4 })), booking("2026-11-03", 7)];

    expect(findPaceJumps(usualWeek, TODAY)).toEqual([]);
    expect(findPaceJumps(smallJump, TODAY)).toEqual([]);
  });

  test("does not flag someone new, who has no usual pace yet", () => {
    expect(findPaceJumps([booking("2026-11-03", 40)], TODAY)).toEqual([]);
  });
});

describe("bookings just under the limit", () => {
  test("lists a booking of exactly 1.5 PD when 1.5 PD remained, in the words of issue #66", () => {
    const bookings = [booking("2026-10-01", 8 * 18.5), booking("2026-11-05", 12)];

    expect(findBookingsJustUnderLimit(bookings, 20, TODAY)).toMatchObject([
      { kind: "just-under-limit", days: ["2026-11-05"], details: { hours: 12, freeHoursBefore: 12 } },
    ]);
  });

  test("does not list a booking that leaves a quarter person-day or more free", () => {
    const bookings = [booking("2026-10-01", 8 * 18.5), booking("2026-11-05", 10)];

    expect(findBookingsJustUnderLimit(bookings, 20, TODAY)).toEqual([]);
  });

  test("replays bookings in the order they were stored, not by date", () => {
    const later = { ...booking("2026-11-02", 4), id: 99 };
    const earlier = { ...booking("2026-11-05", 8 * 19.5), id: 1 };

    expect(findBookingsJustUnderLimit([later, earlier], 20, TODAY).map(({ days }) => days)).toEqual([["2026-11-02"]]);
  });
});

describe("the radar as a whole", () => {
  test("finds nothing in an ordinary order", () => {
    const bookings = ["2026-11-02", "2026-11-03", "2026-11-04"].map((date) => booking(date, 8));

    expect(findUnusualPatterns({ today: TODAY, orderedPersonDays: 140, bookings })).toEqual([]);
  });

  test("gives purchasing counts per supplier, and no person, day or hour", () => {
    const flags = findUnusualPatterns({ today: TODAY, orderedPersonDays: 20, bookings: [booking("2026-10-31", 4), booking("2026-11-05", 8 * 19.9)] });

    const summary = countFlagsPerSupplier([
      { supplierName: "Consultis GmbH", flags },
      { supplierName: "Nordlicht Agentur", flags: [] },
    ]);

    expect(summary).toEqual([
      { supplierName: "Consultis GmbH", frequentLongDays: 0, weekendWork: 1, paceJumps: 0, justUnderLimit: 1 },
      { supplierName: "Nordlicht Agentur", frequentLongDays: 0, weekendWork: 0, paceJumps: 0, justUnderLimit: 0 },
    ]);
  });
});
