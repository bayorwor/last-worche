The stack is decided in the [ADRs](../docs/adr/): Express for HTTP and Vite for the client on the Bun runtime, MySQL through `mysql2`, OpenRouter for AI and nodemailer for email. See `README.md` in this folder for the layers.

Use Bun instead of Node.js in this folder:

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun install` instead of `npm install`, `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.mdx`.
