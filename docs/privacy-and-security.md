# Privacy and security

The rules on personal data and access, taken from the original's `/privacy` page and
behaviour. They are product requirements: a change that breaks one is a bug even if every test
passes. Use the `privacy-check` skill for any change that touches them.

**Status:** not built yet.

## Login

- **Magic link.** `POST /api/auth/magic-link` with an email creates a single-use token valid
  20 minutes and e-mails `https://<host>/entra/<token>`. The reply never says whether the email
  already has an account.
- **Confirmation by POST.** Opening the link shows "Entra come <email>" and a "Conferma ed
  entra" button. Only the POST consumes the token and logs in. A GET never logs anyone in,
  because mail scanners prefetch links.
- **First login** creates the account and redirects to `/io?next=…` with the message
  "Benvenuta, benvenuto. Scrivi il nome con cui vuoi comparire."
- **Tokens** are random (at least 256 bits, URL-safe), stored only as a hash, and expire.
  The `next` parameter accepts only local paths (no open redirect).
- **Administrators** log in at `/entra/password`; passwords are hashed with a slow algorithm
  (Spring Security `DelegatingPasswordEncoder`, Argon2 or bcrypt). Rate-limit both logins.
- In `dev` no e-mail is sent: the page shows "Ambiente di prova, nessuna email parte davvero"
  and the link, as in the original. This must be impossible in production (profile check at
  startup).

## Session and requests

- One cookie: the session, `Secure; HttpOnly; SameSite=Lax; Path=/`. No other cookie, no
  `localStorage` for personal data.
- CSRF protection on every state-changing request, with the `X-XSRF-TOKEN` header added by
  the front end's API client (`app/core/api`) when a loader or action calls the back end. **Open:** Spring Security's cookie token repository adds an
  `XSRF-TOKEN` cookie, which conflicts with "one cookie" above; the original keeps the token in
  the session. To be decided in the account step of the build order.
- The session also holds the language (`/lingua/{code}`), so anonymous visitors get a session
  cookie, as on the original.
- Authorisation is checked in the back end on every request (`@PreAuthorize` or service
  checks), never only by hiding a button.

## Headers (as the original)

```
Content-Security-Policy: default-src 'self'; img-src 'self' data:; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: same-origin
X-Frame-Options: DENY
X-Robots-Tag: noindex, nofollow        (while it is a demo)
```

`/embed/**` is the exception: it allows framing (`frame-ancestors *`, no `X-Frame-Options`).
SSR inline state must work under this CSP: React Router inlines the loader data and the
hydration script, so pages rendered by React Router add
`script-src 'self' 'nonce-<per request>'` to the policy above, with the nonce passed to
`renderToPipeableStream`, `<Scripts>` and `<ScrollRestoration>` (`frontend/app/entry.server.tsx`),
never `'unsafe-inline'`. Spring Boot sends the policy above
unchanged on its own responses (`shared/security/SecurityConfig`).

## Who sees what

| Data | Public | Organisation running the process | Platform |
|---|---|---|---|
| account email | never | only signers who ticked "può scrivermi" | yes |
| display name | as "Nome I." on contributions and comments | same | yes |
| signature: name, surname, city, date | only if "Mostra il mio nome" (name + city) | yes | yes |
| geography of signatures | counts per city | yes | yes |
| assembly application strata | only in the anonymous lottery list | no names before the draw | yes |
| selected members and reserves | no | contacts after the draw | yes |
| votes | only counts | only counts | yes |

Every export by an organisation is written to the export log (who, when, which process,
which fields).

## The user's rights

- `/io/dati.json` downloads everything about the user (shape in [routes.md](routes.md)).
- Account deletion requires typing `ELIMINA`. It deletes signatures, votes, applications,
  registrations and memberships at once, and keeps proposals and comments without the name.
  It runs in one transaction; a test checks every table that references the user.
- A signature or an application can be withdrawn from the process page.

## Data collection

Only what is needed: the email to log in, what the person writes when signing or applying.
Strata answers serve only that assembly's lottery. No tracking, no ads, no third-party
requests at runtime. Logs never contain emails, tokens or names (log ids).
