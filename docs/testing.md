# Testing

What we test, where, and how. Tests check logic, contracts and security; a look in the
browser checks the pages.

## Quality gates

| Side | Command | Must pass |
|---|---|---|
| back end | `cd backend && ./mvnw verify` | unit, slice and integration tests (Testcontainers), module verification, Spotless, Checkstyle, JaCoCo ≥ 80% lines on services |
| front end | `cd frontend && npm run lint && npm test && npm run build` | ESLint, Prettier check, type check, Vitest, production SSR build |
| end to end | `cd frontend && npm run e2e` | Playwright flows and axe checks against the full local stack |

`./mvnw verify` needs Docker running (Testcontainers). CI
([.github/workflows/ci.yml](../.github/workflows/ci.yml)) runs the first two on every pull
request; GitHub's Ubuntu runners have Docker.

## Back end

- **Unit tests** (`*Test`) for services and domain logic, with plain JUnit 5, AssertJ and
  Mockito only for collaborators in other modules and external systems. No Spring context.
- **Module tests**: `ApplicationModules.of(PartecipaApplication.class).verify()` fails on a
  boundary violation or a cycle; `@ApplicationModuleTest` boots one module with its
  dependencies, and `Scenario` checks the events it publishes and consumes.
- **Slice tests**: `@WebMvcTest` for controllers (status codes, validation codes, JSON field
  names, authorisation) with `spring-security-test`'s `jwt()` post-processor to set `sub` and
  roles; `@DataJpaTest` with a PostgreSQL container for queries and constraints.
- **Integration tests** (`*IT`, Failsafe) with `@SpringBootTest` on PostgreSQL in
  Testcontainers (`@ServiceConnection`) and Flyway, for flows that cross modules. A few use a
  Keycloak container with the dev realm to check real token validation and user deletion
  through the Admin API.
- **Fixed clock and fixed seed.** Inject `Clock` and the lottery seed; never sleep, never read
  `Instant.now()` in code under test.
- One PostgreSQL container is shared by all tests of a run (singleton container), so the
  suite stays fast.
- Tests that must exist before the related feature is merged:
  - a request without a token, with an expired token, or with a token for another audience
    gets 401 on every non-public endpoint;
  - the account is created on the first `GET /api/v1/me` and only once under concurrent
    calls;
  - one vote per person per contribution, and changing it updates the counts;
  - deleting an account empties every user-owned table, anonymises contributions, and deletes
    the Keycloak user (retried if Keycloak is down);
  - the export contains every user-owned table (a test lists them from the schema);
  - the lottery gives identical members and reserves for the same seed and list, and fills
    each stratum's quota;
  - an organisation never receives an email without consent, nor applicant names before the
    draw.

## Front end

- **Unit tests** with Vitest and React Testing Library: components through the DOM (query by
  role and label text, not CSS classes), route modules with `createRoutesStub` or by calling
  their `loader` / `action`, API modules with a stubbed `fetch`.
- **Auth code** (`core/auth`): login builds the right authorization URL (PKCE, `state`,
  `nonce`, `ui_locales`), the callback rejects a wrong `state`, `next` accepts only local
  paths, a token near expiry is refreshed once, writes without a matching `Origin` are
  rejected. The OIDC provider is stubbed.
- Every translation key exists in both `it.json` and `en.json` (a test compares the key sets).
- No hydration warnings: a test renders the main pages on the server and hydrates them with
  the same data, failing on any console error.
- **End-to-end** with Playwright at 375 px and 1280 px against the local stack: register,
  open the verification e-mail through Mailpit's API, log in, sign an initiative, vote a
  statement, ask a question, export the data, delete the account. Each page runs axe and fails
  on serious or critical violations.

## Comparing with the original prototype

The original prototype is inspiration, not a specification. When the user asks to compare a
page with it, use the `parity-check` skill; differences are information, not bugs.
