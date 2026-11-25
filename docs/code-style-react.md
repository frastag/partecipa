---
paths:
  - "frontend/**/*.ts"
  - "frontend/**/*.tsx"
  - "frontend/**/*.css"
  - "frontend/**/*.json"
applyTo: "frontend/**/*.ts,frontend/**/*.tsx,frontend/**/*.css,frontend/**/*.json"
---

# React code style

Prefer the style of nearby files when it is more specific than this page. The rules below are
the baseline for new code. Comments follow the rule in [AGENTS.md](../AGENTS.md): short, and
only for what the code cannot say.

`npm run lint`, `npm test` and `npm run build` must pass. Prettier formats everything: run
`npm run format` instead of formatting by hand.

## TypeScript

- `strict` mode, `noImplicitOverride`, `noUncheckedIndexedAccess`,
  `noPropertyAccessFromIndexSignature`. No `any`; use `unknown` and narrow it.
- Types for API shapes (`ProcessCard`) in `<feature>.types.ts`, mirroring the back end's
  response records. Union string types for closed sets
  (`type ProcessType = 'iniziativa' | 'assemblea' | …`).
- Use the types React Router generates for each route (`import type { Route } from
  './+types/home'`) for loader data, action data and params.
- `readonly` arrays and properties for data that comes from the API.
- No barrel files (`index.ts`) inside features; import from the file. Named exports, except
  the default export a route module needs for its component.

## Components

- Function components and hooks only. One exported component per file, `PascalCase.tsx`.
- Route modules (`<page>.route.tsx`) load data and own the page. Presentational components in
  `shared/` receive props and call callbacks; they never import a feature's API module.
- Props are a named type (`type VoteButtonsProps = { … }`). No prop spreading onto DOM
  elements except in thin wrappers of one element.
- Keep render pure: no data fetching in `useEffect`. Reads go in the route `loader`, writes in
  the route `action`. Use `useEffect` only to synchronise with the browser (animations,
  focus), and say why in a comment when it isn't obvious.
- Derive state instead of copying it: compute from props and loader data during render; use
  `useMemo` only when a measurement shows it matters.
- Lists have stable `key`s from the data (ids), never the index.
- Show a pending state with `useNavigation()` / `useFetcher().state` and an error state with
  the route's `ErrorBoundary`.

## Data loading and the API

- Only `<feature>.api.ts` calls the back end, through the shared client in `core/api`. Loaders
  and actions call the API module; components never call `fetch`.
- The shared client forwards the incoming request's `Cookie` header, adds the CSRF header on
  state-changing requests, passes `Set-Cookie` back to the browser, and turns a
  `ProblemDetail` into a typed error carrying its `code`.
- A loader throws `data(null, { status: 404 })` for a missing resource, so the error boundary
  renders the 404 page with the right status.
- Never access `window`, `document` or `localStorage` during render: code that needs them runs
  in an effect or an event handler. Nothing personal in `localStorage` or `sessionStorage`.

## Forms

- `<Form method="post">` handled by the route's `action`, so the form works before hydration.
  Use `useFetcher()` for in-place actions (a vote, a support) that must not navigate.
- Every field has a visible `<label>` that wraps the control or uses `htmlFor`, as in the
  original. Field `name`s are the API's field names.
- The action returns the server's field codes (`{ errors: [{ field, code }] }`); the page shows
  each translated message next to the field it names. Client-side checks only with HTML
  attributes (`required`, `type="email"`, `maxLength`), as on the original.
- Buttons are real `<button>`s with a `type`. Disable a submit only while the request runs.

## Text and translations

- No user-visible text in components: every string is a translation key in
  `app/locales/it.json` and `en.json`, read with `useTranslation()`. Keys are English and
  grouped by feature (`initiative.signForm.submit`). The Italian text is copied **exactly**
  from the original. Use `<Trans>` for texts with links or markup.
- Process content (titles, descriptions, contributions) comes from the API in its own
  language and is never translated.
- Dates are shown as the original does: `dd/MM/yyyy` and `dd/MM/yyyy HH:mm`, with
  `Intl.DateTimeFormat` and the active locale, through one helper in `shared/`. Numbers with
  `Intl.NumberFormat`. Server and client must format the same way, or hydration fails.

## Styles

- Tailwind CSS v4 utilities in `className`, and the original's semantic classes (`btn`,
  `btn secondario`, `pillola`, `riquadro`, `meta`, `largo`, `stretto`, `tipo-iniziativa`…)
  defined once in the stylesheets with `@apply` or plain CSS. Keep the original's class
  names: they make the parity check readable.
- Design tokens (type colours, `inchiostro`, font) are CSS custom properties in `@theme`.
  No hard-coded colours in components, and no `style={…}`: the CSP has no `'unsafe-inline'`.
- Animations respect `prefers-reduced-motion` (the counters and reveal effects stop).
- Mobile first; check 375 px and 1280 px.

## Accessibility

- Semantic HTML first: `<main id="contenuto">`, `<nav aria-label>`, headings in order, lists
  for lists, `<dl>` for counters.
- Decorative SVGs have `aria-hidden="true"`; icon-only buttons have an accessible name.
- Focus is visible; route changes move focus to the main heading.
- Status messages use `role="status"`.
- `eslint-plugin-jsx-a11y` errors are fixed, not disabled.

## Tests

- Vitest + React Testing Library. Test components through the DOM: query by role, label and
  text (`getByRole('button', { name: … })`), interact with `user-event`. Don't assert on
  state, props passed to children or CSS classes.
- Route modules with `createRoutesStub`, or by calling `loader` / `action` with a `Request`
  and asserting the returned data and status.
- API modules with a stubbed `fetch`: assert the URL, method, headers and body, using the same
  JSON shapes as the back-end tests.
- Name tests after the behaviour: `it('shows the no-name prompt after the first login')`.
- Playwright tests live in `frontend/e2e/` and run axe on every visited page.

## Tooling

```bash
npm run format     # prettier --write
npm run lint       # eslint + prettier --check + react-router typegen + tsc
npm test           # vitest run
npm run build      # production SSR build
```
