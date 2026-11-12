# Support Hub tests

## Run tests

```sh
npm ci
npx playwright install chromium
npm test
npm run test:e2e
```

- `npm test`: run unit tests with Vitest and React Testing Library.
- `npm run test:watch`: watch for changes during development.
- `npm run test:e2e`: run Playwright flows in Chromium on desktop and mobile.
- `npm run test:all`: run unit and end-to-end tests.
- `npx playwright show-report`: open the latest end-to-end test report.

End-to-end tests build the app and start a temporary production server at `http://127.0.0.1:3100`. This port must be available. The development server on port 3000 can keep running. On failure, Playwright saves a screenshot and trace in `test-results/`.

## Structure

- `tests/unit/`: isolated component behavior, validation, and accessibility.
- `tests/e2e/`: complete flows in the real app, including native browser validation and responsive layout.
- `tests/setup.ts`: shared unit test setup and cleanup between tests.

Tests use fictional data. Authentication is currently a demo: tests verify that the interface discloses this, without assuming that accounts are created or emails are sent.

The ticket dashboard is available at `/home`, including through the brand link on the access page. Ticket changes are saved locally in the browser, without a backend. Dashboard tests cover search, combined status and priority filters, pagination, browser history, conversation previews, creation validation, priority changes, resolution, and persistence. The URL uses `q`, `status`, `priority`, and `page` to restore the current view. Unit tests also cover invalid stored data and storage failures.

## Permanent rule

New features, behavior changes, and fixes must include relevant unit and end-to-end tests. Add a regression test when fixing a bug. Write test names in English and query elements by labels, roles, and accessible names. Avoid relying on style classes or internal implementation details.

Before completing a change, run the relevant tests, `npm run lint`, and `npm run typecheck`. This preference is also recorded in `AGENTS.md`.
