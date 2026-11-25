# Setup

What a development machine needs. The state of the current machine is recorded in
[.agents/knowledge/toolchain.md](.agents/knowledge/toolchain.md).

## Required

- **A Docker runtime with Compose v2**: OrbStack, Colima or Docker Desktop. It runs the local
  stack (PostgreSQL, Keycloak, Valkey, Mailpit) and the Testcontainers in the back-end tests.
  With Colima, set `DOCKER_HOST` and `TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE` as the
  Testcontainers docs explain.
- **JDK 25 or newer.** The build targets Java 25 (`--release 25`); a newer JDK works.
  Maven is not needed: `backend/mvnw` downloads it.
- **Node.js 24 LTS** with npm. No global CLI is needed: React Router, Vite and the other tools
  run through the npm scripts or `npx`.
- **Git** and, for issues and PRs, the GitHub CLI `gh` logged in with access to
  `frastag/partecipa`.

## Not required

- **A local PostgreSQL or Keycloak installation:** both run in Docker.
- **An SMTP server:** in `dev`, Mailpit catches every e-mail.

## First run

```bash
docker compose -f infra/compose.yaml up -d   # first run pulls the images
cd backend && ./mvnw verify                  # first run downloads Maven and dependencies
cd ../frontend && npm ci && cp .env.example .env
npx playwright install chromium              # only for npm run e2e
```

## IDE

IntelliJ IDEA: open the repository root, import `backend/pom.xml` as a Maven project, and
install the google-java-format plugin so the IDE formats like Spotless. Enable ESLint and
Prettier for `frontend/`. The Docker plugin can start `infra/compose.yaml`.
