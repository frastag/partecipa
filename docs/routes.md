# Routes and API

Every page URL of the web front end and every endpoint of the API. Page URLs are in Italian,
like the texts people read. API paths and JSON fields are in English and live under
`/api/v1`. The OpenAPI document (`/api/v1/docs` in `dev`) is the detailed contract; this page
is the map.

**Status:** built by the scaffold (branch `feature/scaffold`, 2026-11-25): the pages `/`
(placeholder), `/come-funziona`, `/privacy`, the 404 page, `/entra` and `/registrati` as
"coming soon" placeholders, `/lingua/:code`, `/healthz`, and the API's operations endpoints.
Everything else is not built yet. When a page or an endpoint is built, say so here, and link
the endpoint's row to its controller.

## Pages (React Router routes, listed in `frontend/app/routes.ts`)

| URL | Page | Login |
|---|---|---|
| `/` | home: hero, stats, featured process, process types, open processes, organisations | no |
| `/?tipo=iniziativa\|assemblea\|consultazione\|elettorale` | home filtered by type | no |
| `/rappresentanti` | candidates and elected, with questions received and answered | no |
| `/come-funziona` | how it works, for people and for organisations | no |
| `/privacy` | privacy and data | no |
| `/o/:org` | organisation page with its processes | no |
| `/o/:org/:slug` | process page (layout depends on the type) | no, to read |
| `/c/:id` | contribution page with votes and discussion | no, to read |
| `/embed/:org/:slug` | embeddable card, no header or footer | no |
| `/io?next=` | my space: name, my signatures, applications, meetings, contributions, data | yes |
| `/io/dati.json` | download of all my data (from `GET /api/v1/me/export`) | yes |
| `/gestione` | my organisations and the request form | yes |

### Authentication and language (handled by the web server, no page of their own)

| URL | Behaviour |
|---|---|
| `GET /entra?next=` | redirect to Keycloak's login page |
| `GET /registrati?next=` | redirect to Keycloak's registration page |
| `GET /auth/callback` | finishes the login, creates the session, redirects to `next` |
| `POST /esci` | ends the session here and in Keycloak, redirects to `/` |
| `GET /healthz` | liveness of the web server: `{"status":"UP"}` |
| `GET /lingua/:code` | `it` or `en`: stores the language in the session (and on the account, if logged in) and answers 302 to the path and query of the `Referer`, never its host; to `/` without a `Referer` or when the path starts with `//` |

Details of the flow: [privacy-and-security.md](privacy-and-security.md).

## API conventions

- Base path `/api/v1`. A breaking change gets a new version; additions don't.
- Authentication: `Authorization: Bearer <access token>` from Keycloak. Endpoints marked
  "public" accept requests without it.
- Errors are RFC 9457 `ProblemDetail` with a `code` (`ALREADY_SIGNED`) and, for validation,
  `errors: [{field, code}]`. The front end owns the text.
- Lists are paginated: `?page=0&size=20`, response `{items, page, size, totalItems}`.
- Dates are ISO 8601 (`2027-03-31`), instants ISO 8601 in UTC.

## Writes

| Endpoint | Body | Notes |
|---|---|---|
| `PUT /api/v1/me` | `{displayName, language}` | |
| `DELETE /api/v1/me` | `{confirmation: "ELIMINA"}` | also deletes the Keycloak user |
| `POST /api/v1/organizations/requests` | `{name, kind, website, description}` | |
| `POST /api/v1/processes/{id}/contributions` | `{kind, title?, text, profileId?}` | |
| `POST /api/v1/processes/{id}/signatures` | `{firstName, lastName, city?, noticeAccepted, organizationMayContact, showName}` | |
| `DELETE /api/v1/processes/{id}/signatures/mine` | — | withdraw |
| `POST /api/v1/processes/{id}/applications` | `{gender, ageBand, education, area, noticeAccepted}` | |
| `DELETE /api/v1/processes/{id}/applications/mine` | — | withdraw |
| `PUT /api/v1/contributions/{id}/vote` | `{value: 1 \| -1 \| 0}` | one vote per person, replaced on change |
| `POST /api/v1/contributions/{id}/comments` | `{stance, text}` | |
| `PUT /api/v1/events/{id}/registration` | — | `DELETE` to cancel |

## Reads

| Endpoint | Access | Returns |
|---|---|---|
| `GET /api/v1/me` | logged in | the current account, created from the token on the first call: `{id, displayName, needsDisplayName, language, roles}` |
| `GET /api/v1/me/activity` | logged in | the lists shown on `/io` |
| `GET /api/v1/me/export` | logged in | everything about the user, including the Keycloak profile |
| `GET /api/v1/home` | public | `{stats: {people, signatures, contributions, organizations}, featured: Card \| null, processes: [Card], organizations: [{slug, name, description}]}` |
| `GET /api/v1/processes?type=&page=&size=` | public | page of `Card`s: open processes of verified organisations |
| `GET /api/v1/processes/{org}/{slug}` | public | full process page, with the viewer's own votes, signature and registrations when logged in |
| `GET /api/v1/organizations/{slug}` | public | `{slug, name, kind, website, description, processes: [Card]}`; unknown or not verified → 404 `ORGANIZATION_NOT_FOUND` |
| `GET /api/v1/contributions/{id}` | public | contribution, answer, comments |
| `GET /api/v1/representatives` | public | profiles with questions received and answered |

A **Card** is an open process of a verified organisation:

```json
{"id":3,"type":"CONSULTATION","title":"…","summary":"…","path":"/o/eumans/consultazione-di-esempio",
 "organization":{"slug":"eumans","name":"Eumans"},"scope":"Italia","endsOn":"2027-03-31",
 "target":0,"seats":0,"signatures":0,"applications":0,"contributions":5,"votes":189}
```

Counters are counts of stored rows (see [domain.md](domain.md), "Processes"). Which counters a
card shows depends on the type: initiative `signatures` of `target`, assembly
`applications` and `seats`, consultation and electoral `contributions` and `votes`.

## Operations

| Endpoint | Access |
|---|---|
| `GET /api/v1/actuator/health/liveness`, `/readiness` | load balancer |
| `GET /api/v1/actuator/health` | public: overall status only, no details |
| `GET /api/v1/docs` (OpenAPI JSON), `/api/v1/docs/ui` (Swagger UI) | `dev` only |

Every API path, operations included, is under the servlet context path `/api/v1`
(`server.servlet.context-path`).
