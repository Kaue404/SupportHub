<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Permanent Support Hub guidelines

- Write all project content in English, including UI copy, accessible labels, messages, metadata, comments, tests, and documentation.
- Always create or update unit and end-to-end tests when implementing features, fixing bugs, or changing behavior.
- Use Vitest and React Testing Library for unit tests and Playwright for end-to-end tests. Reuse the existing setup rather than adding another test framework unnecessarily.
- Test user-observable behavior, including validation, errors, and navigation. Include a regression test when fixing a bug.
- Run the relevant tests, lint, and type checks before finishing. Report any checks that could not run and explain why.
- Preserve the original color palette and use the existing theme variables in `app/globals.css`.
- Preserve the user's existing changes and keep copy concise and direct.
