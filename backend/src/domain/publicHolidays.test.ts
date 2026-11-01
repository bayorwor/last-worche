import { describe, expect, test } from "bun:test";
import { publicHolidayOn } from "./publicHolidays.ts";

describe("publicHolidayOn", () => {
  test("finds moving holidays from the date of Easter", () => {
    expect(publicHolidayOn("2026-04-03", "HH")?.nameEn).toBe("Good Friday");
    expect(publicHolidayOn("2026-04-06", "HH")?.nameEn).toBe("Easter Monday");
    expect(publicHolidayOn("2026-05-14", "HH")?.nameEn).toBe("Ascension Day");
    expect(publicHolidayOn("2027-03-26", "HH")?.nameEn).toBe("Good Friday");
  });

  test("a Bavarian holiday counts in Bavaria but not in Hamburg", () => {
    expect(publicHolidayOn("2026-11-01", "BY")?.nameDe).toBe("Allerheiligen");
    expect(publicHolidayOn("2026-11-01", "HH")).toBeNull();
  });

  test("a northern holiday counts in Hamburg but not in Bavaria", () => {
    expect(publicHolidayOn("2026-10-31", "HH")?.nameEn).toBe("Reformation Day");
    expect(publicHolidayOn("2026-10-31", "BY")).toBeNull();
  });

  test("Repentance Day is the Wednesday before 23 November, in Saxony only", () => {
    expect(publicHolidayOn("2026-11-18", "SN")?.nameEn).toBe("Repentance Day");
    expect(publicHolidayOn("2026-11-18", "BY")).toBeNull();
  });

  test("with no state known, only the holidays of the whole country count", () => {
    expect(publicHolidayOn("2026-10-03", null)?.nameEn).toBe("German Unity Day");
    expect(publicHolidayOn("2026-11-01", null)).toBeNull();
  });

  test("an ordinary working day is no holiday", () => {
    expect(publicHolidayOn("2026-11-03", "BY")).toBeNull();
  });
});
