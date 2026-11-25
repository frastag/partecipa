---
name: parity-check
description: Use only when the user asks to compare a page of our app with the original prototype ("how does the prototype do it?", "compare with the original"), or to refresh the snapshot in tmp/original-snapshot. The prototype is inspiration, not a specification, so this is never a required step. Not for privacy reviews (privacy-check) or test failures.
---

# Comparison with the original prototype

The prototype is inspiration only: differences are information for the user, not bugs.

Reduces a page of the original (<https://prototipo.michelangelogigli.it/>) and the same page
of our SSR server to an outline (headings, texts, links, form fields with `required`, buttons)
and diffs them. The script is `parity.mjs` next to this file; read its header before running it.

## Before you start

- Our app must be running in the `dev` profile: back end on 8080, front end on 5173
  (`npm run dev` in `frontend/`, which already renders on the server). To check the
  production build, use `npm run build && npm start` and pass `--local http://localhost:3000`. Start them in the background from the worktree if they aren't up,
  and note them in `handover.md`.
- `--login` logs in only on the original (demo magic link, email from `PARTECIPA_EMAIL`; ask
  the user if it isn't set and never write it into a file). Our side stays anonymous, because
  our login goes through Keycloak: compare logged-in pages by looking at them in a browser.
- The script only reads the original, apart from the demo login. Never add POSTs to it.

## Compare one page

```bash
node .agents/skills/parity-check/parity.mjs compare --path <url path> \
  --out tmp/<task>/parity [--login] [--mask-numbers] [--local http://localhost:5173]
```

- Run it from the worktree, writing to the main checkout's `tmp/<task>/parity` (absolute path).
- `--mask-numbers` replaces numbers with `#`: use it when the only differences are counts and
  dates that drift on the demo. Run once without it to see that the numbers are formatted the
  same way.
- For a process page, the original's examples of each type are
  (`/o/associazione-luca-coscioni/iniziativa-di-esempio`, `/o/eumans/european-citizens-assembly-demo`,
  `/o/eumans/consultazione-di-esempio`, `/o/associazione-luca-coscioni/candidati-ed-eletti-esempio`).
- Check the English UI too when labels changed: add `--lang en`. Both sides first get
  `GET /lingua/en`, which changes only our own session, and the files are named
  `<page>.en.*`. Look at one outline to make sure both sides really are in English. The crawl
  still skips `/lingua/` on purpose, so the snapshot stays Italian.

## Read the diff

Summarise the differences for the user in `tmp/<task>/parity/README.md`, grouped as:

- **Sample data**: names, counts, dates. No action.
- **Not built yet**: a block the plan leaves for a later step; name the step.
- **Ours by design**: a difference our docs decide (login, URLs, texts).
- **Idea worth considering**: something the prototype does that we don't. Propose it to the
  user; never change our behaviour only because the prototype differs.

The outline doesn't show styling. Also look at the page in a browser at 375 px and 1280 px next
to the original, and say what you compared.

## Refresh the snapshot of the original

```bash
node .agents/skills/parity-check/parity.mjs crawl --out tmp/original-snapshot [--login]
```

Refresh only when the user asks or a page is missing from it. If the prototype's behaviour or
texts changed, update `.agents/knowledge/original-site.md` with the date.
