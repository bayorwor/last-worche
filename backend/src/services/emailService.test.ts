import { expect, spyOn, test } from "bun:test";
import { sendEmail } from "./emailService.ts";

test("MAIL_MOCK logs the email instead of sending it", async () => {
  const log = spyOn(console, "log").mockImplementation(() => {});

  await sendEmail({ to: "lead@example.com", subject: "Budget warning", text: "Order 4500012345" });

  expect(log).toHaveBeenCalledWith("[MAIL_MOCK] To: lead@example.com | Subject: Budget warning");
  log.mockRestore();
});
