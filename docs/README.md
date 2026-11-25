# Partecipa — Documentation

This documentation describes **what the platform does and why**, and how this rewrite is
built. It is written for new developers and for AI agents that need to understand the system
before working on it. Setup and commands are in the [root README](../README.md); machine setup
is in [SETUP.md](../SETUP.md).

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

People log in with their email only (magic link). Organisations ask for a space and go online
after verification. The rules on personal data are part of the product, not an add-on:
see [privacy-and-security.md](privacy-and-security.md).

The original prototype is server-rendered and works without JavaScript. This rewrite keeps
the same URLs and texts, with a React front end (React Router, server-side rendered) and a
Spring Boot REST back end.

## How a request flows

```
browser ──► React Router SSR (Node) ──► loaders call ──► Spring Boot /api/**
   ▲            │ hydrates in the browser                  │ services (rules)
   └── HTML ────┘                                          └─► PostgreSQL (Flyway)
session cookie (HttpOnly, SameSite=Lax) + CSRF token on every state-changing request
```

→ Details: [Architecture](architecture.md) · [Routes and API](routes.md)

## How we know it matches

Each page we build is compared with the same page of the original (`parity-check` skill): same
headings, labels, fields, numbers and links. Unit and integration tests cover the rules
(one vote per person, the lottery, consent, deletion). See [testing.md](testing.md).

## Surrounding systems

- **The original site** is the behavioural reference. Its routes, forms and texts are recorded
  in [.agents/knowledge/original-site.md](../.agents/knowledge/original-site.md).
- **E-mail** sends magic links and notifications. In `dev` the link is shown on the page.
- **SPID / CIE public signing platform**: we only link to it; legal signatures never happen here.

## Map of this documentation

| File | Read it when you want to know… |
|---|---|
| [architecture.md](architecture.md) | how the code is organised, modules, SSR, build order, design decisions |
| [domain.md](domain.md) | the glossary, the entities and their rules, the four process types, the lottery |
| [routes.md](routes.md) | every page URL, every API endpoint, request and response shapes |
| [privacy-and-security.md](privacy-and-security.md) | login, sessions, CSRF, headers, who sees which data, export, deletion |
| [testing.md](testing.md) | which tests exist, how to write them, the parity check |
| [code-style-java.md](code-style-java.md) | how back-end code and tests should look |
| [code-style-react.md](code-style-react.md) | how front-end code, components, styles and tests should look |

### Routing by task (for agents and humans)

Read this file first (it is short), then the topic file that matches your task:

- **Structure of the code, where a new module or page goes, SSR, the build** →
  [architecture.md](architecture.md)
- **A process type, votes, signatures, contributions, comments, meetings, organisations** →
  [domain.md](domain.md), then [routes.md](routes.md)
- **The lottery (sorteggio), strata, seed, reserves** → [domain.md](domain.md), section
  "The lottery"
- **Login, magic link, session, roles, admin, account deletion, data export, consent,
  headers** → [privacy-and-security.md](privacy-and-security.md) and the `privacy-check` skill
- **A page looks or reads differently from the original** →
  [.agents/knowledge/original-site.md](../.agents/knowledge/original-site.md) and the
  `parity-check` skill
- **Texts, translations, Italian/English** → [code-style-react.md](code-style-react.md),
  section "Text and translations"
- **Tests, coverage, CI** → [testing.md](testing.md)
- **Java versions, Node, missing tools on the machine** →
  [.agents/knowledge/toolchain.md](../.agents/knowledge/toolchain.md)

For purely mechanical changes (a rename, a single test fix, a dependency bump) the docs are not
needed.

*These documents describe the target as of 25 November 2026, before the first line of
application code of this repository. Sections marked "not built yet" describe the original's behaviour that we still have to
implement. When you change behaviour, update the affected document in the same change.*
