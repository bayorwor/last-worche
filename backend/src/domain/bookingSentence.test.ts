import { describe, expect, test } from "bun:test";
import { matchOrderInSentence, parseBookingSentence } from "./bookingSentence.ts";

const TODAY = "2026-11-03"; // a Tuesday

describe("parseBookingSentence", () => {
  test("reads the story's English sentence as 7.0 h yesterday", () => {
    expect(parseBookingSentence("yesterday 9 to 5 on the portal migration, 1 h lunch", TODAY)).toEqual({
      date: "2026-11-02",
      startTime: "09:00",
      endTime: "17:00",
      hours: 7,
      description: "yesterday 9 to 5 on the portal migration, 1 h lunch",
    });
  });

  test("reads the same sentence in German, for today", () => {
    expect(parseBookingSentence("9 bis 5 am Kundenportal, 1 h Mittag", TODAY)).toMatchObject({
      date: TODAY,
      startTime: "09:00",
      endTime: "17:00",
      hours: 7,
    });
  });

  test("reads exact times, and a break in minutes", () => {
    expect(parseBookingSentence("08:30 - 12:15 Workshop, 15 min Pause", TODAY)).toMatchObject({
      startTime: "08:30",
      endTime: "12:15",
      hours: 3.5,
    });
  });

  test("reads a 24-hour end time without changing it", () => {
    expect(parseBookingSentence("13 bis 18 Uhr Tests", TODAY)).toMatchObject({ startTime: "13:00", endTime: "18:00", hours: 5 });
  });

  test("reads a date, without taking it for a time", () => {
    expect(parseBookingSentence("24.12. 9 bis 12 Abschluss", TODAY)).toMatchObject({ date: "2026-12-24", startTime: "09:00", endTime: "12:00" });
    expect(parseBookingSentence("15.01.2027 9 bis 12 Abschluss", TODAY)).toMatchObject({ date: "2027-01-15" });
  });

  test("reads a weekday as the most recent such day", () => {
    expect(parseBookingSentence("Montag 9 bis 12 Review", TODAY)?.date).toBe("2026-11-02");
    expect(parseBookingSentence("on Wednesday 9 to 12 review", TODAY)?.date).toBe("2026-10-28");
    expect(parseBookingSentence("Dienstag 9 bis 12 Review", TODAY)?.date).toBe(TODAY);
  });

  test("reads only a duration, starting at 09:00", () => {
    expect(parseBookingSentence("3,5 Stunden am Portal", TODAY)).toMatchObject({ startTime: "09:00", endTime: "12:30", hours: 3.5 });
  });

  test("gives up on a sentence with no times", () => {
    expect(parseBookingSentence("Am Portal gearbeitet", TODAY)).toBeNull();
  });

  test("gives up when the break is longer than the work", () => {
    expect(parseBookingSentence("9 bis 10 Review, 2 h Pause", TODAY)).toBeNull();
  });

  test("gives up on times that do not exist", () => {
    expect(parseBookingSentence("25 bis 26 Review", TODAY)).toBeNull();
  });
});

describe("matchOrderInSentence", () => {
  const orders = [
    { id: "4500012345", title: "Customer portal migration" },
    { id: "4500012346", title: "Reporting platform" },
  ];

  test("finds the one order the sentence names", () => {
    expect(matchOrderInSentence("9 bis 5 am Kundenportal", orders)).toBe("4500012345");
    expect(matchOrderInSentence("reporting all morning", orders)).toBe("4500012346");
  });

  test("finds an order by its number", () => {
    expect(matchOrderInSentence("9 to 5 on 4500012346", orders)).toBe("4500012346");
  });

  test("asks the person to choose when nothing matches", () => {
    expect(matchOrderInSentence("9 to 5 meetings", orders)).toBeNull();
  });

  test("asks the person to choose when two orders match", () => {
    expect(matchOrderInSentence("portal and reporting", orders)).toBeNull();
  });
});
