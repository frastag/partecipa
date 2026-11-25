# Domain

The concepts of Partecipa, their rules, and the English names we use for them in code. Many
ideas come from the original prototype (observed 2026-11-18, see
[.agents/knowledge/original-site.md](../.agents/knowledge/original-site.md)); this page is
the specification.

**Status:** not built yet. Update each section's status when its feature is merged.

## Glossary

Italian is what users read and what page URLs use. English is what the code, the API paths and
the JSON fields use.

| Italian (UI, URL) | English (code, API) | Meaning |
|---|---|---|
| percorso | `Process` (entity `ParticipationProcess`, to avoid `java.lang.Process`) | a participation process run by an organisation |
| tipo: iniziativa / assemblea / consultazione / elettorale | `ProcessType.INITIATIVE / ASSEMBLY / CONSULTATION / ELECTORAL` | the four process types |
| stato: aperto | `ProcessStatus.OPEN` (also `DRAFT`, `CLOSED`) | whether people can take part |
| ambito | `scope` | geographic scope shown on cards ("Italia", "European Union") |
| organizzazione | `Organization` | association, committee, party or institution (`OrganizationKind`) |
| richiesta di spazio | `OrganizationRequest` | a request to open an organisation, pending verification |
| sottoscrizione / firma | `Signature` | support for an initiative's text (not a legal signature) |
| obiettivo | `target` | number of signatures aimed for |
| contributo | `Contribution` | any text a person adds to a process; has a `ContributionKind` |
| proposta | `ContributionKind.PROPOSAL` | an amendment or proposal, with title and text |
| affermazione | `ContributionKind.STATEMENT` | a consultation statement people vote on |
| domanda | `ContributionKind.QUESTION` | a question to a candidate or elected profile |
| programma | `ContributionKind.PROGRAMME_ITEM` | an item of an electoral programme |
| raccomandazione | `ContributionKind.RECOMMENDATION` | written and voted only by selected assembly members |
| risposta | `Answer` | a profile's public answer to a question |
| commento, posizione: favorevole / neutro / contrario | `Comment`, `Stance.FOR / NEUTRAL / AGAINST` | discussion under a contribution |
| voto, sostengo | `Vote` with value `1` | support for a contribution |
| d'accordo / non d'accordo / passo | `Vote` with value `1 / -1 / 0` | consultation vote on a statement |
| candidatura | `Application` | applying to an assembly's lottery |
| sorteggio | `Lottery` / `Draw` | the stratified public draw |
| estratto / riserva | `SELECTED` / `RESERVE` | outcome of the draw for an application |
| posti, tavoli | `seats`, `tables` | assembly size and mixed working groups |
| incontro, iscrizione | `Event`, `Registration` | meeting (in person and/or online) and signing up to it |
| profilo: candidato / eletto | `Profile`, `ProfileRole.CANDIDATE / ELECTED` | who answers questions in an electoral process |
| fase | `Phase` | a step of the process timeline; one is current (`ora`), later ones are `poi` |
| il mio spazio | account page | `/io` |
| registrati, entra, esci | register, log in, log out | handled by Keycloak through the web server |
| gestione | management | `/gestione` |

## People and accounts

- A person **registers** on Keycloak's registration page with first name, last name, email and
  password, and confirms the email before the first login. Keycloak keeps the credentials;
  the app never sees them.
- The app's `Account` is linked to the Keycloak user by its id (`sub`) and holds the display
  name, the language (`it` or `en`) and the person's data. It is created on the first
  authenticated call to the API. The display name starts as "first name + last name" and can
  be changed on `/io`.
- Administrators are accounts with the Keycloak realm role `admin`.
- Public pages show a person as **first name + initial of the surname** ("Laura G."), built
  from the display name. The full name appears only where the person chose it (the signer
  list).
- Deleting an account removes signatures, votes, applications, event registrations and
  organisation memberships, then the Keycloak user; contributions and comments stay with the
  author shown as anonymous. See [privacy-and-security.md](privacy-and-security.md).

## Organisations

- Any registered person can request a space with name, kind (`associazione`, `comitato`,
  `partito`, `istituzione`), website and a two-line description. The request is verified by
  an administrator before the organisation goes online.
- Members of an organisation can open and manage its processes, moderate, run the lottery
  and export data. Every export is written to the export log.
- Each organisation has a public page `/o/<org-slug>` with its kind, description, website
  and open processes, newest first; the tab title is "<name> — Partecipa". *(not built yet)*
- Only verified organisations appear anywhere public: on the home page, on `/o/<org>`, and
  through their processes.

## Processes (common to every type)

- A process belongs to one organisation, has a slug (`/o/<org>/<slug>`), title, summary,
  description, scope, language of its content, start and end dates, status and a timeline of
  phases. Its UI chrome follows the viewer's language; its content stays in its own language.
- The process page shows the type badge, status, scope, key counters, the timeline, the
  description, the type-specific block, contributions, meetings and the embed code.
- Each type has a colour, used everywhere for its badge and accents: initiative orange,
  assembly emerald, consultation sky, electoral violet (Tailwind `*-600` / `*-50` / `*-200`).
- **Counters are counts of stored rows**, never stored totals:
  - signatures: rows in `signature` for the process;
  - applications: rows in `application`;
  - contributions: rows in `contribution`, of every kind;
  - votes: rows in `vote` on the process's contributions.

  The home page's "persone" counts accounts, "proposte e contributi" counts all contributions,
  and "organizzazioni" counts verified organisations. *(not built yet)*
- The home page lists open processes of verified organisations, ordered by id, filterable by
  type (`/?tipo=`). One process can be **featured** ("In evidenza"): a flag on the process. The
  original's rule for choosing it is not visible, so the flag is set in the dev seed for now and
  will be set from management later. *(not built yet)*
- The embed page `/embed/<org>/<slug>` is a small card with title, summary, counters and a
  link to the full page, meant for an `<iframe>`; it is the only page that may be framed.

## Contributions, votes and comments

- A registered person can write a proposal (title + text) on any open process. Statements,
  questions and recommendations have their own forms.
- **One vote per person per contribution.** Voting again with the same value keeps it;
  another value replaces it. Support counts and percentages are computed from stored votes.
- Consultation statements show the counts for each value and the percentages agree /
  against / pass over the total, plus the total number of votes.
- Lists of proposals and questions are ordered by support, highest first.
- A comment has a stance (for, neutral, against) and a text. The contribution page `/c/<id>`
  shows the contribution, its votes and the discussion.

## Popular initiative

- A signature needs first name, surname, an optional city, and the acknowledgement of the
  notice. Two optional consents: the organisation may e-mail the person about this initiative;
  the name may appear in the public signer list.
- The page shows signatures against the target, the opted-in signers as "Nome Cognome
  (Comune)", and the geography (signatures per city, top cities first).
- A signature can be withdrawn from the process page.
- Where the law requires a legal signature, the page links to the public SPID/CIE platform.

## Citizens' assembly

- An application asks for gender, age band, education and area (the strata), plus the
  acknowledgement that these data serve only the lottery. No name is shown to the organisation
  before the draw.
- The process defines the seats, the tables and the categories of each stratum (e.g. age bands
  16-29, 30-44, 45-64, 65+; areas per country).
- Only selected members write and vote recommendations. Everyone can read them and send
  contributions to the assembly.

### The lottery

- **Stratified:** seats are allocated to strata in proportion to target population shares, and
  people are drawn at random within each stratum. Reserves are drawn the same way.
- **Public and reproducible:** the draw publishes its seed, the anonymous list of applications
  (an opaque id and the strata answers) and the algorithm. Re-running the published algorithm
  on the published list with the published seed gives the same members and reserves.
- **Deterministic code:** the draw takes the seed, the list in a defined order and the quotas,
  and uses a seeded generator with a documented algorithm. It never reads the clock or a global
  random source. The exact algorithm is decided in the assembly feature and documented here.
- After the draw the organisation sees the contacts of selected people and reserves only.

## Candidates and elected

- An electoral process has profiles (name, role candidate or elected, list or institution,
  short bio). Profiles are invented in the demo.
- People ask a question to one profile and support others' questions. A profile's answer is
  public, with its date. `/rappresentanti` lists every profile with questions received and
  answered.
- The process may also have programme items and proposals for the programme.

## Meetings

- A meeting has a date and time, a title, a place and/or an online link, a description and an
  optional capacity. Registered people sign up; the page shows "registered / capacity".
