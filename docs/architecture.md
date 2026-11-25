# Architecture

How the code is organised and why. Decisions taken with the user on 2026-11-25: a Java REST
API, a React front end, authentication with Keycloak, PostgreSQL with migrations, people
register before taking part, and the system must be modular and scale horizontally. A
decision marked *(assumption)* is a default the user can still change.

## Shape of the system

```
                         ┌─────────────── reverse proxy (TLS) ───────────────┐
 browser ──────────────► │ /**          → web (React Router SSR, Node)  ×N    │
                         │ /api/v1/**   → api (Spring Boot)              ×N    │
                         │ auth.<host>  → Keycloak                       ×N    │
                         └───────────────────────────────────────────────────┘
   web ── OIDC code flow (PKCE, confidential client) ──► Keycloak ──► its own PostgreSQL db
   web ── session id → tokens ──► Valkey (shared session store)
   web ── Authorization: Bearer <access token> ──► api ── JPA/Flyway ──► PostgreSQL (partecipa db)
                                                  api ── Admin API (service account) ──► Keycloak
```

- **Three deployables, all stateless or with shared state.** `api` keeps no session and no
  in-memory state, so any instance can serve any request. `web` keeps its sessions in Valkey,
  so any instance can serve any request. Keycloak runs as a cluster on its own database.
- **Backend for frontend (BFF).** The React Router server is the only OIDC client the browser
  deals with. It runs the login with Keycloak, keeps the access and refresh tokens in the
  server-side session, and calls the API with the access token. The browser holds one HttpOnly
  cookie with a session id and never sees a token.
- **The API is a product of its own.** Versioned under `/api/v1`, documented with OpenAPI,
  authenticated with JWT bearer tokens issued by Keycloak. The web front end is its first
  client; others (a mobile app, partners) can use it the same way.
- **The back end owns every rule.** Counting, permissions, consent, the lottery, deletion: all
  in Java services. The front end never decides who may see what; it renders what the API
  returns.
- **Server-side rendering.** Pages are rendered by route loaders on the server and hydrated,
  so embeds (`/embed/...`) are light, pages work before JavaScript loads, and the HTML is
  readable by tests and crawlers.

## Identity and accounts

- **Keycloak owns identity:** registration, email verification, passwords, password reset,
  brute-force protection, two-factor authentication for administrators. The app never sees or
  stores a password.
- **The app owns the profile:** the `account` table keyed by Keycloak's user id (`sub`),
  with display name, language and the user's data. An account row is created on the first
  authenticated API call (`GET /api/v1/me`), from the token's claims.
- **Roles:** the realm role `admin` (platform administrators). Organisation membership and
  per-organisation roles live in the app's database, not in Keycloak *(assumption)*: they
  are domain data with their own rules.
- **Deleting an account** deletes the app's data and then the Keycloak user, through the
  Keycloak Admin API with a service account limited to `manage-users`.

Details: [privacy-and-security.md](privacy-and-security.md), "Registration and login".

## Back end (`backend/`)

Java 25 (LTS), Spring Boot 4, Maven with the wrapper (`./mvnw`).

| Concern | Choice | Why |
|---|---|---|
| Web | Spring MVC, JSON with Jackson, `/api/v1` | standard, synchronous is enough; versioned because the API has more than one client |
| Security | Spring Security OAuth2 Resource Server (JWT), stateless, method security | tokens from Keycloak; no session means any instance serves any request |
| Modularity | Spring Modulith: one application module per feature, verified in a test *(assumption)* | enforced boundaries inside one deployable; a module can later become its own service |
| Communication between modules | direct calls to a module's API for queries; application events (`@ApplicationModuleListener`) with the JPA event publication registry for side effects | loose coupling, and events survive a crash |
| Persistence | Spring Data JPA (Hibernate), PostgreSQL, Flyway migrations | relational data with counts and constraints (one vote per person) |
| Keycloak admin | Keycloak Admin REST API through a small client in `account` *(assumption)* | account deletion and email lookups for exports |
| Validation | Jakarta Bean Validation on request records | errors become field codes for the front end |
| API docs | springdoc-openapi, `/api/v1/docs` in `dev` | the contract; the front end generates its types from it |
| Operations | Spring Boot Actuator: `health` (liveness, readiness), `info` | for load balancers and orchestrators |
| Tests | JUnit 5, AssertJ, Testcontainers (PostgreSQL, Keycloak), `spring-security-test` | real database and real tokens, no embedded substitutes |
| Quality | Spotless (google-java-format), Checkstyle, JaCoCo, Error Prone *(assumption)* | run by `./mvnw verify` and CI |

### Modules: by feature, not by layer

```
it.partecipa
├── PartecipaApplication.java
├── shared/          web errors (ProblemDetail), security config, clock, pagination (open module)
├── account/         profile linked to the Keycloak user, display name, export, deletion
├── organization/    organisations, membership, verification requests
├── process/         processes: common data, timeline phases, listing, home stats, embed
├── contribution/    proposals, statements, questions, recommendations, programme; comments
├── vote/            supports and agree/disagree/pass votes
├── initiative/      signatures, signer list, geography, export
├── assembly/        applications, strata, lottery, tables
├── electoral/       candidate and elected profiles, answers
├── event/           meetings and registrations
└── admin/           verification queue, export log
```

Each top-level package is a Spring Modulith application module. Its public API is the types
in the package root (a service, DTO records, events); everything in sub-packages
(`internal/`) is private to the module. A module never touches another module's entities or
repositories. `ApplicationModules.of(PartecipaApplication.class).verify()` runs in the test
suite and fails on a violation or a cycle.

Inside a module: `XController` (web, records `XRequest`/`XResponse`), `XService` (rules,
transactions), `X` (JPA entity), `XRepository`, and `XEvent` records it publishes.

### Scaling rules

- No state in memory between requests: no HTTP session, no local caches of mutable data, no
  files on local disk. Anything shared goes in PostgreSQL (or Valkey for the web sessions).
- Every list endpoint is paginated.
- Scheduled jobs must be safe with several instances running: one instance runs them,
  through a database lock (ShedLock) *(assumption)*.
- Long work (exports, emails) runs after the transaction commits, through module events.
- Add a cache only after a measurement shows the need, and say where it is invalidated.

## Front end (`frontend/`)

React (current major) with React Router in framework mode (Vite), TypeScript strict, SSR.

| Concern | Choice | Why |
|---|---|---|
| Framework | React Router framework mode, `ssr: true` | server rendering with route loaders and actions; also the natural home of the BFF |
| OIDC client | `openid-client` in the server code *(assumption)* | certified OIDC library; authorization code flow with PKCE as a confidential client |
| Sessions | React Router session storage backed by Valkey; the cookie holds only the session id | shared by every web instance; tokens stay on the server |
| Data | route `loader`s for reads, `action`s for writes; one `<feature>.api.ts` per feature calls the API | the URL drives the data; loaders run on the server |
| API types | generated from the API's OpenAPI document with `openapi-typescript` *(assumption)* | the contract is written once, in Java |
| Forms | `<Form method="post">` handled by the route's `action` | forms work before hydration; validation mirrors the API's field codes |
| State | no global store; the current user and the language come from the root loader | server data stays in loaders; nothing personal in `localStorage` |
| Styles | Tailwind CSS v4, design tokens in `@theme`, a small set of semantic component classes | consistent look without a component library |
| Fonts | self-hosted woff2 | no third-party requests |
| i18n | react-i18next with bundled `it` and `en` resources *(assumption)* | the language is chosen per session, not in the URL |
| Lint/format | ESLint (typescript-eslint, react-hooks, jsx-a11y), Prettier, `react-router typegen` + `tsc` | |
| Unit tests | Vitest + React Testing Library (jsdom), `createRoutesStub` | |
| End-to-end | Playwright + axe-core, against the full local stack | register, verify email in Mailpit, log in, use the app |

### Folders

```
frontend/app
├── root.tsx          document shell, root loader (current user, language), error boundary
├── routes.ts         route config: every URL → a route module
├── entry.server.tsx  server render: security headers, per-request CSP nonce
├── core/
│   ├── config.server.ts  environment variables, validated at first use
│   ├── security/     root middleware: per-request CSP nonce, security headers
│   ├── session/      session storage on Valkey (cookie holds only the signed id)
│   ├── auth/         (step 2) OIDC client, login/callback/logout routes, token refresh,
│   │                 requireUser(), Origin check on writes
│   ├── api/          API client (openapi-fetch: base URL, bearer token, ProblemDetail →
│   │                 ApiError), generated OpenAPI types in schema.ts
│   ├── i18n/         i18next per language, `meta` helpers, /lingua/:code
│   ├── health/       /healthz
│   └── layout/       header, footer, skip link, 404 and error page, focus on navigation
├── shared/           presentational UI: buttons, pills, cards, progress bar, vote buttons,
│                     timeline, counters, date and number formatting
├── styles/           Tailwind entry and design tokens
├── locales/          it.json, en.json
└── features/
    ├── home/              /, ?tipo= filter
    ├── process/           /o/:org/:slug shell: header, timeline, description, meetings, embed code
    ├── initiative/        signature form, signer list, geography
    ├── assembly/          application form, lottery record, recommendations
    ├── consultation/      statement voting
    ├── electoral/         profiles, questions, answers; /rappresentanti
    ├── contribution/      /c/:id, proposals list, comment thread
    ├── organization/      /o/:org
    ├── account/           /io: profile, my activity, export, deletion
    ├── management/        /gestione
    ├── static-pages/      /come-funziona, /privacy
    └── embed/             /embed/:org/:slug (no header, no footer)
```

Each feature has its route modules (`<page>.route.tsx`, exporting `loader`, `action`, `meta`
and the page component), its components, and one `<feature>.api.ts` that is the only place
calling the API for that feature. A feature never imports another feature's files; shared
code moves to `shared/` or `core/`. An ESLint rule (`import/no-restricted-paths`) enforces
this.

## Infrastructure (`infra/`)

Docker Compose for local development: PostgreSQL (two databases, `partecipa` and
`keycloak`), Keycloak with the `partecipa` realm imported from `infra/keycloak/`, Valkey,
and Mailpit to catch e-mails. The API and the web server run on the host, from the IDE or the
command line. Details and the production topology: [infrastructure.md](infrastructure.md).

## Configuration

- Back end: `application.yml` plus `application-dev.yml`; values bound to
  `@ConfigurationProperties` records with a comment on where each value came from. The issuer
  URI, the expected audience and the Keycloak admin client come from environment variables.
  Secrets only from environment variables.
- Front end (server only): `PUBLIC_ORIGIN`, `API_ORIGIN`, `OIDC_ISSUER`, `OIDC_CLIENT_ID`,
  `OIDC_CLIENT_SECRET`, `SESSION_SECRET`, `VALKEY_URL`, `PORT`. In `dev` they come from
  `frontend/.env` (git-ignored), created from `frontend/.env.example` and loaded by
  `core/config.server.ts` (it never overrides variables already set). Nothing secret reaches
  the browser bundle.

## Language and server rendering

- The language lives in the web session (`/lingua/:code` stores it and redirects back to the
  `Referer`'s path). For a logged-in person it is also saved on the account, for e-mails. The
  login redirect passes it to Keycloak as `ui_locales`, so Keycloak's pages match.
- Translations are bundled with the app (`app/locales/*.json`), so the server render has them
  at once. The server creates one i18next instance per request.
- Every page is rendered per request, never prerendered. A catch-all route answers unknown
  URLs with the 404 page and status 404.
- A root middleware (`core/security/security.server.ts`) creates a per-request CSP nonce and
  sets the security headers on every response, resource routes included. `entry.server.tsx`
  reads the nonce from the router context and passes it to `renderToPipeableStream`,
  `<ServerRouter>`, `<Scripts>` and `<ScrollRestoration>`. Under `npm run dev` the policy
  allows inline scripts and styles for Vite's hot reload; the production build is strict.

## Build order

Each step is one `feature` task (and one GitHub issue). Mark a step done here when it is
merged.

1. **Scaffold** *(built on branch `feature/scaffold`, 2026-11-25; mark done when merged)* —
   `infra/compose.yaml` with PostgreSQL, Keycloak (dev realm: registration
   with email verification, clients `partecipa-web` and `partecipa-api-admin`, role `admin`),
   Valkey and Mailpit; `backend/` with Spring Boot, Spring Modulith, resource server, Flyway,
   Testcontainers and the module verification test; `frontend/` with React Router SSR,
   Tailwind, i18n, the API client and generated types; CI green; layout shell, `it`/`en`
   switch, static pages `/come-funziona` and `/privacy`.
2. **Accounts** — registration and login through Keycloak (BFF: login, callback, logout,
   sessions in Valkey, token refresh), account provisioning on the first call, display name,
   `/io`, data export, account deletion including the Keycloak user, admin role with
   two-factor authentication.
3. **Processes, read-only** — data model, dev seed with demo data
   (`backend/src/main/resources/db/seed-dev`, loaded only by the `dev` profile), home page
   with stats and filters, organisation page, public process list.
4. **Process page** — timeline, description, contributions with support votes, comments with
   position, meetings with registration and capacity, embed page and code.
5. **Popular initiative** — signature form with consents, public signer list, geography.
6. **Consultation** — agree / disagree / pass, percentages, new statements.
7. **Candidates and elected** — profiles, questions and support, answers, `/rappresentanti`.
8. **Citizens' assembly** — application with strata, public lottery with seed and reserves,
   tables, recommendations written and voted by members only.
9. **Management** — organisation request and verification, process creation and moderation,
   exports with the export log.
10. **Keycloak theme** — login, registration and e-mail pages in Partecipa's look and texts,
    in Italian and English (Keycloakify, which builds themes with React, is the candidate).

## Rejected alternatives

- **Single-page app holding the tokens (keycloak-js)** — no server rendering for embeds, and
  tokens readable by any script on the page. The BFF keeps them on the server.
- **Stateful API with a server session** — needs sticky sessions or session replication to
  scale; a JWT resource server doesn't.
- **Microservices from the start** — more deployables, network calls and data consistency
  problems before there is load to justify them. Spring Modulith keeps the boundaries, so a
  module can be extracted later.
- **Our own login (magic link or passwords in the app)** — the user chose Keycloak:
  registration, verification, reset, brute-force protection and two-factor authentication
  come ready and audited.
- **Organisation roles as Keycloak groups** *(assumption)* — they are domain data with
  verification and audit rules; keeping them in the app's database keeps those rules in one
  place.
- **Next.js** — React Server Components and server actions would add a second place for
  rules next to Spring Boot. React Router's loaders and actions are a thin layer.
- **Embedded PostgreSQL or H2 for tests** — differences surface only in production; with
  Docker, Testcontainers runs the same PostgreSQL and Keycloak images as production.

## Open questions

- Hosting (a PaaS, Kubernetes, VMs) and the reverse proxy? EU hosting is likely required by
  the privacy page. — the user
- Managed Keycloak or self-hosted? — the user
- Should people also log in with a social or public identity provider (SPID/CIE through
  Keycloak)? — the user
