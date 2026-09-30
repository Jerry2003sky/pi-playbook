# Cloud storage exclusion

Treat these paths as excluded from all file operations:
- ~/Library/CloudStorage/Dropbox
- ~/Library/CloudStorage/OneDrive-个人
- ~/Dropbox
- ~/OneDrive

Require explicit user approval before running read, find, grep, ls, stat, du, lsof, indexing, or content-search operations against these paths.


# File and Content Search

The built-in `find`/`grep` tools are FFF-backed (pi-fff override): pre-indexed, frecency-ranked, fuzzy, git-aware. Choosing them or bash is up to you.

When searching through bash, prefer `fd` for paths and `rg` for contents over `find`/`grep`:
- Both silently skip hidden and ignored files by default (rg also skips binary contents). When results look unexpectedly empty, suspect this filtering before concluding the target is absent.
- When unsure of flags, check `fd --help` / `rg --help`.

Hidden paths such as `~/.pi` (pi's own configuration) are invisible to the built-in tools when the workspace sits outside a git repo — the FFF index skips hidden entries there. Search these through bash, rooted at the hidden directory itself.


# Sub-agent Delegation

You can delegate to the `pico` sub-agent via the Agent tool (`subagent_type: "pico"`). It runs a cheaper model, but every delegation has fixed overhead: cold start, a model re-reading files you may already have, your time writing the spec, and your time checking the result. Expect at least a minute before anything comes back. Whenever you have nothing else to do meanwhile, the user waits through all of it.

Default: do the work yourself. Delegate only when the payoff clearly beats that overhead.

Delegate when ALL hold:
1. The slice is substantial — roughly 10+ tool calls, or raw output far larger than the summary you need.
2. You can write a complete spec for it in one prompt.
3. You have other useful work to do while it runs, or its raw output would flood your context.

Do it inline:
- Anything you expect to finish in a handful of tool calls, including short multi-step chains (search → read → edit).
- Single lookups, single file reads, one-off commands, small edits and bug fixes.
- Design/architecture decisions, ambiguous or cross-cutting changes, unwritten preferences.
- Destructive or irreversible operations.

Good fits: repo-wide recon ("map every caller of X"), independent implementation slices of a larger change, test authoring for a module, long test/build runs where you only need pass/fail plus failures, multi-source web research.

Prompt contract: the sub-agent sees ONLY your prompt — no history, no AGENTS.md. Write delegations self-contained: goal, exact file paths, expected behavior, constraints, and a verification step when one exists (e.g. "npm test must pass").

Report-to-disk: when delegating recon whose findings you will consume as reference material (not when the report itself is the user's deliverable), give pico a unique slug: "Report slug: <slug>." Parallel agents get distinct slugs.

When you do delegate:
- Decide early. If a slice qualifies, spawn it at the start instead of after doing half of it inline.
- Background when you have your own work to continue; foreground when you would only wait for the result.
- Batch parallel spawns into one turn; keep slices file-disjoint — overlapping edits collide.
- Skim touched files before reporting edit results to the user.
- If pico stops and reports missing information or out-of-scope work, resolve it in the main session instead of re-delegating the same task.
