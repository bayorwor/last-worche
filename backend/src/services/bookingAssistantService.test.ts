import { describe, expect, test } from "bun:test";
import { AiServiceError, parseBookingSentence, readProposal } from "./bookingAssistantService.ts";

const answerWith = (content: unknown) => ({ choices: [{ message: { content } }] });

describe("readProposal", () => {
  test("accepts an answer that matches the proposal schema", () => {
    const proposal = { date: "2026-10-30", startTime: "09:00", endTime: "17:00", hours: 7, description: "Kundenportal" };

    expect(readProposal(answerWith(JSON.stringify(proposal)))).toEqual(proposal);
  });

  test("rejects an answer that is not JSON", () => {
    expect(() => readProposal(answerWith("Sorry, I cannot help."))).toThrow(AiServiceError);
  });

  test("rejects JSON that does not match the proposal schema", () => {
    expect(() => readProposal(answerWith('{"hours":"seven"}'))).toThrow(AiServiceError);
  });

  test("rejects an answer without content", () => {
    expect(() => readProposal({ choices: [] })).toThrow(AiServiceError);
  });
});

describe("parseBookingSentence", () => {
  test("AI_MOCK reads the sentence with plain rules, without calling a service", async () => {
    const proposal = await parseBookingSentence("9 bis 5, 1 h Mittag", "2026-10-30");

    expect(proposal).toEqual({
      date: "2026-10-30",
      startTime: "09:00",
      endTime: "17:00",
      hours: 7,
      description: "9 bis 5, 1 h Mittag",
      suggestedOrderId: null,
    });
  });

  test("suggests the one assigned order the sentence names", async () => {
    const orders = [
      { id: "1", title: "Customer portal" },
      { id: "2", title: "Reporting" },
    ];

    expect(await parseBookingSentence("9 bis 5 am Portal", "2026-10-30", orders)).toMatchObject({ suggestedOrderId: "1" });
  });

  test("rejects a sentence that names no times", async () => {
    await expect(parseBookingSentence("Am Portal gearbeitet", "2026-10-30")).rejects.toThrow(AiServiceError);
  });
});
