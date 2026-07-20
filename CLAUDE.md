# GitHub Repository Explorer — Working Notes

A small, production-minded single-page app for searching GitHub repositories and
viewing their details. No backend — it talks directly to the public GitHub REST
API. This file is the shared source of truth for how we build it: the plan, the
conventions, and the decisions. Keep it up to date as we go.

## Product scope

Intentionally small. Two screens:

1. **Search** — search repositories by keyword, with sorting and pagination.
2. **Detail** — a single repository's stats, language, license, topics, links.

Depth over breadth: the value is in how carefully states, errors and edge cases
are handled, not in the number of features.

## Tech stack

- **Vue 3** with Composition API and `<script setup>`
- **TypeScript**, strict mode
- **Vuetify 3** — component UI framework (no Tailwind)
- **SCSS** — CSS preprocessor
- **Pinia** — shared state (token + rate-limit snapshot)
- **Vue Router** — hash history (see decisions)
- **Vite** — build tooling
- **Vitest** + **@vue/test-utils** — unit tests

## GitHub API

- `GET /search/repositories` — search screen
- `GET /repos/{owner}/{repo}` — detail screen
- Unauthenticated: 60 requests/hour. With a token: 5,000/hour.
- Rate-limit state is reported via `X-RateLimit-Limit`, `-Remaining`, `-Reset`.
- Search API caps out at 1,000 results total.

## Key decisions

- **Auth: token-optional, never bundled.** The app works with no token by
  default (60 req/hour). A user may paste their own Personal Access Token in the
  UI; it is stored only in their browser (localStorage) and sent only to GitHub.
  We never bake a token into the build — the deploy is a static site, so a
  bundled token would be publicly readable. Rate-limit handling is treated as a
  first-class UX concern, not an afterthought.
- **Hash-mode router.** GitHub Pages is a static host with no server-side
  rewrites, so HTML5 history mode would 404 on refresh / deep links. Hash mode
  avoids that entirely.
- **Normalized error model.** The API layer maps every failure to one of a few
  kinds (`rate-limit`, `not-found`, `validation`, `network`, `unauthorized`,
  `unknown`) so components react to meaning, not HTTP status codes.
- **Request cancellation.** Search uses debounce + `AbortController` so fast
  typing can't race stale responses onto the screen or waste the rate budget.
- **Deploy: GitHub Pages via GitHub Actions.** `base` is set to the repo path.
- **SVG icons, not the icon font.** Icons come from `@mdi/js` via Vuetify's
  `mdi-svg` iconset, so only the handful of icons we use are bundled rather than
  the full ~1.3 MB webfont. Icons are imported per component and bound with
  `:icon="mdiFoo"`.

## Edge cases we must handle (the disqualifying bar)

The assessment states a single unhandled edge case that visibly breaks UX is
disqualifying. Tracked list:

- Empty / whitespace-only query → idle state, no request
- Zero results → clear "no results" state
- Rate limit hit (403/429 + remaining 0) → explain + show reset time + suggest token
- Network / offline error → retryable error state
- 404 on detail page (repo removed / typo) → not-found state
- Missing/`null` fields: description, language, license, homepage, topics
- Fast typing → debounce + cancel superseded requests
- Special characters in query → correct encoding
- Very long names/descriptions → truncation, no layout overflow
- Pagination beyond the 1,000-result search cap
- Invalid/expired token → clear "token rejected" state

## Conventions

- **Commits:** Conventional Commits (`feat:`, `fix:`, `test:`, `chore:`,
  `build:`, `ci:`, `docs:`). Small, atomic commits — the history should read as a
  coherent story of how the app was built.
- **One stage at a time.** Finish a stage, review, commit, then move on. Each
  stage should leave the project in a working state.
- **Path alias:** `@/` → `src/` (added in Stage 1).
- **No secrets in the repo.** Tokens live only in the browser at runtime.

## AI assistance

AI assistance is used during development and will be disclosed in the README, as
the assessment requires.

## Build & run

```bash
npm install
npm run dev       # local dev server
npm run build     # type-check + production build
npm run test      # unit tests (from Stage 1)
```

---

## Stage roadmap

Each stage is one logical unit of history (one or a few commits). Check items off
as they land.

- [x] **Stage 0 — Scaffold.** Vite + Vue 3 (`<script setup>`) + TypeScript. Bare
  app runs via `npm run dev`.
  - `chore: scaffold Vite + Vue 3 + TypeScript project`

- [x] **Stage 1 — Config & tooling.** Tightened tsconfig
  (`noUncheckedIndexedAccess`, `noImplicitReturns`), added `@/` path alias, SCSS,
  Pinia, Vue Router (hash), and Vitest 3 (aligned with Vite 6 to avoid a
  duplicate-vite type clash). Placeholder `SearchView` route renders; a router
  smoke test passes.
  - `build: tighten TypeScript config and add @/ path alias`
  - `chore: add Pinia, Vue Router (hash) and Vitest`

- [x] **Stage 2 — Vuetify.** Added Vuetify 3 (auto-import via
  `vite-plugin-vuetify`), a light GitHub-flavored theme, and the app shell (app
  bar + `<router-view>`). Uses SVG icons (`@mdi/js` + `mdi-svg` iconset) so only
  imported icons ship, instead of the full ~1.3 MB MDI webfont.
  - `feat: set up Vuetify and app shell`

- [x] **Stage 3 — API layer & types.** GitHub types; `request` fetch wrapper
  with rate-limit header parsing, normalized `ApiError`/`AbortedError` model, and
  abort handling; `searchRepositories` / `getRepository` services. 22 unit tests
  cover rate-limit parsing, url building, error mapping (404/403/422/401/network/
  abort), auth header, and query encoding.
  - `feat: add GitHub API types`
  - `feat: add API client with rate-limit and error handling`
  - `test: cover rate-limit parsing and url building`

- [x] **Stage 4 — State & composables.** Pinia `settings` store (PAT persisted
  to localStorage with safe fallback, rate-limit snapshot, `hasToken` /
  `isRateLimited` getters); `useRepoSearch` (debounced typing, immediate sort/
  page, `AbortController` cancellation of superseded requests, page reset on new
  query, `totalPages` capped at the 1000-result window, error/loading state,
  rate-limit propagation to the store); `useRepoDetails` (single-repo load with
  cancellation). 14 new unit tests (settings store 7, search composable 7) —
  36 total.
  - `feat: add settings store for token and rate limit`
  - `feat: add repo search composable with debounce and cancellation`
  - `test: cover search composable`

- [ ] **Stage 5 — Search page.** Input, result list, sort, pagination,
  loading/idle/empty states.
  - `feat: build repository search page`

- [ ] **Stage 6 — Detail page.** Route `/repo/:owner/:name`; stats, language,
  license, topics, links.
  - `feat: build repository detail page`

- [ ] **Stage 7 — Auth UX.** Token dialog, browser-only storage, rate-limit
  indicator in the header.
  - `feat: add optional token dialog and rate-limit indicator`

- [ ] **Stage 8 — Edge-case hardening.** A deliberate, visible pass: rate-limit
  screen with reset time, 404 handling, null-field guards, long-string
  truncation, 1,000-result cap, offline/retry.
  - `fix: handle rate-limit exhaustion with reset time`
  - `fix: guard against missing repository fields`
  - `fix: handle 404 and network errors in detail view`

- [ ] **Stage 9 — Component tests.** State rendering (empty/loading/error), repo
  card with null fields.
  - `test: cover component states and edge cases`

- [ ] **Stage 10 — Deploy & docs.** GitHub Actions → Pages, `base` path, concise
  README (context, setup, auth choice, handled edge cases, AI disclosure).
  - `ci: deploy to GitHub Pages`
  - `docs: add README`

## Environment note

This project was verified on an arm64 Linux sandbox where esbuild `0.25.12`
segfaults (an environment-specific bug). Normal dev machines are unaffected. If
you ever hit an esbuild crash locally, pin a known-good version via an `npm`
override, e.g. `"overrides": { "esbuild": "0.24.2" }`.
