---
title: "Record Owed"
aliases: ["record brief", "slice is not ready to teach", "epic owes its decision record", "sources have not pinned", "write the record before the lesson", "stopped before the lesson"]
touches: ["teaching-session", "pinned-sources", "planning-brief", "just-in-time-lesson", "learner-folder"]
domain: "teaching-sessions"
last_updated_by: "#68"
status: active
verification: verified
---

# Record Owed

A lesson's theory is written from its epic's decision record. Reaching a slice they build whose epic has no approved record, the learner is stopped rather than taught from nothing: the session names the record owed and writes a brief for producing it. Approving it and pinning the sources clears the stop.

## How It Works

The stop turns on the record, never on the slice merely having no sources. Pinning is run by hand, so a slice with no sources belongs either to an epic planned minutes ago or to one that shipped long ago whose lead never ran that step. Stopping on absent sources would take every existing workbook down.

The question asked is the one the pinning step already answers: would it report it is waiting here. Asking it that way, rather than restating its rule, means the two cannot disagree about one epic. The answer is handed to the session, which reaches for nothing itself.

A question that cannot be answered is not a stop. An unreconstructed epic, a slice naming no epic, or a failed read leaves the session teaching as before and saying the check could not run. The alternative stops every workbook the moment a read is flaky.

The stop sits after the drift check, the suite, and the arm that re-opens a written lesson, so nobody is stranded mid-exercise.

## Key Invariants

1. Only a slice the learner builds can be stopped, never a scaffold, a handed-off slice, or one already carrying sources or a lesson.
2. The stop fires exactly when the pinning step would report it is waiting for that epic, asked through that step, so the two cannot disagree.
3. An unanswerable question is never a stop: the session teaches as before and says the check could not run.
4. The verdict is a distinct terminal state reported as a normal end, naming the slice, its story, its epic and the record owed.
5. A sitting reaching the verdict writes no lesson, no page and no committed plan, returning before every path that would.
6. The brief is a personal record under its own kind, rendered from the plan and fixed text, so two sittings write identical bytes to one path.
7. Sources pinned on a slice reach the brief the prose author receives, and the stop clears when the pinning step no longer waits.

## Integration Points

- [teaching-session](teaching-session.md) — the chain that reaches the slice and returns this verdict instead of writing a lesson.
- [pinned-sources](pinned-sources.md) — the step whose answer defines this stop, and whose pinning clears it.
- [planning-brief](planning-brief.md) — the verdict before this one in a sitting, which is why each brief has its own kind.
- [just-in-time-lesson](just-in-time-lesson.md) — the lesson not written here, which carries the pinned sources once they exist.
- [learner-folder](learner-folder.md) — where the brief is kept, so it is never a page.

## Decision Log

### 2026-09-21 — #68 — The record is owed before the lesson, and the stop turns on the record rather than on the sources

A learner who plans an epic in their own sitting reaches its first slice at once, with no record written and so no sources pinned, and the session would have written a lesson whose theory came from a repository search. The stop that prevents that is keyed on the epic having no approved record, not on the slice having no sources. The two are easy to confuse and the difference is the whole of the backward compatibility: pinning is manual and nothing in the pipeline invokes it, so most existing workbooks hold slices with no sources whose epics shipped long ago, and a stop keyed on absent sources would have halted all of them. The condition is asked by calling the pinning step and reading whether it reports it is waiting, rather than by restating its rule beside it, so one change to what counts as an approved record moves both at once. An unanswerable question teaches rather than blocks, which is a deliberate inconsistency with the drift check: drift blocks because the alternative is teaching from a pinned text that may now be a lie, while here the alternative is teaching exactly what the last release taught. Refuted alternative: record on the committed plan, at approval, that an epic sat past the planning boundary, so the verdict needs no live read at all and matches the planning verdict exactly. It lost because the mark answers whether the epic was planned late rather than whether a record exists, so it over-fires and under-fires in opposite directions, and because no plan approved before the field existed could carry it, leaving the fact missing for exactly the workbooks the compatibility argument is about. Refuted alternative: reuse the stop that fires when a story has drifted, since both mean the next lesson cannot be written yet. It lost because drift means the plan disagrees with the issue graph and is answered by re-approving, while this means the work is in the right order but one step early and is answered by the learner's own half-sitting.
