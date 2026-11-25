---
name: privacy-check
description: Use before saying a change is done when it stores, shows, exports, logs or deletes personal data (accounts, signatures, applications, the lottery, votes, comments, organisation exports, /io/dati.json, account deletion), or touches registration, login, tokens, sessions, roles or the Keycloak realm, or when the user asks whether something respects privacy or security. Not for comparing pages with the original prototype (parity-check).
---

# Privacy check

Reviews a change against the rules in `docs/privacy-and-security.md` and "Behaviour that must
not regress" in AGENTS.md. The output is a short written review in the task folder, with each
rule marked as respected, broken or not affected, and evidence.

## Steps

1. Read `docs/privacy-and-security.md`. List the personal data the change touches: which
   fields, in which tables, shown where, to whom.
2. Read the diff (`git -C <worktree> diff origin/main...`) and answer each question below with
   a file and line, or a test name:
   - **Visibility:** does every new response field match the "Who sees what" table? Look at
     the response records, not the templates: hidden in the UI is not hidden.
   - **Names:** are people shown as "Nome I." everywhere except the opted-in signer list?
   - **Consent:** is an email reaching an organisation only with `consenso_org`? Are applicant
     names hidden from the organisation before the draw?
   - **Authorisation:** is every new endpoint protected in the back end, with a test for the
     forbidden case (another user, a non-member, a visitor)?
   - **Export:** does `/io/dati.json` include the new data? Is every organisation export
     written to the export log?
   - **Deletion:** does account deletion remove the new user-owned rows (through the
     `AccountDeleted` event), or anonymise them if they are contributions or comments? Is
     there a test? Is the Keycloak user still deleted?
   - **Logs:** no email, name, token or city in log calls or exception messages, on both the
     API and the web server.
   - **Collection:** is every new field needed? Is it optional where the original makes it
     optional?
   - **Tokens:** do tokens stay on the web server (`*.server.ts`, Valkey), never in the page,
     a cookie value or `localStorage`? Does the API still validate issuer, audience and
     expiry, and take the person only from `sub`?
   - **Login and session** (if touched): PKCE, `state` and `nonce` checked, local `next` only,
     session id rotated at login, one `__Host-` cookie, `Origin` check on writes, logout ends
     the Keycloak session too, security headers unchanged.
   - **Keycloak realm** (if touched): email verification still required, brute-force
     protection on, two-factor for admins, the admin service account still limited to
     `manage-users`, no new client with broader scopes or redirect URIs than needed.
   - **Stateless API:** no new HTTP session or in-memory state about people.
3. Run the tests that cover these rules and save the output in the task folder.
4. Write `tmp/<task>/privacy-check.md`: one line per question with the verdict and the evidence,
   then the issues found. Fix the broken ones, or stop and tell the user if a fix changes
   behaviour.

Report in chat: the verdict in one sentence, the issues by short name, and what you could not
verify (for example, behaviour of the original that wasn't observable from a regular account).
