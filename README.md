# Partecipa

Civic participation platform: popular initiatives, citizens' assemblies selected by lot,
consultations, and public questions to candidates and elected representatives.

A Spring Boot REST API, a React web front end (React Router, server-side rendered), Keycloak
for registration and login, PostgreSQL with Flyway migrations. Modular (Spring Modulith) and
built to scale horizontally.

> **Status (2026-11-25):** scaffold — local stack with Keycloak (registration with email
> verification), API skeleton with token validation and migrations, web front end with layout,
> Italian/English switch and the pages `/come-funziona` and `/privacy`. Next: accounts (step 2
> of the "Build order" in [docs/architecture.md](docs/architecture.md)).

## Project layout

```
backend/        Spring Boot API, Java 25, Maven wrapper, Spring Modulith
frontend/       React + React Router (SSR, backend for frontend), Tailwind CSS v4
infra/          Docker Compose: PostgreSQL, Keycloak (realm as code), Valkey, Mailpit
docs/           what the platform does and how it is built — start at docs/README.md
.agents/        tool-neutral agent skills and knowledge pages
.claude/        Claude Code: CLAUDE.md, settings, symlinks to skills and style rules
.github/        CI, Dependabot, issue and PR templates
tmp/            task folders and the snapshot of the original prototype (git-ignored)
AGENTS.md       instructions for AI agents (and a good summary for humans)
```

## Commands

```bash
# local stack
docker compose -f infra/compose.yaml up -d   # PostgreSQL :5432, Keycloak :8180, Valkey :6379, Mailpit :8025

# back end
cd backend
./mvnw verify                 # tests (Testcontainers, needs Docker) + formatting + checks + coverage
./mvnw spring-boot:run        # http://localhost:8080/api/v1, profile dev with demo data

# front end
cd frontend
npm ci
cp .env.example .env          # once
npm run dev                   # http://localhost:5173
npm run lint && npm test && npm run build
npm run api:types             # regenerate API types from the running back end's OpenAPI
npm run e2e                   # Playwright against the production build (needs Valkey)
```

To try registration locally: open http://localhost:5173, choose "Registrati", then open the
verification e-mail in Mailpit at http://localhost:8025.

## Documentation

- [docs/README.md](docs/README.md) — overview and routing to the topic docs
- [SETUP.md](SETUP.md) — machine setup
- [AGENTS.md](AGENTS.md) — rules for agents: conventions, verification, what must not regress
