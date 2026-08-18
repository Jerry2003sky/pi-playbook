# Cloud storage exclusion

Treat these paths as excluded from all file operations:
- ~/Library/CloudStorage/Dropbox
- ~/Library/CloudStorage/OneDrive-个人
- ~/Dropbox
- ~/OneDrive

Require explicit user approval before running read, find, grep, ls, stat, du,
lsof, indexing, or content-search operations against these paths.

# File and Content Search

Always prefer the FFF tools provided by `@ff-labs/pi-fff`:
- For file and path searches, always prefer `fffind`. Do not use the built-in `find`, shell `find`, or `fd`.
- For content searches, always prefer `ffgrep`. Do not use the built-in `grep`, shell `grep`, or `rg`.
- Use `fff-multi-grep` when searching for multiple literal patterns with OR semantics.

Fall back to built-in or shell search tools only when the corresponding FFF tool is unavailable, fails, or cannot perform the required operation. Briefly state the reason before falling back.

# Sub-agent Delegation

Default to delegating well-specified work to the `fast` sub-agent via the
Agent tool (`subagent_type: "fast"`). It runs DeepSeek V4 Flash with
thinking max — capable, fast, and far cheaper than the model running this
session — with the built-in tools plus the fff / rtk / web-access extensions
and skills, in its own fresh session. Delegation keeps raw material (file
dumps, search hits, command logs) out of this conversation and off the
expensive model.

Decision rule:
- Delegate when BOTH hold: (1) you can write a complete spec for it in
  one prompt, and (2) it either fills your context with raw material you
  only need a summary of, or it is independent of your next steps and can
  run in parallel with them.
- Do the work inline when either test fails — and always for single
  lookups, even ones with bulky answers (a fffind/ffgrep hit list, one
  file read): a lone lookup is faster done than delegated.
- The Keep list below overrides this rule when they conflict.
- Judge both tests at the whole-request level, never the current step —
  any real task is a chain of single calls, and the step level is the
  wrong granularity.

Delegate proactively:
- Multi-round searches and codebase recon ("what calls Y", "map the auth
  flow") — single lookups stay inline per the rule above.
- Packaged step-runs: a contiguous chain of calls serving one sub-question
  (search → read → probe → summarize) is ONE delegable errand — delegate
  it whole instead of stepping through it inline.
- Implementation from a clear spec: new functions/modules, single-file features,
  bug fixes with known repro and expected behavior.
- Mechanical edits and refactors within a defined boundary: renames, format
  transforms, repetitive fixes, one-file refactors.
- Test authoring for existing code.
- Diff/code review passes: correctness, edge cases, style — a second pair of
  eyes before you summarize.
- Commands with bulky output you only need summarized: tests, builds, git log, lint.
- Web lookups, page fetches, and multi-source research with synthesis.

Keep in the main session:
- Design/architecture decisions and ambiguous, cross-cutting changes.
- Tasks hinging on unwritten preferences or decisions still being
  negotiated — context you CAN write into a self-contained prompt is
  delegable.
- Destructive or irreversible operations.
- Work under the excluded cloud-storage paths — the sub-agent does not see that rule.

Prompt contract: the sub-agent sees ONLY your prompt — no history, no
AGENTS.md. Write delegations self-contained: goal, exact file paths,
expected behavior, constraints, and a verification step when one exists
(e.g. "npm test must pass").

- Report-to-disk: when delegating inventory/recon tasks whose findings
  you will consume as reference material (not when the report itself is
  the user's deliverable), assign a path in the prompt:
  "Write the full report to ~/.pi/agent/reports/YYYYMMDD-HHMMSS-<slug>.md;
  return only a 3-5 line summary + the file path + a one-line section
  list." Parallel agents must get distinct paths.

Orchestration:
- Decompose first: on any multi-part task, split the work into independent
  slices up front and spawn background fast agents for the delegable slices
  BEFORE starting your own slice. Delegate at the start of work, not at
  the end.
- Mid-task checkpoint: if you are 3 or more tool calls deep into one
  sub-question, stop and hand off the rest as a packaged errand, including
  what you have learned so far in the prompt.
- Foreground is for dependencies: call foreground when your very next step
  needs the result — including a packaged serial errand, where the wait is
  the accepted price for a clean context and a cheaper model. Everything
  else runs in background.
- Batch parallel spawns into a single turn so completion notifications
  arrive grouped. Keep slices file-disjoint — overlapping edits collide.
- Never idle-wait: while background agents run, keep working on your own
  slice; consolidate when completion notifications arrive.
- Typical fan-outs: task-start recon (2-3 parallel searches), separable
  implementation slices, tests or docs while you finish the core, a review
  pass while you draft the summary.
- Steer mid-run if one drifts; skim touched files before reporting edit results to the user.
- If fast stops and reports missing information or out-of-scope work, resolve
  it in the main session instead of re-delegating the same task.
