# Toolchain on the development machine

macOS (Darwin 25.6, arm64), shell zsh. First observed on 2026-11-18 for the prototype
repository; rechecked on 2026-11-25 where stated.

| Tool | State | Consequence |
|---|---|---|
| Docker runtime | **not installed** (2026-11-25: no `docker`, `colima`, `orbstack` or `podman`; no Docker app in `/Applications`). The user chose to install one (2026-11-25) | until it is installed, `infra/compose.yaml` and Testcontainers can't run: the scaffold's back-end tests fail. Ask the user to install it; don't install it yourself |
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

Pin versions at the scaffold and record them here with the date and the source
(start.spring.io metadata, Maven Central `maven-metadata.xml`, `npm view`, the image
registry). Reference from the prototype on 2026-11-18: Spring Boot 4.1.2, Maven 3.10.1 through
the wrapper, Spotless 3.11.0, Error Prone 2.53.0, Checkstyle 14.4.0, JaCoCo 0.8.16,
Tailwind CSS 4, Vitest 5. To check at the scaffold: Spring Modulith, Testcontainers and the
Keycloak Testcontainers module, React, React Router, react-i18next, openid-client, and the
images of PostgreSQL, Keycloak, Valkey and Mailpit.

- `search.maven.org` returned outdated "latest" versions on 2026-11-18. Use
  `repo1.maven.org/maven2/<group path>/<artifact>/maven-metadata.xml` instead.
- In the prototype, Error Prone and google-java-format on JDK 26 needed `--add-exports` lines
  in `backend/.mvn/jvm.config`.

## Observed quirks

- Claude Code's Read tool cannot open files in the main checkout's `tmp/` from a worktree
  session (`blockReadsOutsideWorkingDirectories`); shell commands can (2026-11-19).
- Python 3.14 has Pillow 12 (pixel diffs of screenshots) (2026-11-19).

## Open

- Which Docker runtime the user installs, and whether Testcontainers needs extra settings
  with it.
