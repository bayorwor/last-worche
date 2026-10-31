# client

lastWorche web client, built with React 19, Vite, Redux Toolkit, React Router and Tailwind 4. Start the backend first: Vite forwards `/api` to `http://localhost:3000`.

```bash
bun install
bun run dev     # Vite dev server
bun run build   # type check and production build
bun run lint    # oxlint, also enforces the file size limit
bun test        # unit tests
```

The Vite dev server needs Node.js 22.12 or newer alongside Bun.

## Mobile app

The mobile apps show the same client, built with `VITE_API_BASE_URL` from `.env.mobile` because they have no Vite server to forward `/api`. The steps for phone browsers, the iOS simulator, iPhones and Android are in [Test on a phone](../README.md#test-on-a-phone).

```bash
bun run dev --host    # also serves the client on your network, for phone browsers
bun run mobile:sync   # build for the apps and copy into ios/ and android/
```

Run `mobile:sync` after every client change. Using plain `bun run build` for the apps makes every API call fail. `server.androidScheme` and `server.cleartext` in `capacitor.config.ts` let Android call the local backend over plain `http`, which a production build must not do.

## Structure

```
src/
  main.tsx          mounts the app
  index.css         design tokens from the mockup, the only place colours are defined
  app/              store, router, route paths and page layout
  features/         one folder per area of the product
    <feature>/
      pages/        one screen per route, loaded on demand
      components/   parts used only by this feature
      *Api.ts       backend calls
      *Slice.ts     Redux state
      *Types.ts     data types
  shared/           used by several features: UI components, API client, formatters, translations (i18n/)
```

## Rules

- **File size:** no file may exceed 450 lines. `bun run lint` fails if one does. Split a growing component into smaller ones well before that.
- **Code splitting:** every page is loaded with `lazy()` in `app/lazyPages.ts`. Page files use `export default` for this; everything else uses named exports. Never import a page anywhere else, or it ends up back in the main bundle.
- **Imports:** a feature may import from `app/storeHooks.ts`, `shared/` and itself, but not from another feature.
- **Pages and components:** pages talk to the store, and components receive data through props.
- **Logo:** the logo files are in `public/`, made from the masters in [docs/brand](../docs/brand/README.md). Use `/logo.svg` rather than redrawing it.
- **Naming:** components are `PascalCase.tsx` and named after what they show (`BookingProposalCard`), pages end in `Page`, other files are `camelCase.ts`, and event props start with `on`.
- **Language:** code is in English. Text on screen is in German and English, and never written directly in a component: add it to `shared/i18n/messages/de.ts` and `en.ts`, then show it with `t('key')` from `useTranslation()`. The build fails if a language misses a key. Numbers, dates and units use the formatters from `useTranslation()`. See [ADR-0009](../docs/adr/0009-languages-and-location-default.md).
- **Tests:** test files are skipped by the type check, because `bun:test` has no types in the client.
- **Permissions:** the guards in `app/layout/RouteGuards.tsx` only choose which screen to show. The server decides who may see what.
