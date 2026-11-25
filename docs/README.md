# Partecipa — Documentation

This documentation describes **what the platform does and why**, and how it is built. It is
written for new developers and for AI agents that need to understand the system before
working on it. Setup and commands are in the [root README](../README.md); machine setup is in
[SETUP.md](../SETUP.md).

## The 10,000 feet view

Partecipa lets people take part in public decisions, and lets organisations run the processes
that make it possible. A process is a **percorso**, and it has one of four types:

| Type (`tipo`) | People can… | Organisation can… |
|---|---|---|
| `iniziativa` — popular initiative | sign the text, propose and discuss amendments, join a collection table | collect signatures towards a target, export them, link to SPID/CIE signing |
| `assemblea` — citizens' assembly | apply with four demographic answers, read and comment recommendations | run a public stratified lottery, form mixed tables |
| `consultazione` — consultation | agree / disagree / pass on one statement at a time, add statements and proposals | see where there is consensus and what divides |
| `elettorale` — candidates and elected | ask public questions, support others' questions | invite profiles that answer in public |

Every process can also have **incontri** (meetings, in person or online, with a capacity) and
can be embedded in another site with an `<iframe>` (`/embed/<org>/<slug>`).

Anyone can read. To take part, people **register** (Keycloak: email, password, verified
email). Organisations ask for a space and go online after verification. The rules on personal
data are part of the product, not an add-on: see
[privacy-and-security.md](privacy-and-security.md).

The idea comes from the prototype at <https://prototipo.michelangelogigli.it/>, which is
inspiration only: this documentation is the specification.

## How a request flows

```
browser ──► web: React Router SSR (Node) ── Bearer token ──► api: Spring Boot /api/v1/**
   ▲          │ session id cookie → tokens in Valkey            │ modules (rules)
   └── HTML ──┘ login/registration ──► Keycloak                 └─► PostgreSQL (Flyway)
```

→ Details: [Architecture](architecture.md) · [Routes and API](routes.md) ·
[Infrastructure](infrastructure.md)

## Surrounding systems

- **Keycloak** owns registration, login, passwords and two-factor authentication. Realm
  configuration lives in `infra/keycloak/`.
- **E-mail** sends verification, password reset (by Keycloak) and notifications (by the API).
  In `dev`, Mailpit catches every message.
- **SPID / CIE public signing platform**: we only link to it; legal signatures never happen
  here.

## Map of this documentation

| File | Read it when you want to know… |
|---|---|
| [architecture.md](architecture.md) | how the code is organised, modules, the BFF, scaling rules, build order, design decisions |
| [infrastructure.md](infrastructure.md) | the local Docker stack, the Keycloak realm, databases and migrations, production topology |
| [domain.md](domain.md) | the glossary, the entities and their rules, the four process types, the lottery |
| [routes.md](routes.md) | every page URL, every API endpoint, request and response shapes |
| [privacy-and-security.md](privacy-and-security.md) | registration and login, tokens, sessions, headers, who sees which data, export, deletion |
| [testing.md](testing.md) | which tests exist, how to write them |
| [code-style-java.md](code-style-java.md) | how back-end code and tests should look |
| [code-style-react.md](code-style-react.md) | how front-end code, components, styles and tests should look |

### Routing by task (for agents and humans)

Read this file first (it is short), then the topic file that matches your task:

- **Structure of the code, where a new module or page goes, SSR, the build, scaling** →
  [architecture.md](architecture.md)
- **Docker Compose, Keycloak configuration, a new migration, deployment** →
  [infrastructure.md](infrastructure.md)
- **A process type, votes, signatures, contributions, comments, meetings, organisations** →
  [domain.md](domain.md), then [routes.md](routes.md)
- **The lottery (sorteggio), strata, seed, reserves** → [domain.md](domain.md), section
  "The lottery"
- **Registration, login, tokens, sessions, roles, account deletion, data export, consent,
  headers** → [privacy-and-security.md](privacy-and-security.md) and the `privacy-check` skill
- **Texts, translations, Italian/English** → [code-style-react.md](code-style-react.md),
  section "Text and translations"
- **Tests, coverage, CI** → [testing.md](testing.md)
- **Java, Node, Docker, missing tools on the machine** →
  [.agents/knowledge/toolchain.md](../.agents/knowledge/toolchain.md)
- **Ideas from the original prototype** →
  [.agents/knowledge/original-site.md](../.agents/knowledge/original-site.md)

For purely mechanical changes (a rename, a single test fix, a dependency bump) the docs are not
needed.

*These documents describe the target as of 25 November 2026, before the first line of
application code. Sections marked "not built yet" describe what we still have to implement.
When you change behaviour, update the affected document in the same change.*
