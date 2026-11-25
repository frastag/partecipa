---
name: parity-check
description: Use when a page of our app must be compared with the same page of the original site (after building or changing a page, a text, a form or a layout), when the user asks "does it match the original?", or to refresh the snapshot of the original in tmp/original-snapshot. Not for reviewing personal-data rules (use privacy-check) or for unit-test failures.
---

# Parity with the original

Reduces a page of the original (<https://prototipo.michelangelogigli.it/>) and the same page
of our SSR server to an outline (headings, texts, links, form fields with `required`, buttons)
and diffs them. The script is `parity.mjs` next to this file; read its header before running it.

## Before you start

- Our app must be running in the `dev` profile: back end on 8080, front end on 5173
  (`npm run dev` in `frontend/`, which already renders on the server). To check the
  production build, use `npm run build && npm start` and pass `--local http://localhost:3000`. Start them in the background from the worktree if they aren't up,
  and note them in `handover.md`.
- Logged-in pages need `--login` and the `PARTECIPA_EMAIL` environment variable. Ask the user
  for the email if it isn't set; never write it into a file.
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
- Compare every page the change touches, and for a process page every type it affects
  (`/o/associazione-luca-coscioni/iniziativa-di-esempio`, `/o/eumans/european-citizens-assembly-demo`,
  `/o/eumans/consultazione-di-esempio`, `/o/associazione-luca-coscioni/candidati-ed-eletti-esempio`).
- Check the English UI too when labels changed: add `--lang en`. Both sides first get
  `GET /lingua/en`, which changes only our own session, and the files are named
  `<page>.en.*`. Look at one outline to make sure both sides really are in English. The crawl
  still skips `/lingua/` on purpose, so the snapshot stays Italian.

## Read the diff

Sort every difference into one of these, and write the list in `tmp/<task>/parity/README.md`:

- **Sample data** (names, counts, dates that changed on the demo): expected, no action.
- **Not built yet**: a block the plan leaves for a later step; name the step.
- **Intended**: an accepted difference (e.g. form actions point to our API); say who decided.
- **Bug**: a different label, missing field, missing `required`, different order, different
  link. Fix it, or report it.

The outline doesn't show styling. Also look at the page in a browser at 375 px and 1280 px next
to the original, and say what you compared.

## Refresh the snapshot of the original

```bash
node .agents/skills/parity-check/parity.mjs crawl --out tmp/original-snapshot [--login]
```

Refresh when the snapshot is older than a week, or a page is missing from it. Compare the new
`outline.txt` with the old one; if the original's behaviour or texts changed, update
`.agents/knowledge/original-site.md` with the date and tell the user.
