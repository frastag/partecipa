---
name: feature
description: Use when the user asks to develop a new feature or a behaviour change in Partecipa ("/feature …", "/feature #12", "make the initiative page…", "add the lottery", "do the scaffold"), including the next step of the build order in docs/architecture.md, or resumes one. Not for a privacy review alone (privacy-check), comparing with the original prototype (parity-check), bug investigations or one-line fixes.
---

# Develop a feature

Turns a request into an agreed plan, then into code on its own branch. A plan file with a
progress table makes the work resumable across sessions. The user reviews and commits; you
never commit.

## 1. Task folder and request

Feature requests live as GitHub issues in `frastag/partecipa`, with the "New
feature" template. Most features are a step of the "Build order" in
`docs/architecture.md`.

1. **Find the source of the request:**
   - **An issue number** (`/feature #12`, "la issue 12"): read it with
     `gh issue view 12 --json title,body,comments,url`. The issue, including its comments, is
     the request; the chat message only adds to it. Use `issue-<n>-<slug from the title>` as
     the task slug (e.g. `issue-12-firma-iniziativa`). If `gh` can't see the repository, say so
     (AGENTS.md, "GitHub") and ask the user to paste the issue.
   - **A step of the build order or a description in chat:** use a short slug. After the plan
     is agreed, offer once to open an issue for it (`gh issue create --label enhancement` with
     the request in the template's sections, in English). Create it only if the user says yes.
2. Use the `session` skill with that slug. If the folder exists, this is a resume: go to
   "Resuming".
3. Write `request.md` in the task folder from `request-template.md`, with the issue link when
   there is one. Quote the user's own words for the goal.
4. Ask only about what blocks the plan: an expected behaviour you can't infer from the original
   or the docs, or a choice between real alternatives. Everything else goes in the plan as an
   assumption the user can correct.

## 2. Branch and worktree

Create the worktree now, before reading any code, so that the plan is based on the code you
will change. Follow AGENTS.md: branch `feature/<slug>`, worktree
`../partecipa-feature-<slug>` from `origin/main`. If the main checkout has
uncommitted or unpushed changes that the feature depends on, ask the user before creating it.
Note the worktree's absolute path in `handover.md` and in the header of `plan.md`.

From here on, the worktree is your working copy:

- Read and edit code only through the worktree's absolute path, never through the main
  checkout. Before every edit, check that the path starts with the worktree path.
- Start every shell command with `cd <worktree>/<backend|frontend> &&`. The shell can return to
  the main checkout between commands.
- Run `npm ci` once in the worktree's `frontend/` and copy `.env.example` to `.env`. Run the
  servers and tests from the worktree, so they measure the feature's code. The Docker stack
  (`infra/compose.yaml`) is shared: start it from the main checkout if it isn't up.
- The only files you write in the main checkout are the task folder's (`tmp/<task>/`).

If the user drops the feature, offer to remove the worktree and the branch as the `session`
skill describes. Don't remove them unasked.

## 3. Understand before planning

- In the worktree, read `docs/README.md` and follow "Routing by task" to the topic docs. Read
  the code they point to.
- For ideas, look at what the original prototype does in `.agents/knowledge/original-site.md`
  and `tmp/original-snapshot/`. It is inspiration only: propose what to take from it in the
  plan, don't copy it silently.
- Check the "Behaviour that must not regress" list in AGENTS.md. A feature that conflicts with
  it needs the user's explicit decision. If the feature touches personal data, login, tokens or
  roles, plan a `privacy-check` step.
- Decide which Spring Modulith module and which front-end feature folder own the change. A
  change that makes one module reach into another's internals is a design problem: propose an
  event or a public service method instead.

## 4. Plan and agree

Write `plan.md` in the task folder from `plan-template.md`:

- **Approach:** in a few sentences, where it lives in back end and front end, and the
  alternatives you rejected, with why.
- **API contract first:** the endpoints and JSON shapes, added to `docs/routes.md` in the
  first step, so back end and front end are built against the same contract.
- **Steps:** small and individually verifiable, normally migration → service with tests →
  controller with slice test → regenerated API types → front-end API module → page → browser
  check. Keycloak realm changes are a step of their own, exported to `infra/keycloak/`. Each step names its
  files and how it will be verified.
- **Docs and knowledge pages** to update.
- **Progress table:** every step `todo`.

Show the user the approach and the steps in chat, and wait for their go-ahead before writing
code. Record their decision in `handover.md`.

## 5. Implement step by step

For each step:

1. Set the step to `doing` in the progress table.
2. Make the change in the worktree, following `docs/code-style-java.md` or
   `docs/code-style-react.md`, with tests for the logic.
3. Run the step's verification. Save outputs that matter (test summaries, coverage,
   screenshots) in the task folder.
4. Set the step to `done` with one line of evidence (e.g. "42 tests passed", "page
   checked at 375 and 1280 px"), or to `blocked` with the reason. Then update `handover.md`. Do
   this in the same turn as the step, not later.

If a step reveals that the plan is wrong, stop. Update the plan, mark it as "Plan changed
(date): why", and tell the user before you continue.

## 6. Finish

When all steps are `done`:

- run both quality gates once more on the whole worktree (`./mvnw verify`; `npm run lint &&
  npm test && npm run build`);
- look at every page the feature touches in a browser, at 375 and 1280 px, in Italian and
  English, and run `privacy-check` if personal data, login, tokens or roles are involved;
- check that every doc listed in the plan was updated, and mark the build-order step and the
  "not built yet" markers accordingly;
- report in two or three sentences what the feature does now, how it was verified, and what was
  not tested;
- on the user's request, write the commit message and `pr-description.md` as the `session`
  skill describes. With an issue, the PR description starts with `Closes #<n>`.

## Resuming

Read `handover.md`, `request.md` and `plan.md`. With an issue, also check
`gh issue view <n> --json comments` for comments added since the plan was written. Report the
first step that is not `done`, and anything `blocked`. Take the worktree path from
`handover.md` and keep working there, as in "Branch and worktree". If the worktree is missing,
create it as described there. Check its state (`git -C <worktree> status`) against the table
before continuing. The table can be stale if a session ended abruptly.
