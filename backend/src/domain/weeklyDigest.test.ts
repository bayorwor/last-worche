import { describe, expect, test } from "bun:test";
import { buildOrderDigest, digestWeekOf, isoWeekLabel, listDigestWarnings, needsDigest } from "./weeklyDigest.ts";

const MONDAY = "2026-11-09";
const forecastWithWarning = {
  status: "ok" as const,
  exhaustionWeek: { year: 2027, week: 1 },
  warning: { orderByWeek: { year: 2026, week: 50 }, isOverdue: false, followUpPersonDays: 33 },
};

describe("which week a digest covers", () => {
  test("a Monday run covers Monday to Sunday of the week before, labelled by the run's ISO week", () => {
    expect(digestWeekOf(MONDAY)).toEqual({ weekStart: "2026-11-02", weekEnd: "2026-11-08" });
    expect(isoWeekLabel(MONDAY)).toBe("2026-W46");
    expect(isoWeekLabel("2027-01-04")).toBe("2027-W01");
  });
});

describe("which orders get a digest", () => {
  test("an order with bookings in the past week gets one", () => {
    expect(needsDigest([{ consultantId: "a", date: "2026-11-05", hours: 8 }], MONDAY)).toBe(true);
  });

  test("an order with no bookings in the past week gets none, also when it has older ones or one from today", () => {
    expect(needsDigest([], MONDAY)).toBe(false);
    expect(needsDigest([{ consultantId: "a", date: "2026-10-30", hours: 8 }], MONDAY)).toBe(false);
    expect(needsDigest([{ consultantId: "a", date: MONDAY, hours: 8 }], MONDAY)).toBe(false);
  });
});

describe("warnings in the digest", () => {
  test("includes 'order more by week X' when the budget runs out before the project end, in the words of issue #64", () => {
    expect(listDigestWarnings(55, forecastWithWarning, null)).toEqual([
      { kind: "order-more", orderByWeek: { year: 2026, week: 50 }, isOverdue: false, followUpPersonDays: 33 },
    ]);
  });

  test("has no warning when the budget lasts until the project end", () => {
    expect(listDigestWarnings(55, { status: "ok", exhaustionWeek: null, warning: null }, null)).toEqual([]);
    expect(listDigestWarnings(55, { status: "not-enough-data" }, null)).toEqual([]);
  });

  test("names a used-up budget and an open follow-up request", () => {
    expect(listDigestWarnings(0, { status: "not-enough-data" }, { personDays: 15 })).toEqual([
      { kind: "budget-used-up" },
      { kind: "follow-up-open", personDays: 15 },
    ]);
  });
});

describe("the digest of one order", () => {
  test("holds used and free person-days, the week's pace, the forecast exhaustion week and the warnings", () => {
    const digest = buildOrderDigest({
      today: MONDAY,
      order: { id: "4500012345", title: "Customer portal migration" },
      budget: { orderedPersonDays: 140, usedPersonDays: 84, freePersonDays: 56 },
      bookedDays: [
        { consultantId: "a", date: "2026-11-03", hours: 8 },
        { consultantId: "b", date: "2026-11-04", hours: 4 },
        { consultantId: "a", date: "2026-10-20", hours: 8 },
      ],
      forecast: forecastWithWarning,
      openFollowUp: null,
    });

    expect(digest).toMatchObject({
      isoWeek: "2026-W46",
      usedPersonDays: 84,
      freePersonDays: 56,
      weekPersonDays: 1.5,
      forecast: { exhaustionWeek: { year: 2027, week: 1 } },
      warnings: [{ kind: "order-more" }],
    });
  });
});
