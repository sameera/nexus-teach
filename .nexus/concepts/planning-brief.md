---
title: "Planning Brief"
aliases: ["plan the next epic", "epic to plan next", "boundary brief", "planning is owed", "the workbook is not finished", "ran out of taught slices"]
touches: ["teaching-session", "planning-boundary", "learner-folder", "record-owed"]
domain: "teaching-sessions"
last_updated_by: "#68"
status: active
verification: verified
---

# Planning Brief

A learner taught every slice of a plan that still records epics past the planning boundary has not finished the workbook; the next thing to do is plan the next epic. The session says so, names that epic, and writes a brief for planning it as a personal record under the learner folder.

## How It Works

The verdict is a terminal state of its own rather than the finished report, because a caller reading only the outcome's kind would otherwise treat a boundary sitting as a completed workbook. It is a normal end and not a stop: the plan is consistent, the workbook intact, the next action clear.

The epic named is the first entry the plan records past the boundary, in the roadmap's order. That entry holds a number and a title and nothing else, so the brief is rendered from those, the workbook's own facts and fixed text. Nothing is read from the issue graph, which is what makes two sittings write identical bytes to one path. The recorded title may therefore be old, so the brief identifies the epic by its number and says so.

The brief names where the epic lives and where the workbook lives separately, because a roadmap's epics resolve from the workspace hub when there is one. A hub is named by its remote identity, never by the folder it is checked out into.

## Key Invariants

1. The verdict is a distinct terminal state, and the report for a finished workbook is unchanged.
2. Only a plan recording an epic past the boundary produces it, and the epic named is the first such entry in the roadmap's order.
3. The brief is rendered from the committed plan, the workspace shape and fixed text, so two sittings write identical bytes to one path and neither reads outside the repository.
4. The brief names the epic's number and recorded title, both repositories, the command that plans it, and what the learner decides and does afterwards.
5. A sitting reaching the verdict writes no lesson, no page and no committed plan, because it returns before every path that would.
6. A brief that cannot be written is reported beside the verdict, which still stands.
7. No brief is ever removed; the next approval moves the epic out of the boundary, leaving the brief as a note about a decision already made.

## Integration Points

- [teaching-session](teaching-session.md) — the chain that reaches the end of the taught slices and returns this verdict instead of the finished report.
- [planning-boundary](planning-boundary.md) — the recorded list this verdict reads, and whose first entry is the epic named.
- [learner-folder](learner-folder.md) — where the brief is kept, under its own record kind, so it is never a page and can never appear as drift.
- [record-owed](record-owed.md) — the verdict that follows this one in a sitting, once the epic named here has been planned.

## Decision Log

### 2026-09-20 — #67 — The boundary is where a workbook asks for the next planning decision

A plan written from a roadmap that is still growing records the epics it did not plan, and a learner who worked through every slice of one was told the workbook was finished. That is wrong at exactly the moment the next thing to do is plan the next epic. The verdict is a new terminal state rather than a field on the finished one, because the command line's stop list and most tests branch on the outcome's kind alone, and a flag would leave every one of them treating a boundary sitting as a completed workbook. It is not a stop, because every outcome that fails today means the repository is in a state the session refuses to teach from, and none of that is true here. The question is asked where the chain has already concluded there is nothing left to teach, after the suite and any handoff return, so a verdict can never be reported out of a tree that cannot build. The brief names which repository the planning command is run in, and the first implementation named the workspace hub's checkout folder, which the manifest loader guarantees can never be an owner/repo identity; the conformance gate caught it before the change merged, and it now names the hub's remote identity. Refuted alternative: have the step that decides where the learner is return the boundary answer itself, so all end-of-plan reasoning sits in one place. It is tidier, and it lost because that step's input is the teaching order, which holds slices alone; feeding it the boundary would either widen that view, so every reader of it needs a rule for skipping a second kind of entry, or pass an argument only one branch reads. Refuted alternative: render the workbook on a boundary sitting, so the home page shows which epics are still unplanned. It lost because rendering is the one act that can rewrite committed bytes, and the guarantee that a boundary sitting changes nothing is stronger than a re-render being identical.

### 2026-09-21 — #68 — Reciprocal link from record-owed

Mechanical reciprocity fan-out: planning the epic this brief names leads straight to the next stop, because the epic now has stories but no decision record, and a lesson's theory is written from that record. The two briefs are the two halves of one sitting. Each is filed under its own record kind for that reason: both are named from the same epic's number, so one shared kind would have the second silently overwrite the first, and no session removes a brief.
