// Turns one sentence into a booking proposal using a language model through OpenRouter. The proposal
// is not stored: the consultant confirms it and POST /api/bookings then runs the business rules.
import { z } from "zod";
import { env } from "../config/dotenv.ts";
import { bookingProposalSchema, type BookingProposal } from "../dtos/aiDtos.ts";
import { BOOKING_PARSER_SYSTEM_PROMPT, buildBookingParserMessage } from "../templates/prompts.ts";

const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 30_000;

const unavailableMessage = "The AI service is unavailable. Please try again later.";
const unreadableMessage = "The sentence could not be turned into a booking. Please rephrase it.";

export class AiServiceError extends Error {}

export async function parseBookingSentence(
  sentence: string,
  today = new Date().toISOString().slice(0, 10),
): Promise<BookingProposal> {
  if (env.AI_MOCK) {
    return { date: today, hours: 7, description: sentence };
  }

  const response = await callOpenRouter(sentence, today);

  if (response.status === 429) {
    throw new AiServiceError("The AI service is busy. Please try again in a moment.");
  }
  if (!response.ok) {
    console.error(`OpenRouter error ${response.status}:`, await response.text());
    throw new AiServiceError(unavailableMessage);
  }

  return readProposal(await response.json());
}

async function callOpenRouter(sentence: string, today: string): Promise<Response> {
  try {
    return await fetch(OPENROUTER_CHAT_URL, {
      method: "POST",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "X-OpenRouter-Title": "lastWorche",
      },
      body: JSON.stringify({
        model: env.OPENROUTER_MODEL,
        messages: [
          { role: "system", content: BOOKING_PARSER_SYSTEM_PROMPT },
          { role: "user", content: buildBookingParserMessage(sentence, today) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "booking_proposal", strict: true, schema: z.toJSONSchema(bookingProposalSchema) },
        },
        // Only use providers that support this JSON format and do not collect the text we send.
        provider: { require_parameters: true, data_collection: "deny" },
      }),
    });
  } catch (error) {
    console.error("OpenRouter request failed:", error);
    throw new AiServiceError(unavailableMessage);
  }
}

// Exact schema compliance varies by provider, so the answer is always checked before it is used.
export function readProposal(body: unknown): BookingProposal {
  const content = (body as { choices?: { message?: { content?: unknown } }[] }).choices?.[0]?.message?.content;
  try {
    return bookingProposalSchema.parse(JSON.parse(String(content)));
  } catch {
    throw new AiServiceError(unreadableMessage);
  }
}
