# 0007 · OpenRouter for AI

- **Status:** accepted, replaces [ADR-0005](0005-ai-booking-assistant.md)
- **Date:** 2026-10-31
- **Deciders:** Team lastWorche

## Context

One-sentence booking needs a language model: a consultant types "9 bis 5 am Kundenportal, 1 h Mittag" and confirms the proposal. ADR-0005 chose the Claude API, and the team has decided against using it. The jury starts the product without API keys, so the feature still needs a mock switch. A sentence may contain personal data, and that data would leave our system.

## Options considered

1. **OpenRouter** – one API and key for many models, so the model can change through configuration / adds another company between us and the model provider, and behaviour varies between models.
2. **One model provider's API directly** – one party to assess and predictable behaviour / changing provider means changing code.
3. **Own parser with regular expressions** – free, offline, no data leaves / breaks on anything outside the expected phrasing, as the mockup's simple parser shows.

## Decision

We choose **OpenRouter**, called with plain `fetch` from `bookingAssistantService.ts` on the server, and `AI_MOCK=true` stays the default. `OPENROUTER_MODEL` sets the model, with `openrouter/auto` as the default, which lets OpenRouter pick one per request.

Each request asks for JSON matching our schema, and only uses providers that support this format and do not collect user data (`require_parameters: true`, `data_collection: "deny"`). Support for the format varies by provider, so the server also checks every answer against the schema.

The AI only proposes. Nothing is stored until the consultant confirms, and the confirmed booking then passes the same server-side rules as any other.

## Consequences

- The demo works with no key and no network, but the mock returns a fixed 7-hour proposal, whatever the sentence says.
- With `openrouter/auto`, the model and its price can differ per request. For a live demo with a real key, set a fixed model.
- Only the sentence and today's date are sent, with no user name, ID or order data, but the consultant may type personal data into the sentence.
- A customer who enables the real call needs agreements covering OpenRouter and the model providers, so the switch must stay off until then. Stricter options exist, such as zero data retention (`zdr: true`).
- If the AI service fails, the API returns a 503 with a clear message. There is no manual booking form in the client yet, so booking would stop until the service returns.
