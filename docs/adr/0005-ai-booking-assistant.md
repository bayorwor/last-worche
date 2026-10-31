# 0005 · AI booking assistant

- **Status:** replaced by [0007](0007-openrouter-ai-gateway.md)
- **Date:** 2026-10-31
- **Deciders:** Team lastWorche

## Context

One-sentence booking is one of our [product's highlights](../product-vision.md): a consultant types "9 bis 5 am Kundenportal, 1 h Mittag" and confirms the proposal. Sentences come in free German or English, which simple pattern matching handles poorly. The jury starts the product without API keys, so the feature needs a switch that replaces the AI. A sentence may contain personal data, and that data would leave our system.

## Options considered

1. **Claude API behind a server-side mock switch** – understands free language and returns JSON that matches a schema / costs money per call, needs a network, and text leaves the system.
2. **Own parser with regular expressions** – free, offline, no data leaves / breaks on anything outside the expected phrasing, as the mockup's simple parser shows.
3. **Local language model** – no data leaves / too heavy for a laptop demo and for the 5-minute start.

## Decision

We choose **option 1**, with `AI_MOCK=true` as the default. The call runs only on the server, in `claudeService.ts`. The model is `claude-opus-5-5`, at low effort because this is a simple extraction, and the API's automatic fallback to another model is enabled for refused requests.

The AI only proposes. It sends back a date, hours and a description, nothing is stored, and the consultant must confirm. The confirmed booking then passes the same server-side rules as any other.

## Consequences

- The demo works with no key and no network, but the mock returns a fixed 7-hour proposal, whatever the sentence says.
- Only the sentence and today's date are sent. No user name, ID or order data is added, but the consultant may type personal data into the sentence.
- A customer who enables the real call needs a data-processing agreement with the provider, so the switch must stay off until then.
- If the AI service fails, the API returns a 503 with a clear message. There is no manual booking form in the client yet, so booking would stop until the service returns.
- A successful real call has not been tested yet; only the mock and the error path have.
