# Toolchain on the development machine

Observed on 2026-11-18, macOS (Darwin 25.6, arm64), shell zsh.

| Tool | State | Consequence |
|---|---|---|
| Java | OpenJDK 26.0.2.1 (default) and 26.0.1 in `~/Library/Java/JavaVirtualMachines` | compiles a Java 25 target with `--release 25`; CI uses Temurin 25 |
| Maven | not installed | use the wrapper `backend/mvnw` (created by the scaffold) |
| Gradle | not installed | not used |
| Node | v24.15.0 via nvm, npm 11.12.1 | React Router and Vite through the npm scripts |
| React Router CLI | not installed globally (none needed) | `npx create-react-router@latest` for the scaffold, then the npm scripts |
| Docker | not installed | no Testcontainers; tests use embedded PostgreSQL |
| PostgreSQL (`psql`) | not installed | the embedded PostgreSQL brings its own binaries |
| Python | `python3` 3.14 from python.org | its `urllib` fails TLS verification without `SSL_CERT_FILE=/etc/ssl/cert.pem`; prefer Node for helper scripts |
| `gh` | logged in as `frastag` with a fine-grained token | the token could not see this repository in the morning of 2026-11-18; later that day `gh issue view 5 --json …` worked |

## Versions pinned by the prototype's scaffold

Checked on 2026-11-18 for the Angular rewrite (start.spring.io metadata, Maven Central
`maven-metadata.xml`, `npm view`): Spring Boot 4.1.2 (Maven 3.10.1 through the wrapper),
embedded-postgres 2.2.2 with PostgreSQL binaries 18.7.0, ArchUnit 1.5.1, Spotless 3.11.0
(google-java-format), Error Prone 2.53.0, Checkstyle 14.4.0, JaCoCo 0.8.16; Tailwind CSS 4,
Vitest 5. Check them again at this repository's scaffold, together with the React, React
Router and react-i18next versions, and record what was pinned here.

- In the prototype, `./mvnw verify` worked on the default JDK 26 with `--release 25`. Error Prone and
  google-java-format need the `--add-exports` lines in `backend/.mvn/jvm.config`.
- `search.maven.org` returned outdated "latest" versions on 2026-11-18. Use
  `repo1.maven.org/maven2/<group path>/<artifact>/maven-metadata.xml` instead.
- The embedded PostgreSQL needs the `darwin-arm64v8` binaries artifact on this Mac. The Linux
  binaries used by CI come with `embedded-postgres` itself.

## Observed on 2026-11-19

- In the prototype, `./mvnw verify` took about 15 s without other servers, but 20 min while the `dev` back
  end (`./mvnw spring-boot:run`) was running: each test context starting its own embedded
  PostgreSQL waited about 310 s. Stop the dev back end before running the gate.
- Google Chrome is installed (`/Applications/Google Chrome.app`) and runs headless with a
  throwaway `--user-data-dir`: `--screenshot` for pictures, `--remote-debugging-port` plus
  Node's built-in `WebSocket` for real-time checks. Screenshots with `--virtual-time-budget`
  freeze animations (requestAnimationFrame, IntersectionObserver), on the original too; read
  the end state of effects in real time instead.
- Playwright browsers are cached in `~/Library/Caches/ms-playwright`.
- Python 3.14 has Pillow 12 (pixel diffs of screenshots).
- Claude Code's Read tool cannot open files in the main checkout's `tmp/` from a worktree
  session (`blockReadsOutsideWorkingDirectories`); shell commands can.

## Open

- Nothing yet.
