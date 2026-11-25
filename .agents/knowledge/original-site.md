# The original prototype

**Inspiration only** (decided by the user on 2026-11-25): our docs are the specification,
and this page records what the prototype does, so that ideas can be taken from it on purpose.
Its login (magic link, no registration) is not ours: we use Keycloak with registration.

<https://prototipo.michelangelogigli.it/>, observed on 2026-11-18 with a GET-only crawl (38
URLs), logged in as a regular user (not an organisation member, not an administrator). A
snapshot of the pages and an outline (`outline.txt`) are in `tmp/original-snapshot/`,
git-ignored; personal pages (`/io`, `/io/dati.json`) are excluded from it. The snapshot was
copied from the prototype repository on 2026-11-25, with English pages saved in
`tmp/original-snapshot/en/`.

## Technology (as observed)

- Server-rendered HTML, `lang="it"`, title "Partecipa — decidere insieme". Behind Cloudflare
  (which also obfuscates email addresses in pages: `/cdn-cgi/l/email-protection`).
- Session cookie `session=…` (signed, Flask/itsdangerous format), `Secure; HttpOnly;
  SameSite=Lax`. A hidden `csrf` field on every POST form.
- Headers: CSP `default-src 'self'; img-src 'self' data:; base-uri 'self'; form-action 'self';
  frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy: same-origin`,
  `X-Robots-Tag: noindex, nofollow`.
- Static files: `/static/style.css` (Tailwind CSS v4 build, ~70 KB), `/static/app.js`
  (1.8 KB, progressive enhancement only: count-up numbers `data-conta`, reveal on scroll
  `data-reveal`, lottery dots `.urna .estratto/.riserva` lighting up, all disabled with
  `prefers-reduced-motion`), `/static/fonts/inter.woff2`, `/static/logo.svg`.
- "Without this file the site works the same, just still" (comment in `app.js`): every action
  is a plain HTML form.
- Type colours (CSS): `tipo-iniziativa` orange-600/50/200, `tipo-assemblea` emerald,
  `tipo-consultazione` sky, `tipo-elettorale` violet. Font `Inter Variable`.

## Layout common to every page

- Skip link "Vai al contenuto" → `#contenuto`.
- Banner: "Prototipo dimostrativo: i dati sono di esempio. Non inserire dati personali reali."
- Header: logo "Partecipa"; menu Iniziative, Assemblee, Consultazioni, Candidati ed eletti,
  Come funziona; language link `EN`; logged out "Entra", logged in "Gestione", avatar initial
  + email (link to `/io`), "Esci" (POST form).
- Logged out, the right of the header shows the language link and the button "Entra"
  (`class="btn piccolo"`, `href="/entra?next=<current path>"`). The current menu item has
  `class="attivo"`.
- English UI via `/lingua/en`: chrome and labels are translated ("Civic participation, open to
  everyone", "supporters", "Processes"); process content stays in its own language.
- Language switch (2026-11-18, GET only, curl): `GET /lingua/<code>` stores `lang` in the
  signed `session` cookie and answers 302 to the Referer's path and query, never its host
  (Referer `https://example.com/x` → `/x`). No Referer, or a path starting with `//`,
  redirects to `/`. An unknown code (`/lingua/xx`) stores nothing and redirects the same way.
  Anonymous visitors get a `session` cookie on their first page (it holds the CSRF token).
- Unknown URLs answer 404 with h1 "404", "Questa pagina non esiste, o non è pubblica." and
  the button "Torna all'inizio" (`/`). In English: "This page does not exist, or is not
  public." and "Back to home". Observed 2026-11-18 with curl.
- Headings use a second self-hosted font, "Bricolage Grotesque Variable"
  (`/static/fonts/bricolage.woff2`), next to Inter.

## Login flow

1. `/entra?next=/`: "Entra con la tua email" — "Niente password: ti mandiamo un link. Se è la
   prima volta, l'account si crea da solo." Field `email`, button "Mandami il link". Links to
   `/privacy` and "Accesso amministratore" (`/entra/password`).
2. `POST /entra` → "Controlla la posta": link valid 20 minutes, single use. Demo box: "Ambiente
   di prova, nessuna email parte davvero:" with the link (`#link-prova`).
3. `GET /entra/<token>` → "Entra come <email>" with button "Conferma ed entra" (POST).
4. `POST /entra/<token>` → 302 to `/io?next=/`; first time: "Benvenuta, benvenuto. Scrivi il
   nome con cui vuoi comparire."

## Pages

| URL | Main content |
|---|---|
| `/` | pill "Partecipazione civica, aperta a tutti"; h1 "Le decisioni pubbliche si prendono anche da qui."; stats persone / sottoscrizioni / proposte e contributi / organizzazioni; type preview cards; "In evidenza" featured process; four type tiles; "Aperti adesso — Percorsi" with filter tabs Tutti / Iniziativa popolare / Assemblea civica / Consultazione / Proposta elettorale; "Organizzazioni — Chi li promuove" |
| `/?tipo=<t>` | only the list section (`#percorsi`): no hero, stats, featured process, type tiles or organisations; cards filtered, h2 = type name, active tab `attivo`. An unknown type (`/?tipo=xx`) shows the same list-only page with all processes and an empty h2; an empty `/?tipo=` shows the full home (2026-11-18, curl) |
| `/rappresentanti` | "Candidati ed eletti": profile cards with role, list/institution, organisation, "N risposte su M domande" |
| `/come-funziona` | "Per le persone" (four types explained), "Per le organizzazioni", link "Chiedi uno spazio" |
| `/privacy` | "Privacy e dati": responsibilities, what the organisation sees, what is collected, rights, security; logged in, also the button "Vai ai miei dati" (`/io`), absent when logged out (2026-11-18) |
| `/gestione` | "Le mie organizzazioni" (empty: "Non gestisci ancora nessuna organizzazione."), "Porta qui la tua organizzazione" form: nome, tipo (associazione/comitato/partito/istituzione), sito, descrizione "Chi siete, in due righe" |
| `/io` | "Il mio spazio": name form; Le mie sottoscrizioni, Le mie candidature alle assemblee, I miei incontri, Quello che ho scritto; "I miei dati": download, delete with `ELIMINA` |
| `/o/<org>` | kind, name, description, website, its open processes newest first (Eumans: 3 then 2; snapshot 2026-11-18) |
| `/o/<org>/<slug>` | breadcrumb "Percorsi / <org>"; type, status, scope; h1; summary; counters; timeline phases (current `fase ora`, next `fase poi`); description; type block; "Incontri"; "Porta questo percorso sul tuo sito" with the iframe code; sticky bottom bar with the main action |
| `/c/<id>` | back link to the process; contribution; author "Nome I. · dd/MM/yyyy HH:mm"; vote form; for questions "Risposta" with author and date; "Discussione (n)" with stance + author + date; comment form |
| `/embed/<org>/<slug>` | small card: type, title, summary, a counter, "Partecipa", organisation |
| `/api/processi` | JSON list (shape in [docs/routes.md](../../docs/routes.md)) |
| `/io/dati.json` | JSON export (shape in [docs/routes.md](../../docs/routes.md)) |

## Type blocks on the process page

- **Initiative:** "Proposte di modifica al testo" (support button "N sostengo", title, text,
  author, comments count), "Scrivi una proposta" (titolo, testo, "Pubblica"); counter "N
  sottoscrizioni / Obiettivo: 500"; signature form `#firma`: nome, cognome, comune, checkbox
  `informativa` (required: "nome, cognome e comune vanno a <org>, che promuove l'iniziativa"),
  `consenso_org` ("<org> può scrivermi via email…"), `pubblica` ("Mostra il mio nome tra chi
  ha sottoscritto"), button "Sottoscrivo"; "Hanno sottoscritto: Nome Cognome (Città), …";
  "Da dove arrivano le sottoscrizioni" (city → count).
  Timeline: Apertura · Sottoscrizioni e proposte · Deposito.
- **Assembly:** counters candidature / posti / tavoli; "Raccomandazioni dell'assemblea" ("Le
  scrivono e le votano solo le persone estratte. Chiunque può leggerle."); "Contributi
  all'assemblea"; application form `#candidatura`: genere (donna/uomo/altro), età
  (16-29/30-44/45-64/65+), titolo di studio (scuola dell'obbligo/diploma/laurea), dove vivi
  (per process: Italy, France, Germany, Poland, Spain, Other EU country), `informativa`,
  button "Mi candido al sorteggio". Timeline: Candidature · Sorteggio · Lavori
  dell'assemblea · Raccomandazioni.
- **Consultation:** "Sei d'accordo?" — each statement with buttons D'accordo (`valore=1`),
  Non d'accordo (`-1`), Passo (`0`) showing counts, then "X% d'accordo Y% contrari Z% passano
  N voti"; "Aggiungi un'affermazione"; "Proposte". Timeline: Apertura · Voti e proposte ·
  Esiti.
- **Electoral:** "Candidati ed eletti" profile cards with "Fai una domanda" (form with hidden
  `profilo_id`); "Programma" items with support; "Domande e risposte" ("Le domande più
  sostenute salgono in cima."), each "A <profile> · <author>", answer or "In attesa di
  risposta"; "Proposte per il programma". Timeline: Apertura · Domande e risposte · Chiusura.

## Demo data (dev seed only)

Organisations: Associazione Luca Coscioni (`associazione-luca-coscioni`), Eumans (`eumans`).
Processes: `iniziativa-di-esempio` (target 500, 64 signatures), `european-citizens-assembly-demo`
(English content, 78 applications, 24 seats, 4 tables), `consultazione-di-esempio` (4
statements), `candidati-ed-eletti-esempio` (2 profiles). Home stats on 2026-11-18: 95 people,
64 signatures, 12 contributions, 2 organisations. All dates 01/11/2026 – 31/03/2027.
Use these to seed `dev`; the numbers drift as other visitors use the demo.

- The snapshot's binary files are not reliable: `parity.mjs crawl` saves every response as
  text, so `static_fonts_inter.woff2` in the 2026-11-18 snapshot is corrupted (48,256 bytes on
  the site, a different size in the snapshot). Download fonts and images directly with curl.

## Open

- Organisation management pages (process creation, moderation, lottery execution, exports,
  export log) were not visible: the account is not a member of any organisation.
- The lottery record (seed, anonymous list, program download) was not observed: no draw has
  run yet on the demo.
- The administrator area behind `/entra/password` was not explored.
- Withdrawing a signature or an application, and vote toggling, were not tried (they would
  write to the original).

## Observed on 2026-11-19

- `/api/processi` ends its body with a newline after the JSON (the Angular rewrite's did not;
  no effect on parsers).
- `/o/<missing>` answers 404 with the generic 404 page ("Questa pagina non esiste, o non è
  pubblica.") and the default title "Partecipa — decidere insieme"; an existing organisation
  page has the title "<name> — Partecipa".
- English labels on the home page come from a GET `/lingua/en` session; saved copies in
  `tmp/original-snapshot/en/` (`original-home-en*.html`, `original-o-eumans-en.html`).
