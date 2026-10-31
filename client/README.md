# client

lastWorche web client, built with React 19, Vite, Redux Toolkit, React Router and Tailwind 4. Start the backend first: Vite forwards `/api` to `http://localhost:3000`.

```bash
bun install
bun run dev     # Vite dev server
bun run build   # type check and production build
bun run lint    # oxlint, also enforces the file size limit
```

The Vite dev server needs Node.js 22.12 or newer alongside Bun.

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
  shared/           used by several features: UI components, API client, formatters
```

## Rules

- **File size:** no file may exceed 450 lines. `bun run lint` fails if one does. Split a growing component into smaller ones well before that.
- **Code splitting:** every page is loaded with `lazy()` in `app/lazyPages.ts`. Page files use `export default` for this; everything else uses named exports. Never import a page anywhere else, or it ends up back in the main bundle.
- **Imports:** a feature may import from `app/storeHooks.ts`, `shared/` and itself, but not from another feature.
- **Pages and components:** pages talk to the store, and components receive data through props.
- **Naming:** components are `PascalCase.tsx` and named after what they show (`BookingProposalCard`), pages end in `Page`, other files are `camelCase.ts`, and event props start with `on`.
- **Language:** code is in English, and text on screen is in German like the mockup.
- **Permissions:** the role navigation only switches the view. The server decides who may see what.
