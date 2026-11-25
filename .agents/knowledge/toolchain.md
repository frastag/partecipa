# Toolchain on the development machine

macOS (Darwin 25.6, arm64), shell zsh. First observed on 2026-11-18 for the prototype
repository; rechecked on 2026-11-25 where stated.

| Tool | State | Consequence |
|---|---|---|
| Docker runtime | Docker Desktop, client and server 29.9.3 (2026-11-25). Installed for the user, so the CLI is **not on PATH**: it is in `/Applications/Docker.app/Contents/Resources/bin`, plugins (compose, buildx) in `~/.docker/cli-plugins`, socket `~/.docker/run/docker.sock` (no `/var/run/docker.sock`) | prefix commands with `PATH=/Applications/Docker.app/Contents/Resources/bin:$PATH`, or ask the user to add it to their shell profile. Testcontainers finds Docker Desktop's socket by itself |
| Homebrew | `/opt/homebrew/bin/brew` (2026-11-25) | one way to install Colima or OrbStack, by the user |
| Java | OpenJDK 26.0.2.1 (default, 2026-11-25) and 26.0.1 in `~/Library/Java/JavaVirtualMachines` | compiles a Java 25 target with `--release 25`; CI uses Temurin 25 |
| Maven | not installed | use the wrapper `backend/mvnw` (created by the scaffold) |
| Gradle | not installed | not used |
| Node | v24.15.0 via nvm, npm 11.12.1 | React Router and Vite through the npm scripts |
| React Router CLI | not installed globally (none needed) | `npx create-react-router@latest` for the scaffold, then the npm scripts |
| PostgreSQL (`psql`) | not installed (2026-11-25) | use `docker compose exec postgres psql` |
| Python | `python3` 3.14 from python.org | its `urllib` fails TLS verification without `SSL_CERT_FILE=/etc/ssl/cert.pem`; prefer Node for helper scripts |
| `gh` | logged in as `frastag` with a fine-grained token | if it can't see `frastag/partecipa`, the token must be extended (see AGENTS.md, "GitHub") |
| Google Chrome | installed, runs headless with a throwaway `--user-data-dir` (2026-11-19) | `--screenshot` for pictures; `--virtual-time-budget` freezes animations, so read their end state in real time |
| Playwright browsers | cached in `~/Library/Caches/ms-playwright` (2026-11-19) | `npx playwright install chromium` may have nothing to download |

## Versions

Pinned by the scaffold on 2026-11-25 (sources: Maven Central `maven-metadata.xml`, `npm view`,
Docker Hub and quay.io tag lists).

| Area | Pinned |
|---|---|
| Back end | Spring Boot 4.2.0 (manages Flyway 12.11.0, Hibernate 7.4.15, Jackson 3.1.8, PostgreSQL JDBC 42.7.14, Testcontainers 2.0.5), Spring Modulith 2.2.0, springdoc-openapi 3.2.1, ShedLock 7.12.0 (when the first job arrives), testcontainers-keycloak 4.4.1 (step 2) |
| Build and quality | Maven 3.10.2 through wrapper 3.3.4 (Maven 4 is still a release candidate), Spotless 3.12.0, Error Prone 2.53.0, Checkstyle 14.4.0 with maven-checkstyle-plugin 3.6.0, JaCoCo 0.8.16 |
| Front end | React 19.3.1, React Router 8.5.3, Vite 8.3.8, Tailwind CSS 4.3.5, i18next 27.2.9, react-i18next 18.0.3, openid-client 6.9.1 (step 2), Vitest 5.1.2, Testing Library React 16.3.3, Playwright 1.65.1, axe-core/playwright 4.14.1, openapi-typescript 7.13.0, openapi-fetch 0.17.0, Prettier 3.10.1 |
| Front-end constraints | **TypeScript 5.9.3**, not 7.0: typescript-eslint 8.74 needs TypeScript < 6.1 and openapi-typescript 7.13 needs TypeScript 5. **ESLint 9.39.5**, not 10: eslint-plugin-jsx-a11y 6.10.2 supports ESLint up to 9 |
| Images | `postgres:18.7` (19.0 was released days before; managed services rarely offer a new major at once), `quay.io/keycloak/keycloak:26.8.2`, `valkey/valkey:9.2.0-alpine`, `axllent/mailpit:v1.34.0` |

Recheck these constraints when Dependabot proposes TypeScript 6+/7 or ESLint 10. npm warns
that ESLint 9.39.5 "is no longer supported" (2026-11-25): move to ESLint 10 as soon as
eslint-plugin-jsx-a11y supports it.

- `search.maven.org` returned outdated "latest" versions on 2026-11-18. Use
  `repo1.maven.org/maven2/<group path>/<artifact>/maven-metadata.xml` instead.
- In the prototype, Error Prone and google-java-format on JDK 26 needed `--add-exports` lines
  in `backend/.mvn/jvm.config`.

## Observed quirks

- Claude Code's Read tool cannot open files in the main checkout's `tmp/` from a worktree
  session (`blockReadsOutsideWorkingDirectories`); shell commands can (2026-11-19).
- Python 3.14 has Pillow 12 (pixel diffs of screenshots) (2026-11-19).
- Playwright 1.65.1 downloaded its Chrome Headless Shell 159 (build 1255) on 2026-11-25.
- `start.spring.io` (2026-11-25) generated Spring Modulith `2.2.0-M1` and the Boot version
  `4.2.0.RELEASE`, which doesn't exist on Maven Central: use `4.2.0` and the Modulith release.
- Keycloak 26.8 accepts Admin API calls only from tokens carrying the `kc-admin-api` client
  scope; its registration form asks for the password only after email verification
  (2026-11-25, see docs/infrastructure.md).

## Open

- Nothing yet.
