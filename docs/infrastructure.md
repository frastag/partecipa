# Infrastructure

The local development stack, the Keycloak realm, the databases, and how the system runs and
scales in production.

**Status:** not built yet. The scaffold creates `infra/`.

## Local stack (`infra/compose.yaml`)

The API and the web server run on the host (IDE or command line). Everything else runs in
Docker Compose:

| Service | Image | Port on the host | Purpose |
|---|---|---|---|
| `postgres` | `postgres` (current major) | 5432 | databases `partecipa` (the app) and `keycloak`, created by `infra/postgres/init.sql` |
| `keycloak` | `quay.io/keycloak/keycloak` (current major) | 8180 | `start-dev --import-realm`, realm from `infra/keycloak/realm-partecipa.json` |
| `valkey` | `valkey/valkey` | 6379 | web session store |
| `mailpit` | `axllent/mailpit` | 1025 (SMTP), 8025 (web UI) | catches every e-mail: verification, password reset |

Image versions are pinned in `compose.yaml`; record them in
[.agents/knowledge/toolchain.md](../.agents/knowledge/toolchain.md) when you change them.

```bash
docker compose -f infra/compose.yaml up -d      # start
docker compose -f infra/compose.yaml ps         # state
docker compose -f infra/compose.yaml logs -f keycloak
docker compose -f infra/compose.yaml down       # stop, keep data
```

`down -v` deletes the volumes, so every database and every registered user: run it only
when the user asks.

| URL | What |
|---|---|
| http://localhost:5173 | web (`npm run dev`) |
| http://localhost:8080/api/v1 | API (`./mvnw spring-boot:run`) |
| http://localhost:8080/api/v1/docs | OpenAPI, `dev` only |
| http://localhost:8180 | Keycloak (admin console with the bootstrap admin from `compose.yaml`) |
| http://localhost:8025 | Mailpit: open the verification e-mail here |

## The Keycloak realm (`infra/keycloak/realm-partecipa.json`)

The realm is configuration as code: change it in the admin console, export it, and commit the
export. The dev export holds dev-only secrets; production secrets come from the environment.

- **Login:** email as username, registration enabled, email verification required, password
  reset allowed, "remember me" off, brute-force detection on. Password policy: at least 12
  characters, not the email *(assumption)*.
- **Registration form:** first name, last name, email, password. The display name defaults
  to "first name + last name" and can be changed on `/io`.
- **Languages:** `it` (default) and `en`.
- **SMTP:** Mailpit in dev (`mailpit:1025`); a real provider in production.
- **Clients:**
  - `partecipa-web`: confidential, authorization code flow with PKCE (S256), redirect URI
    `<PUBLIC_ORIGIN>/auth/callback`, post-logout redirect `<PUBLIC_ORIGIN>/`. An audience
    mapper adds `partecipa-api` to its access tokens.
  - `partecipa-api-admin`: service account only, with the `realm-management` role
    `manage-users` and nothing else. Used by the API to delete users.
- **Roles:** realm role `admin`. Administrators must set up two-factor authentication (OTP)
  *(assumption)*.
- **Token lifetimes:** access token 5 minutes, refreshed by the web server; SSO session idle
  30 minutes, max 10 hours *(assumption)*.
- **Dev users:** the realm export holds one administrator for `dev` only. Regular users are
  created by registering, as in production.

## Databases and migrations

- One PostgreSQL cluster, two databases with separate users: `partecipa` (owned by the app)
  and `keycloak` (owned by Keycloak). The app never reads Keycloak's database; it uses the
  Admin API.
- The app's schema is managed only by Flyway: migrations in
  `backend/src/main/resources/db/migration`, named `V<yyyyMMddHHmm>__<module>_<what>.sql`.
  Never edit a merged migration. Demo data is in `db/seed-dev`, loaded only by the `dev`
  profile.
- Migrations must be safe while the previous version of the API is still running (rolling
  deploys): add columns as nullable or with defaults, backfill, then constrain in a later
  migration; never rename or drop in the same release that stops using a column.
- Spring Modulith's event publication table is created by a migration, not by Hibernate.

## Production topology

```
                 ┌──────────── reverse proxy / load balancer (TLS) ────────────┐
 browser ──────► │  <host>/**         → web ×N      (React Router, Node)          │
                 │  <host>/api/v1/**  → api ×N      (Spring Boot)                 │
                 │  auth.<host>/**    → keycloak ×N (cluster, cache between nodes)│
                 └────────────────────────────────────────────────────────────────┘
       web ─► valkey (sessions)        api ─► PostgreSQL `partecipa`
       keycloak ─► PostgreSQL `keycloak`         api, web ─► keycloak (tokens, JWKS)
```

- `web` and `api` are stateless and scale by adding instances behind the load balancer.
  Readiness: `/api/v1/actuator/health/readiness` *(assumption on the path)*, and a `/healthz`
  route on `web`.
- Keycloak runs at least two nodes on its own database.
- PostgreSQL: managed service with automatic backups and point-in-time recovery. Valkey:
  managed, or a small replicated instance; losing it logs everyone out, nothing else.
- Configuration and secrets only from environment variables or the platform's secret store.
- Hosting in the EU.

## Open

- Hosting platform, reverse proxy, managed or self-hosted Keycloak, e-mail provider. — the user
