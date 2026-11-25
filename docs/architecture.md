# Architecture

How the code is organised and why. The back-end decisions were taken on 2026-11-18 for the
Angular rewrite (`frastag/partecipa-prototipo`) and carried over; the front end was switched to
React on 2026-11-25, when this repository started. A decision marked *(assumption)* is a
default the user can still change.

## Shape of the system

```
                 ┌──────────────────────── same origin (reverse proxy) ─────────────────────────┐
 browser ──────► │  /**  → React Router SSR server (Node)     /api/**, /io/dati.json → Spring Boot │
                 └──────────────────────────────────────────────────────────────────────────────┘
                     │ loaders render HTML, then hydrate           │ REST + JSON, session, CSRF
                     └── loaders/actions call /api/** with the ───►│ services → JPA → PostgreSQL
                         user's cookie
```

- **One origin.** The browser sees a single site, as in the original. The proxy (in `dev`,
  Vite's `server.proxy` in `vite.config.ts`) sends `/api/**`, `/io/dati.json` and `/lingua/**`
  to Spring Boot and everything else to React Router. One origin keeps the session cookie
  `SameSite=Lax` and the CSP `default-src 'self'` working without CORS.
- **Server-side rendering.** The original works without JavaScript and is embedded in other
  sites by `<iframe>`. React Router in framework mode renders every page on the server and
  hydrates it, which gives the same first paint, makes the embed pages light, and lets the
  `parity-check` skill compare real HTML. Route loaders run on the server and forward the
  incoming `Cookie` header to the API, so logged-in pages render correctly.
- **The back end owns every rule.** Counting, permissions, consent, the lottery, deletion: all
  in Java services. The front end never decides who may see what; it renders what the API
  returns.

## Back end (`backend/`)

Java 25 (LTS), Spring Boot 4, Maven with the wrapper (`./mvnw`).

| Concern | Choice | Why |
|---|---|---|
| Web | Spring MVC, JSON with Jackson | standard, synchronous is enough for this load |
| Security | Spring Security: session cookie, CSRF token, method security | the original uses a session cookie and a CSRF token on every form |
| Persistence | Spring Data JPA (Hibernate), PostgreSQL, Flyway migrations | relational data with counts and constraints (one vote per person) |
| Local DB and tests | embedded PostgreSQL (zonky `embedded-postgres`) *(assumption)* | real PostgreSQL without Docker, which this machine doesn't have |
| Validation | Jakarta Bean Validation on request records | errors become field codes for the front end |
| Mail | Spring Mail; `dev` logs the link and the page shows it | as the original's demo |
| API docs | springdoc-openapi, `/api/docs` in `dev` only | the contract the front end follows |
| Quality | Spotless (google-java-format), Checkstyle, ArchUnit, JaCoCo, Error Prone *(assumption)* | run by `./mvnw verify` and CI |

### Packages: by feature, not by layer

```
it.partecipa
├── PartecipaApplication.java
├── shared/          web errors (ProblemDetail), security config, clock, i18n codes, pagination
├── account/         users, magic link, session, profile name, data export, deletion
├── organization/    organisations, membership, verification requests
├── process/         percorsi: common data, timeline phases, listing, home stats, embed
├── contribution/    proposte, affermazioni, domande, raccomandazioni, programma; comments
├── vote/            supports ("sostengo") and agree/disagree/pass votes
├── initiative/      signatures (sottoscrizioni), signer list, geography, export
├── assembly/        applications (candidature), strata, lottery, tables
├── electoral/       candidate and elected profiles, answers
├── event/           incontri and registrations
└── admin/           admin password login, verification queue, export log
```

Inside a feature: `XController` (web, DTO records `XRequest`/`XResponse`), `XService`
(rules, transactions), `X` (JPA entity), `XRepository`. A feature calls another feature only
through its service, never its repository or entity internals. ArchUnit tests enforce this and
the rule that `shared` depends on no feature.

## Front end (`frontend/`)

React (current major) with React Router in framework mode (Vite), TypeScript strict, SSR.

| Concern | Choice | Why |
|---|---|---|
| Framework | React Router framework mode, `ssr: true` *(assumption)* | server rendering with route loaders and actions, no second back end; `<Form>` posts work without JavaScript, like the original's HTML forms |
| Components | function components and hooks only | |
| Data | route `loader`s for reads, route `action`s for writes; one `<feature>.api.ts` per feature calls the back end | the URL drives the data, as on the original; loaders run on the server during SSR |
| Forms | React Router `<Form method="post">` handled by the route's `action`; HTML validation attributes on the client | validation mirrors the back end's field codes, and forms work before hydration |
| State | no global store; the current user and the language come from the root loader | server data stays in loaders; nothing personal in `localStorage` |
| Styles | Tailwind CSS v4 + the original's component classes (`btn`, `pillola`, `riquadro`, `tipo-*`) | the original is built with Tailwind v4: same tokens, same look |
| Font | Inter and Bricolage Grotesque, self-hosted woff2 | no third-party requests |
| i18n | react-i18next with bundled `it` and `en` resources *(assumption)* | the original switches language on the same URL (`/lingua/en`), so the language is runtime, not in the URL |
| Lint/format | ESLint (typescript-eslint, react-hooks, jsx-a11y), Prettier, `react-router typegen` + `tsc` | |
| Unit tests | Vitest + React Testing Library (jsdom), `createRoutesStub` for routes | |
| End-to-end | Playwright + axe-core | flows and accessibility at phone and desktop width |

### Folders

```
frontend/app
├── root.tsx        document shell, root loader (current user, language), error boundary (404)
├── routes.ts       route config: every URL of the original → a route module
├── entry.server.tsx  server render: security headers, per-request CSP nonce
├── core/           layout (header, footer, demo banner, skip link), API client (cookie
│                   forwarding, CSRF header, ProblemDetail → error code), i18n setup
├── shared/         presentational UI: buttons, pills, cards, progress bar, vote buttons,
│                   timeline, counters (data-conta animation), reveal-on-scroll hook
├── styles/         Tailwind entry, design tokens, the original's extracted CSS
├── locales/        it.json, en.json
└── features/
    ├── home/              /, ?tipo= filter
    ├── process/           /o/:org/:slug shell: header, timeline, description, meetings, embed code
    ├── initiative/        signature form, signer list, geography
    ├── assembly/          application form, lottery record, recommendations
    ├── consultation/      statement voting
    ├── electoral/         profiles, questions, answers; /rappresentanti
    ├── contribution/      /c/:id, proposals list, comment thread
    ├── organization/      /o/:org
    ├── account/           /entra, /entra/:token, /io
    ├── management/        /gestione
    ├── static-pages/      /come-funziona, /privacy
    └── embed/             /embed/:org/:slug (no header, no footer)
```

Each feature has its route modules (`<page>.route.tsx`, exporting `loader`, `action`, `meta`
and the page component), its components, one `<feature>.api.ts` that is the only place calling
the back end for that feature, and `<feature>.types.ts` with TypeScript types that mirror the
API's response records. Every route is listed in `app/routes.ts`.

## Configuration

- Back end: `application.yml` plus `application-dev.yml`; values bound to
  `@ConfigurationProperties` records (e.g. `MagicLinkProperties(Duration validity)` with
  `validity: 20m`, "from the original's login page"). Secrets only from environment variables.
- Front end: no per-deployment values in the bundle. Anything that varies per deployment
  comes from the API. The SSR server reads `PARTECIPA_API_ORIGIN` (where loaders and actions
  call Spring Boot, default `http://localhost:8080`) and `PORT` (default 3000). In `dev`,
  Vite's `server.allowedHosts` allows only `localhost`.

## Language and server rendering

- The language lives in the server session (`shared/i18n`, `GET /lingua/{code}`), as on the
  original. The root loader reads `GET /api/language` with the visitor's `Cookie` header and
  the root component sets `<html lang>` and the i18next language. Switching is a plain link
  to `/lingua/<code>`, so it is a full page load.
- Translations are bundled with the app (`app/locales/*.json`), not fetched, so the server
  render has them at once. The server creates one i18next instance per request.
- Every page is rendered per request, never prerendered, because the language depends on the
  session. A catch-all route answers unknown URLs with the 404 page and status 404.
- `entry.server.tsx` sets the security headers on every response and a per-request CSP nonce,
  passed to `renderToPipeableStream`, `<Scripts>` and `<ScrollRestoration>`.
- The original's CSS is kept in `app/styles/original-*.css`, extracted verbatim from its
  `static/style.css` (base, components, global rules). `app/styles/app.css` holds the Tailwind
  import and the design tokens. Don't hand-edit the extracted files: re-extract them from a
  fresh snapshot.

## Build order

The original's features, in the order we build them. Each is one `feature` task (and one
GitHub issue). Mark a step done here when it is merged.

1. **Scaffold** — `backend/` and `frontend/` projects, CI green, layout shell (demo banner,
   header, footer, skip link), `it`/`en` switch, static pages `/come-funziona` and `/privacy`.
2. **Processes, read-only** — data model, dev seed with the original's demo data
   (`backend/src/main/resources/db/seed-dev`, loaded only by the `dev` profile), home page
   with stats and filters, organisation page, `/api/processi`.
3. **Account** — magic link login with POST confirmation, display name, `/io`, data export,
   account deletion, admin password login.
4. **Process page** — timeline, description, contributions with support votes, comments with
   position, meetings with registration and capacity, embed page and code.
5. **Popular initiative** — signature form with consents, public signer list, geography.
6. **Consultation** — agree / disagree / pass, percentages, new statements.
7. **Candidates and elected** — profiles, questions and support, answers, `/rappresentanti`.
8. **Citizens' assembly** — application with strata, public lottery with seed and reserves,
   tables, recommendations written and voted by members only.
9. **Management** — organisation request and verification, process creation and moderation,
   exports with the export log.

The Angular rewrite (`frastag/partecipa-prototipo`) built steps 1 and 2. Its back end and its
task folders are a useful reference for those steps; its front end is not.

## Rejected alternatives

- **Spring MVC with Thymeleaf instead of a JavaScript front end** — closest to the original,
  but the user asked for a separate front end.
- **Angular** — used for the prototype rewrite; the user chose React for this project.
- **React single-page app without SSR (Vite only)** — empty HTML for embeds and for the parity
  check, and a blank page without JavaScript.
- **Next.js** *(assumption)* — also server-rendered, but React Server Components and server
  actions would add a second place for rules next to Spring Boot. React Router's loaders and
  actions map one-to-one to the original's pages and forms.
- **Layered packages (`controller/`, `service/`, `repository/`)** — every feature change
  touches four folders, and boundaries between features can't be enforced.
- **H2 in PostgreSQL mode for tests** — differences in SQL and constraints surface only in
  production.

## Open questions

- Must forms work **without JavaScript**, as in the original? React Router's `<Form>` and
  actions make it possible: the browser posts to the SSR server, whose action calls the API.
  Decide in the account step whether every form must work this way. — the user
- Hosting and the reverse proxy (nginx, Caddy, a PaaS)? EU hosting is a stated requirement of
  the original's privacy page. — the user
