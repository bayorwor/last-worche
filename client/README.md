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

The mobile app shows the same client, built with `VITE_API_BASE_URL` from `.env.mobile` because it has no Vite server to forward `/api`. To run it in the iOS simulator, start the database and backend, then:

```bash
bun run mobile:sync   # build for mobile and copy into ios/ and android/
bunx cap open ios     # opens Xcode: choose a simulator and press Run
```

Run `mobile:sync` after every client change. Using plain `bun run build` for the app makes every API call fail. On a real phone, set `.env.mobile` to this computer's network address. Android is not set up to reach the backend yet.

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
