# 0009 · German and English, with the default from the location

- **Status:** proposed
- **Date:** 2026-10-31
- **Deciders:** Team lastWorche

## Context

lastWorche must work in German and English, and a new visitor should start in the language of their location. People who book time, such as external consultants, may not share a language with the client. The jury must be able to run the product with no paid account, and we must not collect more personal data than needed ([roles-and-privacy.md](../roles-and-privacy.md)).

There are two separate choices: how to find the location, and how to hold the translations.

## Options considered

**Finding the location**

1. **Time zone of the device** – no permission prompt, no outside service, nothing leaves the device / only as exact as the time zone, and wrong for someone whose device uses another country's time zone.
2. **IP address lookup** – closer to the real country / sends every visitor's IP address to a service or needs a location database, and company networks and VPNs can show the wrong country.
3. **Browser location (GPS)** – most exact / asks for permission on the first visit, far more personal data than choosing a language needs, and still needs a service to turn coordinates into a country.

**Holding the translations**

1. **Own small typed message files** – no new package, and the build fails if a language misses a key / no plural rules or translation tools, so it needs replacing if the text grows a lot.
2. **react-i18next** – the common library, with plurals and translation tools / a new dependency and more concepts to explain, for about 60 short messages.

## Decision

We choose the **device time zone** and **our own typed message files** in `client/src/shared/i18n/`.

The language is chosen in this order:

1. The visitor's saved choice from the language switcher
2. German if the time zone is in Germany, Austria, Switzerland or Liechtenstein
3. German if the browser's first language is German
4. English

Sample names and text that people enter are not translated.

## Consequences

- Switzerland starts in German, although many people there speak French or Italian. The language switcher in the header corrects this, and the choice is remembered on that device.
- Someone with an English browser in Germany starts in German, because the location comes first.
- The server's rule errors now carry a `rule` and `values`, and AI errors carry a `code`, so the client can write them in either language. Every new business rule needs a German and an English message; until it has them, the client shows the server's English text.
- Text produced by the AI stays in the language of the sentence, as [ADR-0007](0007-openrouter-ai-gateway.md) already allows.
- Emails ([ADR-0008](0008-email-with-nodemailer.md)) are not translated yet. That will need a stored language per user, which comes with sign-in.
