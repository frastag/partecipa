# Privacy and security

The rules on personal data and access. They are product requirements: a change that breaks
one is a bug even if every test passes. Use the `privacy-check` skill for any change that
touches them. The privacy rules started from the original prototype's `/privacy` page; the
login is ours (Keycloak).

**Status:** partly built (scaffold, 2026-11-25): the web session cookie, the security headers,
and token validation in the API. Login, roles in use, export and deletion are not built yet.

## Registration and login

- **People register before taking part.** Reading public pages needs no account; signing,
  voting, applying, commenting and proposing do. "Entra" and "Registrati" send the person to
  Keycloak's login and registration pages.
- **Keycloak owns credentials.** Registration asks for email, first name and last name; the
  link in the verification e-mail then asks the person to set a password. No login is
  possible before the email is verified. Password reset, brute-force
  protection and the password policy are Keycloak's (see
  [infrastructure.md](infrastructure.md), "The Keycloak realm"). The app never receives,
  stores or logs a password.
- **Flow (BFF):**
  1. `GET /entra?next=<path>`: the web server stores `next` (local paths only, no open
     redirect), a PKCE verifier, `state` and `nonce` in the session, and redirects to
     Keycloak's authorization endpoint with `ui_locales`. `/registrati` does the same with
     Keycloak's registration page.
  2. `GET /auth/callback`: the web server checks `state`, exchanges the code (client secret +
     PKCE verifier), validates the ID token and `nonce`, rotates the session id, stores the
     tokens in the session, calls `GET /api/v1/me` (which creates the account on the first
     login), and redirects to `next`.
  3. Before each API call the web server refreshes the access token if it expires within 30
     seconds. A failed refresh ends the session and the page asks to log in again.
  4. `POST /esci` destroys the session and redirects to Keycloak's end-session endpoint with
     `id_token_hint`, so the Keycloak session ends too.
- **Administrators** are accounts with the realm role `admin`, and must use two-factor
  authentication. There is no separate admin login.

## Tokens and the API

- The API accepts only `Authorization: Bearer <JWT>` and keeps no session. It validates the
  signature (JWKS from the issuer), `iss`, `exp` and that `aud` contains `partecipa-api`.
  Roles come from `realm_access.roles`.
- The account is identified by the token's `sub`. The API never trusts a user id sent in a
  request body or path for "who am I".
- Authorisation is checked in the back end on every request (`@PreAuthorize` or service
  checks), never only by hiding a button. Every endpoint that is not public has a test for
  the forbidden case.
- The API has no cookies, so it needs no CSRF token. Public read endpoints are reachable
  without a token.

## Session and requests (web)

- On the app's origin there is one cookie: the web session id, signed, `__Host-partecipa`
  with `Secure; HttpOnly; SameSite=Lax; Path=/` (on plain `http://localhost` it is named
  `partecipa`, without `Secure`). Tokens live in Valkey, never in the cookie, in
  `localStorage` or in the page.
- Keycloak sets its own cookies on its own host, only for its login session.
- Every state-changing request to the web server (a form `action`) checks that the `Origin`
  header equals `PUBLIC_ORIGIN`, on top of `SameSite=Lax`.
- Session lifetime follows Keycloak's: when the refresh token is no longer valid, the web
  session ends.
- Anonymous visitors get a session only when they switch language or start a login.

## Headers

```
Content-Security-Policy: default-src 'self'; img-src 'self' data:; base-uri 'self';
  form-action 'self'; frame-ancestors 'none'; script-src 'self' 'nonce-<per request>'
X-Content-Type-Options: nosniff
Referrer-Policy: same-origin
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains   (production)
```

- `/embed/**` is the exception: it allows framing (`frame-ancestors *`, no `X-Frame-Options`).
- Pages rendered by React Router get a per-request nonce, passed to `renderToPipeableStream`,
  `<Scripts>` and `<ScrollRestoration>` (`frontend/app/entry.server.tsx`). Never
  `'unsafe-inline'`.
- The API sends `nosniff`, `no-store` on personal responses, and no CSP (it serves JSON only).

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

The email lives in Keycloak and in the token. The app copies it into the account only where
a rule needs it (a consented signature) *(assumption)*. Every export by an organisation is
written to the export log (who, when, which process, which fields).

## The user's rights

- `/io/dati.json` downloads everything about the user: the account, everything they wrote,
  signed, voted and registered for, and their Keycloak profile (name, email, creation date).
- Account deletion requires typing `ELIMINA`. In one transaction it deletes signatures, votes,
  applications, registrations and memberships, and keeps proposals and comments without the
  name. After the commit it deletes the Keycloak user; if that call fails, a retried module
  event finishes it. A test checks every table that references the account.
- A signature or an application can be withdrawn from the process page.

## Data collection and logs

Only what is needed: the registration data Keycloak asks for, and what the person writes when
signing or applying. Strata answers serve only that assembly's lottery. No tracking, no ads,
no third-party requests at runtime. Logs never contain emails, tokens, names or cities: log
account ids and Keycloak `sub`s.
