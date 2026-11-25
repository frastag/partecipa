# Agent Instructions — partecipa

Partecipa is a civic participation platform: people sign and amend **popular initiatives**,
apply to **citizens' assemblies selected by lot**, vote on **consultations** one statement at a
time, and put public questions to **candidates and elected representatives**. Organisations
(associations, committees, parties, institutions) ask for a space, are verified, and run these
processes (*percorsi*).

The system is a **Java (Spring Boot) REST API**, a **React** web front end (React Router,
server-side rendered, acting as backend for frontend), **Keycloak** for registration and
login, and **PostgreSQL** with Flyway migrations. It is modular (Spring Modulith modules, one
folder per feature in the front end) and scales horizontally (stateless API, shared session
store). The prototype at <https://prototipo.michelangelogigli.it/> is inspiration only; this
repository's docs are the specification.

## Start here: documentation

Before any non-trivial task, read [docs/README.md](docs/README.md). It is short, and its
**"Routing by task"** section points to the one topic doc for your task. Commands are in the
[README](README.md), and machine setup is in [SETUP.md](SETUP.md).

The docs describe behaviour; the code is the ground truth for details. **When you change
behaviour, a route or a setting, update the affected doc in the same change.** While a
feature is not built yet, its doc section says "not built yet": keep that marker accurate.

Measured facts about the development machine and the original prototype live in
[.agents/knowledge/](.agents/knowledge/README.md). Read its editing rules before changing a
page. When a session establishes or disproves one of these facts, update the page in the same
session.

Where things go (details in [docs/architecture.md](docs/architecture.md)):

- `backend/`: Spring Boot, one Maven module, one Spring Modulith application module per
  feature (`it.partecipa.<feature>`), not packages by layer. Controllers are thin; rules live
  in services. Modules talk through their public API or events, never through each other's
  entities or repositories.
- `frontend/`: React Router in framework mode, one folder per feature under
  `app/features/`. Login, sessions and tokens live only in `app/core/auth/` (server code).
  Calls to the API go only through the feature's `<feature>.api.ts`, from route loaders and
  actions.
- `infra/`: Docker Compose for PostgreSQL, Keycloak (realm as code), Valkey and Mailpit.
- The REST contract is described in [docs/routes.md](docs/routes.md) and served as OpenAPI;
  the front end generates its types from it.
- Tunable values go in `application.yml` bound to a `@ConfigurationProperties` record, with a
  short comment on where the value came from. No magic numbers in services.
- Text the end user sees lives only in the front end's translation files (`it`, `en`), never
  in Java code. The API returns error **codes**; the front end maps them to text.
- Database changes are new Flyway migrations. Never edit a migration that has been merged.

## Code style

**Before you write or change code, read the style page for that language:**

- Java: [docs/code-style-java.md](docs/code-style-java.md)
- React / TypeScript / TSX / CSS: [docs/code-style-react.md](docs/code-style-react.md)

Their frontmatter (`paths` for Claude Code, `applyTo` for Copilot) lets tools that support it
load them automatically. Other tools must read them explicitly.

## The original prototype

The prototype is a live demo with sample data, useful for ideas on pages, texts and rules. What
was observed is in [.agents/knowledge/original-site.md](.agents/knowledge/original-site.md),
and a page snapshot lives in `tmp/original-snapshot/` (git-ignored).

- It is not a specification: when it and our docs disagree, our docs win. Mention an idea
  from it to the user; don't copy behaviour silently.
- **Read-only towards it.** GET requests only. Never submit its forms: it writes data on
  someone else's server.
- Don't copy its sample data (names, cities, numbers) into production code. Demo data goes
  only in the dev seed.

## Running

There is no global `mvn` or React Router CLI: use the Maven wrapper and the npm scripts. The
local stack needs Docker (see [docs/infrastructure.md](docs/infrastructure.md)).

```bash
docker compose -f infra/compose.yaml up -d       # PostgreSQL, Keycloak, Valkey, Mailpit
cd backend && ./mvnw verify                      # tests (Testcontainers) + checks
cd backend && ./mvnw spring-boot:run             # API on http://localhost:8080/api/v1 (profile dev)
cd frontend && npm ci                            # once, and after package-lock changes
cd frontend && npm run lint && npm test && npm run build
cd frontend && npm run dev                       # http://localhost:5173
```

- Keycloak is on http://localhost:8180 and Mailpit (verification e-mails) on
  http://localhost:8025.
- Until `backend/`, `frontend/` and `infra/` exist, these commands fail: the first feature
  scaffolds them (see [docs/architecture.md](docs/architecture.md), "Build order").
- Long-running servers: start them in the background and stop them when done. **Never kill
  processes you did not start**: the user may be running the app in the IDE.
- Never run `docker compose down -v` or delete volumes unless the user asks: it wipes the
  databases and every registered user.

## Skills

Agent skills live in `.agents/skills/<name>/SKILL.md` and are tool-neutral:

- `session`: task folders in `tmp/<task>/` with a `handover.md` that survives across sessions;
- `feature`: from a request to an agreed plan, then step-by-step implementation in a worktree,
  with progress tracked in `tmp/<task>/plan.md`;
- `privacy-check`: review a change that touches personal data or authentication against the
  rules;
- `parity-check`: compare a page of our app with the original prototype, only when the user
  asks for it.

Claude Code finds them through relative symlinks: `.claude/skills/<name>` points to
`../../.agents/skills/<name>`. Add a symlink when you add a skill. A skill's `description` is
loaded in every session, so it only says when to use the skill and when not to. Steps belong
in the skill text.

Task artifacts (notes, screenshots, helper scripts) go in `tmp/`, which is git-ignored, never
in `backend/`, `frontend/` or `infra/`.

## Verifying changes

Always run the quality gates of the side you changed, and both if you changed the contract:

- back end: `./mvnw verify` (tests with Testcontainers, module verification, Spotless,
  Checkstyle, JaCoCo threshold). Docker must be running;
- front end: `npm run lint` (ESLint, Prettier check, type check), `npm test`, `npm run build`.

Add or update tests for any logic you change (see [docs/testing.md](docs/testing.md)). Then,
depending on the change:

- **A page, a text or a layout:** look at it in a browser at phone and desktop width, in
  Italian and English. Say what you did not look at.
- **Anything that touches personal data, login, tokens, sessions or roles:** use the
  `privacy-check` skill.
- **The lottery (sorteggio):** the determinism test must pass, and a draw re-run from the
  published seed and list must give the same result.
- **A REST endpoint:** a controller slice test (`@WebMvcTest` with `jwt()`) for status codes,
  JSON and the forbidden case, regenerated front-end types, and the front-end API module test
  against the same JSON.
- **The Keycloak realm:** re-import it on a fresh stack and go through registration, email
  verification and login once.

## Behaviour that must not regress

- **Registration before participation.** Anyone can read public pages; signing, voting,
  applying, commenting and proposing need a registered account with a verified email.
- **Credentials belong to Keycloak.** The app never receives, stores or logs a password.
  Administrators use two-factor authentication.
- **Tokens never reach the browser.** The web server keeps them in the shared session store;
  the browser has one HttpOnly session cookie on the app's origin.
- **The API is stateless.** No HTTP session, no in-memory state between requests: any
  instance serves any request. Every non-public endpoint rejects a missing, expired or
  foreign token.
- **Privacy by default.** Public pages show people as first name and initial ("Laura G.").
  A signer's full name and city appear publicly only if they ticked "Mostra il mio nome".
  Organisations see a signer's email only with the consent box ticked. Assembly applicants are
  anonymous to the organisation until the draw; afterwards only selected people and reserves.
  Every export is logged.
- **The user's rights work immediately.** `/io/dati.json` exports all of a user's data.
  Deleting the account removes signatures, votes, applications and event registrations at once,
  keeps proposals and comments without the name, and deletes the Keycloak user.
- **The lottery is public and reproducible.** A stratified draw from a published seed, an
  anonymous list and a published algorithm. Anyone can re-run it and get the same members and
  reserves. No randomness without a recorded seed.
- **One vote per person per item**, changeable. Counts shown equal the stored votes.
- **Organisations go online only after verification** by an administrator.
- **Signing here is not a legal signature.** Where the law requires SPID/CIE, the page links to
  the public platform and says so.
- **No tracking.** No analytics, no third-party scripts or fonts at runtime. Security headers
  as in [docs/privacy-and-security.md](docs/privacy-and-security.md) (CSP `default-src
  'self'`, `frame-ancestors 'none'` except on `/embed/*`, `nosniff`, `same-origin` referrer).
- **The site works for everyone.** Keyboard navigation, the "Vai al contenuto" skip link,
  labels on every field, `prefers-reduced-motion` respected, WCAG 2.1 AA contrast.

## GitHub

The repository is `frastag/partecipa` (default branch `main`). Feature requests are GitHub
issues created with the "New feature" template (`.github/ISSUE_TEMPLATE/feature.md`, label
`enhancement`). The `feature` skill reads them.

- If an issue command fails with `Could not resolve to a Repository`, the `gh` token can't see
  this repository: tell the user that the token must be extended to it. Don't work around it.
- Reading is always fine: `gh issue view <n> --json title,body,comments`, `gh issue list`,
  `gh pr view`. Plain `gh issue view` prints nothing without a terminal: use `--json`.
- Creating, editing, commenting on or closing issues and PRs is visible to others. Do it only
  when the user asks or confirms in this conversation.

## Git

Do not commit, amend, push or create PRs unless explicitly asked. Read-only git commands
(`status`, `diff`, `log`) are always fine. Never commit `tmp/`, `node_modules/`, `target/`,
`build/`, `.react-router/` or `.env` files.

For features and other multi-step changes, create a worktree next to the main checkout, so the
user can open it in the IDE and commit from there. Don't use the harness's built-in worktree
feature, because it puts the worktree in a hidden folder.

```bash
git fetch origin
git worktree add --no-track -b <branch> ../partecipa-<branch-slug> origin/main
```

- `<branch-slug>` is the branch name with `/` replaced by `-`
  (`feature/firma-iniziativa` → `../partecipa-feature-firma-iniziativa`).
- The worktree starts from `origin/main`. Uncommitted or unpushed work in the main checkout is
  not in it. If the task depends on such work, ask the user first (or branch from the local
  branch).
- Each worktree has its own `frontend/node_modules` and `frontend/.env`: run `npm ci` there
  once and copy `.env` from `.env.example`. The Maven repository (`~/.m2`) and the Docker
  stack are shared by all worktrees.
- Task folders stay in the main checkout's `tmp/`, never in the worktree, because removing a
  worktree deletes its git-ignored files.
- Remove a worktree with `git worktree remove <path>`, never with `--force` unasked.

## Writing for the user

- **Always reply in English**, even when the user writes in Italian.
- Put the answer first, in two or three sentences. Details and tables come after, and only
  where they help.
- Never label findings or options with codes (S1, Q2, option B′). Use short descriptive names.
- Use the project's English domain words: process, initiative, signature, assembly, lottery,
  application, consultation, statement, contribution, proposal, organisation, meeting. The
  glossary in [docs/domain.md](docs/domain.md) maps them to the Italian UI terms; quote the
  Italian term only when you refer to a UI text or a URL. Don't use undefined acronyms.
- Say what you verified and how (tests, browser), and what you did not test.

## Conventions

- **Everything in the repository and everything agents write is in English**: code,
  identifiers, API paths and JSON fields, comments, docs, skills, knowledge pages, task
  folders, issue and PR templates and texts, logs and commit messages. Domain classes use the
  English names from the glossary in [docs/domain.md](docs/domain.md).
- **The only exception is what the end user reads**: in Italian, with an English translation
  (UI labels, messages, e-mails, error texts, in the front end's translation files and the
  Keycloak theme). Page URLs are Italian (`/o/<org>/<slug>`, `/io`, `/gestione`).
- Comments are short and only where the code can't say it: a business rule, a privacy
  constraint, a tuned value and where it came from.
- Dependencies are declared only in `backend/pom.xml` and `frontend/package.json`, with exact
  versions committed in the lockfiles, and container images with pinned versions in
  `infra/compose.yaml`. Add a dependency only when the platform can't do it.
