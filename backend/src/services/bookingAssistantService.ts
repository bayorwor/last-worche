// Turns one sentence into a booking proposal, with a language model through OpenRouter. With AI_MOCK or when
// that service fails, plain rules read the sentence instead. The proposal is not stored: the consultant
// confirms it and POST /api/bookings then runs the business rules.
import { z } from "zod";
import { env } from "../config/dotenv.ts";
import { matchOrderInSentence, parseBookingSentence as parseWithRules } from "../domain/bookingSentence.ts";
import { bookingProposalSchema, type BookingProposal, type BookingProposalResponse } from "../dtos/aiDtos.ts";
import { BOOKING_PARSER_SYSTEM_PROMPT, buildBookingParserMessage } from "../templates/prompts.ts";

const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 30_000;

const unavailableMessage = "The AI service is unavailable. Please try again later.";
const unreadableMessage = "The sentence could not be turned into a booking. Please rephrase it.";

export class AiServiceError extends Error {
  constructor(
    readonly code: "ai-unavailable" | "ai-busy" | "ai-unreadable",
    message: string,
  ) {
    super(message);
  }
}

export async function parseBookingSentence(
  sentence: string,
  today = new Date().toISOString().slice(0, 10),
  assignedOrders: { id: string; title: string }[] = [],
): Promise<BookingProposalResponse> {
  const proposal = env.AI_MOCK ? readWithRules(sentence, today) : await readWithAiOrRules(sentence, today);
  return { ...proposal, suggestedOrderId: matchOrderInSentence(sentence, assignedOrders) };
}

function readWithRules(sentence: string, today: string): BookingProposal {
  const proposal = parseWithRules(sentence, today);
  if (!proposal) throw new AiServiceError("ai-unreadable", unreadableMessage);
  return proposal;
}

async function readWithAiOrRules(sentence: string, today: string): Promise<BookingProposal> {
  try {
    return await readWithAi(sentence, today);
  } catch (error) {
    if (!(error instanceof AiServiceError)) throw error;
    const proposal = parseWithRules(sentence, today);
    if (!proposal) throw error;
    console.error(`AI service failed (${error.code}), so plain rules read the sentence.`);
    return proposal;
  }
}

async function readWithAi(sentence: string, today: string): Promise<BookingProposal> {
  const response = await callOpenRouter(sentence, today);

  if (response.status === 429) {
    throw new AiServiceError("ai-busy", "The AI service is busy. Please try again in a moment.");
  }
  if (!response.ok) {
    console.error(`OpenRouter error ${response.status}:`, await response.text());
    throw new AiServiceError("ai-unavailable", unavailableMessage);
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
    throw new AiServiceError("ai-unavailable", unavailableMessage);
  }
}

// Exact schema compliance varies by provider, so the answer is always checked before it is used.
export function readProposal(body: unknown): BookingProposal {
  const content = (body as { choices?: { message?: { content?: unknown } }[] }).choices?.[0]?.message?.content;
  try {
    return bookingProposalSchema.parse(JSON.parse(String(content)));
  } catch {
    throw new AiServiceError("ai-unreadable", unreadableMessage);
  }
}
