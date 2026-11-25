# Routes and API

Every page URL of the original, which we keep unchanged, and the REST API that serves them.
Page URLs and public JSON keys are Italian, as in the original. Internal API paths under
`/api/**` are ours.

**Status:** not built yet. When a page or an endpoint is built, say so here, and link the
endpoint's row to its controller.

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
| `/entra?next=` | login: email form | no |
| `/entra/:token` | magic link: "Entra come …" with the confirm button | no |
| `/entra/password` | administrator login with password | no |
| `/io?next=` | my space: name, my signatures, applications, meetings, contributions, data | yes |
| `/gestione` | my organisations and the request form | yes |
| `/lingua/:code` | served by Spring, not React Router: see "Language" below | no |

Anchors used by the original: `#percorsi` (home list), `#firma`, `#candidatura`,
`#commenti`, `#f<profileId>` (profile cards).

## Actions

The original posts HTML forms. We expose the same actions as JSON endpoints. Every
state-changing request needs the session and the CSRF header; errors are RFC 9457
`ProblemDetail` with a `code` the front end translates.

| Original form | Our endpoint | Body |
|---|---|---|
| `POST /entra` | `POST /api/auth/magic-link` | `{email, next}` → in `dev` also returns `devLink` |
| `POST /entra/:token` | `POST /api/auth/magic-link/{token}` | — → sets the session, returns `{next, needsName}` |
| `POST /esci` | `POST /api/auth/logout` | — |
| `POST /io` | `PUT /api/me` | `{nome}` |
| `POST /io/elimina` | `DELETE /api/me` | `{conferma: "ELIMINA"}` |
| `POST /gestione/nuova` | `POST /api/organizations/requests` | `{nome, tipo, sito, descrizione}` |
| `POST /p/:id/contributo` | `POST /api/processes/{id}/contributions` | `{tipo, titolo?, testo, profilo_id?}` |
| `POST /p/:id/firma` | `POST /api/processes/{id}/signatures` | `{nome, cognome, comune?, informativa, consenso_org, pubblica}` |
| `POST /p/:id/candidatura` | `POST /api/processes/{id}/applications` | `{genere, eta, istruzione, area, informativa}` |
| `POST /c/:id/vota` | `PUT /api/contributions/{id}/vote` | `{valore: 1 \| -1 \| 0}` |
| `POST /c/:id/commenta` | `POST /api/contributions/{id}/comments` | `{posizione, testo}` |
| `POST /e/:id/iscrivi` | `PUT /api/events/{id}/registration` | — (`DELETE` to cancel) |

## Reads

| Endpoint | Returns |
|---|---|
| `GET /api/home` | the unfiltered home page: `{"statistiche":{"persone","sottoscrizioni","contributi","organizzazioni"},"inEvidenza":Card\|null,"percorsi":[Card],"organizzazioni":[{"slug","nome","descrizione"}]}` |
| `GET /api/processes?tipo=` | `[Card]` for the list-only page `/?tipo=<t>`; an unknown or missing `tipo` gives every open process, as on the original |
| `GET /api/organizations/{slug}` | `{"slug","nome","tipo","sito","descrizione","percorsi":[Card]}`, `tipo` is the kind code (`associazione`); unknown or not verified → 404 `ORGANIZATION_NOT_FOUND` |
| `GET /api/processes/{org}/{slug}` | full process page, with the viewer's own votes, signature and registrations |
| `GET /api/contributions/{id}` | contribution, answer, comments |
| `GET /api/representatives` | profiles with questions received and answered |
| `GET /api/me` | the current user, or 401 |
| `GET /api/me/activity` | the lists shown on `/io` |

A **Card** is an open process of a verified organisation, as shown on the home and organisation
pages. As on the original, the home page orders cards by process id and an organisation
page by process id, newest first.

The home page is two pages on the original: `/` (and `/?tipo=` empty) shows everything, while
`/?tipo=<anything>` shows only the list, with the type's name as heading (empty for an unknown
type). The front end calls `/api/home` for the first and `/api/processes?tipo=` for the second.

A Card's counters are counts of stored rows (see [domain.md](domain.md), "Processes"):

```json
{"id":3,"tipo":"consultazione","titolo":"…","sommario":"…","percorso":"/o/eumans/consultazione-di-esempio",
 "organizzazione":{"slug":"eumans","nome":"Eumans"},"ambito":"Italia","fine":"2027-03-31",
 "obiettivo":0,"posti":0,"sottoscrizioni":0,"candidature":0,"contributi":5,"voti":189}
```

Which counters a card shows depends on the type: initiative `sottoscrizioni` of `obiettivo`,
assembly `candidature` and `posti`, consultation and electoral `contributi` and `voti`.

## Language

As on the original, the language lives in the session, not in the URL or in a second cookie.

| Endpoint | Behaviour |
|---|---|
| `GET /lingua/{code}` | `it` or `en`: stores the language in the session; an unknown code changes nothing. Either way it answers 302 to the path and query of the `Referer`, never to its host; to `/` without a `Referer` or when the path starts with `//`. |
| `GET /api/language` | `{"lingua":"it"}`: the session's language, `it` by default. The root loader calls it with the forwarded cookie. |

## Public JSON (same URL and keys as the original)

`GET /api/processi` — list of open processes, ordered by id. `url` starts with `partecipa.site.base-url`. Each item:

```json
{"ambito":"Italia","candidature":0,"contributi":2,"fine":"2027-03-31","id":1,
 "inizio":"2026-11-01","lingua":"it","obiettivo":500,"organizzazione":"…",
 "sommario":"…","sottoscrizioni":64,"stato":"aperto","tipo":"iniziativa",
 "titolo":"…","url":"https://<host>/o/<org>/<slug>"}
```

`GET /io/dati.json` — everything about the logged-in user, as a download:

```json
{"utente":{"id":0,"email":"…","nome":"…","lingua":"it","is_admin":0,"creato":"2026-11-18 14:18:58"},
 "firme":[],"candidature":[],"contributi":[],"commenti":[],"voti":[],"iscrizioni":[],"org_membri":[]}
```

Keep these keys, their order and their types (`is_admin` is `0`/`1`, dates are
`YYYY-MM-DD`, timestamps `YYYY-MM-DD HH:MM:SS`). Use explicit `@JsonProperty` names on the
response records, so that renaming a Java field never changes the contract.
