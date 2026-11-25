# Agent Instructions — partecipa

Partecipa is a civic participation platform: people sign and amend **popular initiatives**,
apply to **citizens' assemblies selected by lot**, vote on **consultations** one statement at a
time, and put public questions to **candidates and elected representatives**. Organisations
(associations, committees, parties, institutions) ask for a space, are verified, and run these
processes (*percorsi*).

This repository is the definitive rewrite of the prototype at
<https://prototipo.michelangelogigli.it/>, with a **React** front end and a **Java (Spring
Boot)** back end. The goal is functional and visual parity with the original: same pages, same
URLs, same texts, same rules on personal data. The original is the reference for behaviour;
this repository's docs are the reference for how we build it.

## Start here: documentation

Before any non-trivial task, read [docs/README.md](docs/README.md). It is short, and its
**"Routing by task"** section points to the one topic doc for your task. Commands are in the
[README](README.md), and machine setup is in [SETUP.md](SETUP.md).

The docs describe behaviour; the code is the ground truth for details. **When you change
behaviour, a route or a setting, update the affected doc in the same change.** While a feature
of the original is not built yet, its doc section says "not built yet": keep that marker
accurate.

Measured facts about the original site and the development machine live in
[.agents/knowledge/](.agents/knowledge/README.md). Read its editing rules before changing a
page. When a session establishes or disproves one of these facts, update the page in the same
session.

Where things go in the code (details in [docs/architecture.md](docs/architecture.md)):

- `backend/`: Spring Boot, one Maven module, packages by feature
  (`it.partecipa.<feature>`), not by layer. Controllers are thin; rules live in services.
- `frontend/`: React with React Router in framework mode (server-side rendering), one folder
  per feature under `app/features/`. Calls to the back end go only through the feature's
  `<feature>.api.ts`, from route loaders and actions.
- The REST contract between them is described in [docs/routes.md](docs/routes.md). The public
  JSON API (`/api/processi`, `/io/dati.json`) keeps the original's Italian field names.
- Tunable values go in `application.yml` bound to a `@ConfigurationProperties` record, with a
  short comment on where the value came from. No magic numbers in services.
- Text the end user sees lives only in the front end's translation files (`it`, `en`), never
  in Java code. The back end returns error **codes**; the front end maps them to text.
- Database changes are new Flyway migrations. Never edit a migration that has been merged.

## Code style

**Before you write or change code, read the style page for that language:**

- Java: [docs/code-style-java.md](docs/code-style-java.md)
- React / TypeScript / TSX / CSS: [docs/code-style-react.md](docs/code-style-react.md)

Their frontmatter (`paths` for Claude Code, `applyTo` for Copilot) lets tools that support it
load them automatically. Other tools must read them explicitly.

## The original site

The original is a live demo with sample data. Its route map, forms, texts and rules are in
[.agents/knowledge/original-site.md](.agents/knowledge/original-site.md), and a page snapshot
lives in `tmp/original-snapshot/` (git-ignored, refreshed with the `parity-check` skill).

- **Read-only towards the original.** Crawl it with GET requests only. Never submit its forms
  (sign, vote, comment, apply, create an organisation, delete the account) unless the user
  asks for that specific action in this conversation: it writes data on someone else's server.
- Logging in needs an email. Take it from the `PARTECIPA_EMAIL` environment variable or ask
  the user; never write an email address into the repository. The demo shows the magic link
  on the page instead of sending it.
- Don't copy the original's sample data (names, cities, numbers) into production code. Demo
  data goes only in the dev seed migration, as in the original.
- When the original and our docs disagree, the original wins for behaviour and text. Report
  the difference and update the doc.

## Running

There is no global `mvn` or React Router CLI: use the Maven wrapper and the npm scripts. Docker
is not installed (see [.agents/knowledge/toolchain.md](.agents/knowledge/toolchain.md)).

```bash
cd backend && ./mvnw verify                      # compile, unit + integration tests, checks
cd backend && ./mvnw spring-boot:run             # API on http://localhost:8080 (profile dev)
cd frontend && npm ci                            # once, and after package-lock changes
cd frontend && npm run lint && npm test && npm run build
cd frontend && npm run dev                       # http://localhost:5173, proxies /api to 8080
cd frontend && npm run build && npm start        # production SSR server on http://localhost:3000
```

- The `dev` profile uses an embedded database seeded with the demo data, and shows the magic
  link on the page instead of sending an email, as the original does.
- Until `backend/` and `frontend/` exist, these commands fail: the first feature scaffolds
  them (see [docs/architecture.md](docs/architecture.md), "Build order").
- Long-running servers: start them in the background and stop them when done. **Never kill
  processes you did not start**: the user may be running the app in the IDE.

## Skills

Agent skills live in `.agents/skills/<name>/SKILL.md` and are tool-neutral:

- `session`: task folders in `tmp/<task>/` with a `handover.md` that survives across sessions;
- `feature`: from a request to an agreed plan, then step-by-step implementation in a worktree,
  with progress tracked in `tmp/<task>/plan.md`;
- `parity-check`: compare a page of our app with the same page of the original site;
- `privacy-check`: review a change that touches personal data against the privacy rules.

Claude Code finds them through relative symlinks: `.claude/skills/<name>` points to
`../../.agents/skills/<name>`. Add a symlink when you add a skill. A skill's `description` is
loaded in every session, so it only says when to use the skill and when not to. Steps belong
in the skill text.

Task artifacts (snapshots, parity diffs, helper scripts, notes) go in `tmp/`, which is
git-ignored, never in `backend/` or `frontend/`.

## Verifying changes

Always run the quality gates of the side you changed, and both if you changed the contract:

- back end: `./mvnw verify` (tests, Spotless formatting, Checkstyle, JaCoCo threshold);
- front end: `npm run lint` (ESLint, Prettier check, type check), `npm test`, `npm run build`.

Add or update tests for any logic you change (see [docs/testing.md](docs/testing.md)). Then,
depending on the change:

- **A page, a text or a layout:** use the `parity-check` skill on that page, and look at it in
  a browser at phone and desktop width. Say what you did not look at.
- **Anything that stores, shows, exports or deletes personal data:** use the `privacy-check`
  skill.
- **The lottery (sorteggio):** the determinism test must pass, and a draw re-run from the
  published seed and list must give the same result.
- **A REST endpoint:** a controller slice test (`@WebMvcTest`) for status codes and JSON, and
  the front-end API module test against the same JSON.

## Behaviour that must not regress

- **No passwords for people.** Login is a magic link valid 20 minutes, usable once, confirmed
  with a POST (so that mail scanners opening the link don't log anyone in). The first login
  creates the account and asks for a display name. Only administrators have a password login.
- **Privacy by default.** Public pages show people as first name and initial ("Laura G.").
  A signer's full name and city appear publicly only if they ticked "Mostra il mio nome".
  Organisations see a signer's email only with the consent box ticked. Assembly applicants are
  anonymous to the organisation until the draw; afterwards only selected people and reserves.
  Every export is logged.
- **The user's rights work immediately.** `/io/dati.json` exports all of a user's data.
  Deleting the account removes signatures, votes, applications and event registrations at once;
  proposals and comments stay, without the name.
- **The lottery is public and reproducible.** A stratified draw from a published seed, an
  anonymous list and a published algorithm. Anyone can re-run it and get the same members and
  reserves. No randomness without a recorded seed.
- **One vote per person per item**, changeable. Counts shown equal the stored votes.
- **Organisations go online only after verification** by an administrator.
- **Signing here is not a legal signature.** Where the law requires SPID/CIE, the page links to
  the public platform and says so.
- **No tracking.** No analytics, no third-party scripts or fonts at runtime, no cookie other
  than the session. Security headers match the original (CSP `default-src 'self'`,
  `frame-ancestors 'none'` except on `/embed/*`, `nosniff`, `same-origin` referrer).
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
`build/` or `.react-router/`.

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
- Each worktree has its own `frontend/node_modules`: run `npm ci` there once. The Maven
  repository (`~/.m2`) is shared, so the back end needs no extra download.
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
  glossary in [docs/domain.md](docs/domain.md) maps them to the original's Italian terms;
  quote the Italian term only when you refer to a UI text or a URL. Don't use undefined
  acronyms.
- Say what you verified and how (tests, parity diff, browser), and what you did not test.

## Conventions

- **Everything in the repository and everything agents write is in English**: code,
  identifiers, comments, docs, skills, knowledge pages, task folders (`handover.md`, plans,
  findings), issue and PR templates, issue and PR texts, logs and commit messages. Domain
  classes use the English names from the glossary in [docs/domain.md](docs/domain.md).
- **The only exception is the app's own content**, which copies the original: what the end
  user reads is in Italian, with an English translation, exactly as in the original (UI
  labels, messages, e-mails, error texts, in the front end's translation files). URLs and the
  public JSON field names stay Italian (`/entra`, `/o/<org>/<slug>`, `sottoscrizioni`).
- Comments are short and only where the code can't say it: a rule from the original, a
  privacy constraint, a tuned value and where it came from.
- Dependencies are declared only in `backend/pom.xml` and `frontend/package.json`, with exact
  versions committed in the lockfiles. Add a dependency only when the platform can't do it.
