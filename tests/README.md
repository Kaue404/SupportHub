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

The ticket dashboard is available at `/home`, including through the brand link on the access page. Ticket changes are saved locally in the browser, without a backend. Dashboard tests cover search, combined status and priority filters, pagination, browser history, conversation previews, creation validation, priority changes, resolution, and persistence. Resolved tickets remain read-only while their conversation previews stay available, including when a ticket is resolved while its priority menu is open. The URL uses `q`, `status`, `priority`, and `page` to restore the current view. Unit tests also cover invalid stored data and storage failures.

The profile popover is available from the sidebar avatar and workspace name, including in collapsed and mobile sidebars. Tests cover keyboard access, dismissal, focus restoration, navigation to `/profile`, returning to overview through the sidebar, and signing out to `/`. Overview navigation keeps the same dimensions, padding, and typography in selected and unselected states, including collapsed and mobile sidebars in both themes. The profile breadcrumb contains only the page name, without a workspace parent or a duplicate heading in the content; the overview retains its workspace breadcrumb. Authentication remains a demo: signing out returns to the access page without changing locally stored tickets or theme preferences.

Profile editing happens directly in the card: photo upload/removal, name, description, and workspace are saved in browser storage and reflected in the sidebar. Tests cover saving, reloading, canceling drafts, required fields, invalid or oversized photos, corrupt stored profiles, storage failures, and cross-tab updates. Layout tests compare profile card alignment, borders, and corner radii with overview cards and controls, verify 64px top and bottom spacing, full-width fields, a description that fills the available height without manual resizing, and actions in the lower-right card footer on desktop and mobile in both themes. Photos accept JPG, PNG, or WebP up to 2 MB.

Theme shortcut tests verify that D toggles the theme outside editable fields while typing, composition, modified or repeated shortcuts, and keyboard events without a string key do not toggle the theme or crash. The profile regression test types and saves a name while checking for uncaught browser errors on desktop and mobile.

Sidebar preferences are saved in cookies for seven days and restored after reloads and navigation. Desktop expansion and mobile visibility use separate preferences. Workspace route layouts read these cookies on the server so the initial HTML already uses the saved state. Tests cover server rendering, both states with startup scripts blocked, unchanged state through hydration, keyboard toggles, invalid or unavailable cookies, controlled providers, and closing mobile navigation when selecting a page.

## Permanent rule

New features, behavior changes, and fixes must include relevant unit and end-to-end tests. Add a regression test when fixing a bug. Write test names in English and query elements by labels, roles, and accessible names. Avoid relying on style classes or internal implementation details.

Before completing a change, run the relevant tests, `npm run lint`, and `npm run typecheck`. This preference is also recorded in `AGENTS.md`.
