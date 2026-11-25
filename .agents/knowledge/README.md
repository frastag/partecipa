# Knowledge: what this rewrite depends on

Facts about the original site and the development machine, as observed. These are dated,
perishable facts: the original is a live demo that can change, and tools get updated. The code
wins over this for our own behaviour, which is described in [docs/](../../docs/README.md).

| File | Read when |
|---|---|
| [original-site.md](original-site.md) | building or checking a page; a text, field or rule of the original; the demo data |
| [toolchain.md](toolchain.md) | a command is missing or fails; Java, Node, Maven, Docker, `gh` on this machine |

## Editing rules

- Every observation carries its date and how it was observed. Example: "2026-11-18, crawl
  with GET only, logged in as a regular user".
- Keep every qualifier ("not observed", "only as a regular user", "as of <date>") when
  shortening. Unknowns go under **Open**.
- A session that establishes or disproves a fact updates the page in the same session.
- Never write personal data here (emails, real names other than the original's demo data).
- Behaviour of our own code belongs in `docs/`, linked from here when relevant.
