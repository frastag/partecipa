---
name: session
description: Use when the user starts or resumes a task with a handover folder, refers to "the tmp folder" or tmp/<task-name>, asks to read or write handover/findings files, asks whether a session folder for a topic exists, or wraps up a task (commit message, PR description, "are the files up to date").
---

# Session task folder

Sets up a project-local task folder as the working memory for this task. Handover notes,
findings, plans, parity diffs, helper scripts and snapshots live there and survive across
sessions.

## The folder

The skill argument is the task name (e.g. `/session firma-iniziativa`). Without an argument,
infer a short slug from the conversation, and ask only if nothing fits.

The task folder is always `<project root>/tmp/<task-name>`. It is git-ignored. Never interpret
"tmp" or "the tmp folder" as `/tmp`, `$TMPDIR` or the session scratchpad: the folder is
deliberately inside the repo so that it persists.

## On invocation

1. Read `AGENTS.md` at the project root and follow it. `/session` is often the first prompt of
   a session and skips normal onboarding.
2. If the folder exists:
   - list its contents;
   - read `handover.md` first, or the other `.md` files newest first if it is missing;
   - report the goal, where things stand and the next steps, before doing anything else.
3. If the folder doesn't exist, create it with a `handover.md` from the template below, and
   say that this is a fresh task.

Treat handover notes as context, not as truth: verify claims against the code before acting on
them.

## Finding an existing folder

Never guess a folder name. Search names and goals:

```bash
ls tmp
grep -il '<keyword>' tmp/*/handover.md
```

Name the matches with their goal line and let the user pick.

## During the session

- Put task artifacts in the folder: findings, parity diffs, screenshots, plans, helper
  scripts. Read a helper script before running it. Never put production code there.
- Save the command output you reason from (parity diffs, failing test output, coverage
  summaries) as files in the folder, so a later session can compare against it.
- For a server started in the background in this session, note in `handover.md` the command,
  the port and how to stop it.
- Keep `handover.md` current without being asked. Update it after each finished step, each
  user decision and each changed plan, in the same turn.
- If the folder holds a `plan.md` with a Progress table (the `feature` skill creates one),
  update the table in the same turn as each step. `handover.md` then only points to the current
  step instead of repeating the plan.

## handover.md template

```markdown
# <task name>

**Goal:** <one sentence>
**Status:** <in progress | blocked on … | done>
**Worktree:** <absolute path, or "none">

## Decisions
- <date>: <decision and why>

## Done
- <step> — <evidence: file in this folder, test, parity diff>

## Running
- <command> — started <date time>, port <n>; stop with <how>

## Next
- <step>

## Open questions
- <question> — <who can answer>
```

## Wrapping up

Only on the user's request. Never suggest a commit message or write a PR description on your
own because the work looks done. The user runs git; never commit or push.

- **"wrap up"**: all of the parts below except removing the worktree.
- **Handover** ("I'm stopping", "are the files up to date?"): bring `handover.md`, and `plan.md`
  if present, up to date. Stop servers you started. Say in one line where the next session
  starts.
- **Docs check:** `docs/` and `.agents/knowledge/` reflect what was learned, and "not built
  yet" markers are accurate, as AGENTS.md requires.
- **Commit message:** one line in chat, in English, lowercase imperative, no trailing period,
  no body (e.g. `add signature form to initiative page`).
- **PR description:** write `pr-description.md` in the task folder from
  `pr-description-template.md` next to this file. It covers what changes and why, the impact
  for users, and how it was verified, with real results. Plain Markdown that can be pasted into
  the GitHub PR, which uses `.github/pull_request_template.md`.
- **Worktree** ("the PR was merged", "remove the worktree"): first check the worktree for
  anything untracked that matters, and move it to the main checkout's `tmp/<task>/` and say so.
  Then run `git worktree remove <path>`, never with `--force` unasked. Run
  `git branch -D <branch>` only if the user asks.
