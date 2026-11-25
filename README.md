# Partecipa

Civic participation platform: popular initiatives, citizens' assemblies selected by lot,
consultations, and public questions to candidates and elected representatives.

The definitive rewrite of the prototype at <https://prototipo.michelangelogigli.it/>, with a
React front end (React Router, server-side rendered) and a Spring Boot back end, keeping the
same pages, URLs, texts and privacy rules.

> **Status (2026-11-25):** documentation and agent setup only, no application code yet. The
> code is built step by step following the "Build order" in
> [docs/architecture.md](docs/architecture.md); the first step is the scaffold.

## Project layout

```
backend/        Spring Boot API, Java 25, Maven wrapper (not created yet)
frontend/       React + React Router (framework mode, SSR), Tailwind CSS v4 (not created yet)
docs/           what the platform does and how it is built — start at docs/README.md
.agents/        tool-neutral agent skills and knowledge pages
.claude/        Claude Code: CLAUDE.md, settings, symlinks to skills and style rules
.github/        CI, Dependabot, issue and PR templates
tmp/            task folders and the snapshot of the original (git-ignored)
AGENTS.md       instructions for AI agents (and a good summary for humans)
```

## Commands

```bash
# back end
cd backend
./mvnw verify                 # tests + formatting + static checks + coverage
./mvnw spring-boot:run        # http://localhost:8080, profile dev with demo data

# front end
cd frontend
npm ci
npm run dev                   # http://localhost:5173, /api, /lingua, /io/dati.json proxied to 8080
npm run lint && npm test && npm run build
npm run build && npm start    # production SSR server on http://localhost:3000
npm run format                # Prettier
npm run e2e                   # Playwright
```

In the `dev` profile no e-mail is sent: the login page shows the magic link, as the original
demo does.

## Documentation

- [docs/README.md](docs/README.md) — overview and routing to the topic docs
- [SETUP.md](SETUP.md) — machine setup
- [AGENTS.md](AGENTS.md) — rules for agents: conventions, verification, what must not regress
