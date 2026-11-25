---
paths:
  - "backend/**/*.java"
  - "backend/**/*.sql"
  - "backend/pom.xml"
applyTo: "backend/**/*.java,backend/**/*.sql,backend/pom.xml"
---

# Java code style

Prefer the style of nearby files when it is more specific than this page. The rules below are
the baseline for new code. Comments follow the rule in [AGENTS.md](../AGENTS.md): short, and
only for what the code cannot say.

`./mvnw verify` must pass. Formatting is google-java-format through Spotless: run
`./mvnw spotless:apply` instead of formatting by hand. Checkstyle and ArchUnit enforce the
rest of what can be checked.

## Language level and project

- Java 25. Use records, sealed interfaces, pattern matching for `switch` and `instanceof`,
  text blocks, `var` where the type is obvious from the right-hand side.
- One Maven module. Package root `it.partecipa`, then one package per feature (see
  [architecture.md](architecture.md)). No `util` or `helper` packages: a helper belongs to
  the feature that uses it, or to `shared` if two or more do.
- Dependencies only in `pom.xml`, versions managed by the Spring Boot parent or a property.

## Classes and dependencies

- Constructor injection only, with `final` fields. No `@Autowired` on fields or setters.
  A single constructor needs no annotation.
- Services are package-private where possible; a feature's public surface is its service
  interface/class and its DTO records.
- Controllers are thin: validate the request record, call one service method, map the result.
  No business rule, no repository access, no transaction in a controller.
- `@Transactional` on service methods that write. Read methods use `@Transactional(readOnly = true)`
  when they touch lazy associations.
- Inject `java.time.Clock` instead of calling `Instant.now()`, and a `RandomGenerator` built
  from a recorded seed instead of `Math.random()` or `new Random()`.

## Data types

- Request and response bodies are **records** (`SignatureRequest`, `ProcessCardResponse`).
  Never expose JPA entities in the API.
- Public JSON with Italian keys (`/api/processi`, `/io/dati.json`) uses `@JsonProperty` on
  every component, so a Java rename never changes the contract.
- Closed sets are `enum`s (`ProcessType`, `Stance`), stored as strings
  (`@Enumerated(EnumType.STRING)`) and mapped to the original's Italian values at the edge.
- Use `Optional` only as a return type for "may be absent". Never as a field or parameter.
- Collections returned are unmodifiable (`List.copyOf`, `stream().toList()`).
- Money-like counts are `int`/`long`; dates are `LocalDate`, instants are `Instant` (UTC in
  the database, formatted for the user in the front end).

## JPA and the database

- Entities have a protected no-arg constructor, a meaningful constructor or factory, and
  methods that keep their invariants (`signature.withdraw()`), not public setters for
  everything.
- Ids are `Long` with database sequences. Equality of entities is by id, with a stable
  `hashCode`.
- Associations are `LAZY`. Fetch what a page needs with a query or an entity graph; watch for
  N+1 (enable `spring.jpa.properties.hibernate.generate_statistics` in a test when unsure).
- Invariants that the database can enforce are enforced there too: unique `(user_id,
  contribution_id)` on votes, `NOT NULL`, foreign keys, `CHECK` on vote values.
- Migrations: `V<yyyyMMddHHmm>__<what>.sql` in `src/main/resources/db/migration`. Never edit
  a merged migration; add a new one. Demo data lives in a separate `dev` location
  (`db/seed-dev`), loaded only by the `dev` profile.

## Errors

- A failure the user should understand is a `PartecipaException` subclass carrying an
  `ErrorCode` (`MAGIC_LINK_EXPIRED`, `ALREADY_SIGNED`). The `@RestControllerAdvice` maps it to
  a `ProblemDetail` with the code; the front end owns the text.
- Validation errors become a `ProblemDetail` with a list of `{field, code}`.
- Translate third-party exceptions once, at the boundary, chaining the cause.
- Never catch `Exception` or `Throwable`. Catch the narrowest type where you can react.
- Programming errors use built-in exceptions with English messages
  (`IllegalStateException("draw already executed")`).

## Logging

- SLF4J, `private static final Logger log = LoggerFactory.getLogger(X.class);`.
- Placeholders, not concatenation: `log.info("draw {} executed for process {}", drawId, processId)`.
- **Never log personal data**: no emails, names, tokens, cities. Log ids.
- `info` for state changes worth auditing (draw executed, organisation verified, export),
  `debug` for diagnostics, `warn` for recoverable problems, `error` only with the exception.

## Naming and size

- Classes are nouns (`LotteryService`), methods say the outcome (`drawMembers`,
  `withdrawSignature`), booleans read as questions (`isOpen`, `hasConsented`).
- Keep methods short; return early for guard cases. A method over ~30 lines is a sign to
  split.
- `final` on local variables only when it helps reading; not everywhere.

## Tests

- JUnit 5 + AssertJ. Name tests after the behaviour:
  `voting_again_with_another_value_replaces_the_vote()`.
- Arrange data with small builders or factory methods in `src/test/java/.../TestData.java`
  per feature, not with the dev seed.
- Use `@ParameterizedTest` for lists of inputs (vote values, invalid emails, strata).
- Mock only across feature boundaries and external systems (mail). Don't mock the class
  under test, value objects or repositories in integration tests.
- Assert on results, HTTP responses and database state, never on log output.
- Integration tests are `*IT` and run with Failsafe in `verify`.

## Tooling

```bash
./mvnw spotless:apply      # format
./mvnw verify              # everything CI runs
./mvnw test -Dtest=LotteryServiceTest
```
