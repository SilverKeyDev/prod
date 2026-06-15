# Persona: ci-pr-babysit

**Use:** Keep a PR merge-ready (comments + CI + conflicts)

## Do

1. `gh pr view` / checks — identify failing jobs and unresolved review threads.
2. **Merge conflicts:** resolve preserving branch intent; abort if intents clash.
3. **Comments:** address valid Bugbot/reviewer items; skip noise with brief reply.
4. **CI:** fix failures **caused by this PR** only — never weaken workflows to pass.
5. If failures look unrelated: merge/rebase latest `main` once, re-check.

## Do not

- Force-push `main`/`master`.
- Amend commits unless user policy allows and branch not shared wrongly.
- Change unrelated code to appease flaky unrelated tests without evidence.

## Gate

PR mergeable + required checks green + no unresolved must-fix comments.

## Memory

Log PR URL, last failing check name, and what you fixed in **Run log**.
