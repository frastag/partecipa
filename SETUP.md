# Setup

What a development machine needs. The state of the current machine is recorded in
[.agents/knowledge/toolchain.md](.agents/knowledge/toolchain.md).

## Required

- **JDK 25 or newer.** The build targets Java 25 (`--release 25`); a newer JDK works.
  Maven is not needed: `backend/mvnw` downloads it.
- **Node.js 24 LTS** with npm. No global CLI is needed: React Router, Vite and the other tools
  run through the npm scripts or `npx`.
- **Git** and, for issues and PRs, the GitHub CLI `gh` logged in with access to
  `frastag/partecipa`.

## Not required

- **Docker and PostgreSQL:** tests and the `dev` profile use an embedded PostgreSQL that
  downloads its own binaries on first run (cached in `~/.embedpostgresql`).
- **An SMTP server:** in `dev` the magic link is shown on the page.

## First run

```bash
cd backend && ./mvnw verify          # first run downloads Maven and dependencies
cd ../frontend && npm ci
npx playwright install chromium      # only for npm run e2e
```

## IDE

IntelliJ IDEA: open the repository root, import `backend/pom.xml` as a Maven project, and
install the google-java-format plugin so the IDE formats like Spotless. Enable ESLint and
Prettier for `frontend/`.
