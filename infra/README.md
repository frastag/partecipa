# Local stack

PostgreSQL, Keycloak, Valkey and Mailpit for development. The API and the web server run on
the host. Full description: [docs/infrastructure.md](../docs/infrastructure.md).

```bash
docker compose -f infra/compose.yaml up -d --wait   # start and wait until healthy
docker compose -f infra/compose.yaml ps
docker compose -f infra/compose.yaml down           # stop, keep the data
```

The project name is fixed (`partecipa`), so every worktree uses the same containers and
volumes.

| Service | URL | Dev credentials |
|---|---|---|
| PostgreSQL | `localhost:5432` | databases `partecipa` (user `partecipa` / `partecipa`) and `keycloak` (`keycloak` / `keycloak`); superuser `postgres` / `postgres` |
| Keycloak | http://localhost:8180 | admin console: `admin` / `admin` (master realm) |
| Realm `partecipa` | http://localhost:8180/realms/partecipa/account | dev administrator `admin@partecipa.local` / `dev-admin-password` (asks to set up OTP at the first login) |
| Valkey | `localhost:6379` | none |
| Mailpit | http://localhost:8025 | none; SMTP on `localhost:1025` |

Every password and secret here is dev-only and must never be used elsewhere.

## Changing the realm

`--import-realm` imports `keycloak/realm-partecipa.json` only when the realm doesn't exist.
To apply a change to the JSON on an existing stack, delete the realm in the admin console
(or with the Admin API) and restart Keycloak:

```bash
docker compose -f infra/compose.yaml restart keycloak
```

Deleting the realm deletes every user registered in it. For changes made in the admin
console, export the realm and copy the relevant part back into the JSON: the JSON is the
source of truth.
