# Testing

What we test, where, and how. Tests check logic and contracts; the `parity-check` skill and a
look in the browser check that a page matches the original.

## Quality gates

| Side | Command | Must pass |
|---|---|---|
| back end | `cd backend && ./mvnw verify` | unit and integration tests, Spotless, Checkstyle, ArchUnit, JaCoCo ≥ 80% lines on services |
| front end | `cd frontend && npm run lint && npm test && npm run build` | ESLint, Prettier check, type check, Vitest, production SSR build |
| end to end | `cd frontend && npm run e2e` | Playwright flows and axe checks (needs both servers running) |

CI ([.github/workflows/ci.yml](../.github/workflows/ci.yml)) runs the first two on every pull
request.

## Back end

- **Unit tests** (`*Test`) for services and domain logic, with plain JUnit 5, AssertJ and
  Mockito only for collaborators across features. No Spring context.
- **Slice tests**: `@WebMvcTest` for controllers (status codes, validation codes, JSON field
  names, CSRF, authorisation), `@DataJpaTest` for repository queries and constraints.
- **Integration tests** (`*IT`, Failsafe) with `@SpringBootTest` on embedded PostgreSQL and
  Flyway, for flows that cross features: login → sign → export → delete account.
- **Architecture tests** with ArchUnit: feature boundaries, `shared` independence, no field
  injection, controllers don't touch repositories.
- **Fixed clock and fixed seed.** Inject `Clock` and the lottery seed; never sleep, never read
  `Instant.now()` in code under test.
- Tests that must exist before the related feature is merged:
  - the magic link is single-use, expires after 20 minutes, and a GET does not log in;
  - one vote per person per contribution, and changing it updates the counts;
  - deleting an account empties every user-owned table and anonymises contributions;
  - `/io/dati.json` and `/api/processi` keep the original's keys (JSON snapshot test);
  - the lottery gives identical members and reserves for the same seed and list, and fills
    each stratum's quota;
  - an organisation never receives an email without consent, nor applicant names before the
    draw.

## Front end

- **Unit tests** with Vitest and React Testing Library: components through the DOM (query by
  role and label text, not CSS classes), route modules with `createRoutesStub` or by calling
  their `loader` / `action`, API modules with a stubbed `fetch`.
- Every translation key exists in both `it.json` and `en.json` (a test compares the key sets).
- No hydration warnings: a test renders the main pages on the server and hydrates them with
  the same data, failing on any console error.
- **End-to-end** with Playwright at 375 px and 1280 px: login with the dev link, sign an
  initiative, vote a statement, ask a question, delete the account. Each page runs axe and
  fails on serious or critical violations.

## Parity with the original

The `parity-check` skill fetches a page from the original and from our SSR server, reduces
both to an outline (headings, texts, links, form fields, buttons) and diffs them. Differences
in sample data are expected; differences in labels, structure, fields or rules are bugs.
Save the diff in the task folder and say which differences remain and why.
