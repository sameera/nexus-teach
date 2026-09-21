---
feature: "Teaching Sessions"
feature_path: docs/features/teaching-sessions
epic: "The decision record is written before the lesson needs it"
slug: record-written-before-the-lesson-needs-it
created: 2026-09-20
type: enhancement
complexity: M
complexity_drivers: [the session gains a stop before the one step that writes a lesson, a third personal record joins the planning brief and the handoff prompt under the learner folder, the pinned sources reach the lesson brief for the first time]
concepts: []
link: "#68"
record: "#100"
record_state: closed
---

# Epic: The decision record is written before the lesson needs it

## Description

A lesson's theory is written from the epic's decision record. The step that pins sources reads that record and runs when the record is approved, and it already exists. What does not exist is the order. Until now a delivery lead planned an epic and wrote its record long before any learner reached it, so the sources were always pinned by the time a lesson was written, and nothing had to check.

A learner who plans an epic during their own sitting reaches its first slice immediately. The record for it does not exist yet, so the sources are not pinned, and the session would write a lesson with no theory to write from. It would fall back to searching the repository for material, which is the thing pinned sources replaced.

This epic puts the record where the order needs it. A session stops before teaching a slice the learner builds whose sources have not pinned and whose epic has no approved decision record, and says what is owed rather than teaching anyway. It stops on the missing record and not on the missing sources: pinning is a manual step nothing in the pipeline invokes, so a slice with no sources is just as likely to belong to an epic that shipped a year ago, and stopping on that would take every existing workbook down. The learner is coached through writing the record for the epic they just planned, in the same sitting, because the record is where the reasons behind the stories they are about to be taught are written down. Approving it pins the sources for every slice of that epic the learner builds, and the next session teaches the first of them from what the record says.

## Success Metrics

- A learner who has just planned an epic writes and approves its decision record in the same sitting, where today that work waits for a delivery lead.
- No lesson is written for a slice the learner builds whose sources have not pinned and whose epic has no approved decision record, where today a lesson is written regardless and its theory comes from a repository search.
- A learner stopped at an unpinned slice can name the epic, the record it owes and the step that pins it, from the session's report alone.
- A workbook whose plan already carries pinned sources on every learner slice runs exactly as it does today, with no new stop and no new report.

## Personas

This repository has no `docs/product/context.md`, so there is no canonical persona set to point at. The **learner** is who every story here is written from: they are stopped, they write the record, they approve it and they are taught from it. The **delivery lead** owns the record command the session names, and is the role the learner steps into for the second half of the sitting that planned the epic.

## Smallest Usable Version

A slice whose sources have not pinned is not taught, and the session says what is owed; The learner is coached through the record for the epic they just planned; Approving the record pins the sources, and the next session teaches from them

## User Stories

### Story #97: A slice whose sources have not pinned is not taught, and the session says what is owed

**As a** learner, **I want** the session to end with a verdict that a record is owed rather than teach me a slice whose theory has no source, **so that** the lesson I read is written from the reasons somebody recorded and not from a search.

- **story_type:** user
- **size:** M

## Acceptance Criteria

- [ ] **Given** a plan whose next slice is one the learner builds, whose sources have not pinned, and whose epic this checkout finds no approved decision record for, **when** a session runs, **then** its verdict is that a record is owed on that slice's epic, and it writes no lesson and no page.
- [ ] **Given** a plan whose next slice is one the learner builds and carries no pinned sources, but whose epic does have an approved decision record, **when** a session runs, **then** it teaches that slice exactly as it does today and says the sources were never pinned.
- [ ] **Given** that same session, **when** it reports, **then** it names the slice, the epic the slice builds a story of, and the record that epic owes.
- [ ] **Given** a plan whose next slice carries pinned sources, **when** a session runs, **then** it teaches that slice exactly as it does today, with no new stop.
- [ ] **Given** a plan whose next slice is a scaffold or one handed off, **when** a session runs, **then** it is not stopped, because neither is taught from a decision record.

## Notes

A slice that builds no story has no epic and so no record, and a handoff slice teaches nothing. Only a slice the learner builds can owe sources.

The stop turns on the epic's record, not on the absence of sources. Pinning is a manual step nothing in the pipeline invokes, so a slice with no sources is either an epic whose record does not exist yet — the case this story is for — or an epic that shipped long ago and whose lead never ran the pinning step, which is most of the installed base. Stopping on absent sources alone would take every existing workbook down.

### Story #98: The learner is coached through the record for the epic they just planned

**As a** learner, **I want** a brief telling me what writing this epic's decision record asks of me, **so that** I meet the reasons behind the stories I am about to be taught instead of being handed them.

- **story_type:** user
- **size:** M

## Acceptance Criteria

- [ ] **Given** a session whose verdict is that a record is owed, **when** it runs, **then** it leaves a brief on disk as a personal record, naming the epic, the record it owes, the repository the epic lives in, and the command that writes the record.
- [ ] **Given** that brief, **when** the learner reads it, **then** it says what they decide while writing the record and what they do afterwards to pin the sources and be taught.
- [ ] **Given** a session whose verdict is that a record is owed, **when** it runs, **then** no lesson, no page and no committed plan under the workbook changes.
- [ ] **Given** the same plan, **when** a session runs twice, **then** the second brief is identical to the first and neither run reads anything outside the repository to write it.

## Notes

The brief is a personal record under the learner folder, like the planning brief the boundary writes and the prompt a handed-off slice produces.

### Story #99: Approving the record pins the sources, and the next session teaches from them

**As a** learner, **I want** approving the record to be what unblocks the lesson, **so that** writing it was worth the half-sitting it cost.

- **story_type:** user
- **size:** S

## Acceptance Criteria

- [ ] **Given** an epic whose record the learner has just written and approved, **when** they run the step that pins sources for that epic, **then** every learner slice of it carries the sources its lesson is written from.
- [ ] **Given** those pinned slices, **when** the next session runs, **then** it teaches the first of them and the lesson it briefs carries the sources the record supplied.
- [ ] **Given** an epic whose record the learner left unapproved, **when** they run the step that pins sources, **then** it pins nothing and says the record is not approved yet, so the slice still owes what it owed before.

## Notes

The step that pins sources already refuses an unapproved record and pins nothing. What this story adds is that a learner reaches it in their own sitting, and that the brief the next session hands out carries what was pinned.

## Assumptions

- The learner writes and approves the record outside the session, through the command the brief names. The session writes no record, approves nothing and moves no version-control state.
- A slice the learner builds is the only kind that can owe sources, because a scaffold builds no story and a handoff slice teaches nothing.
- An epic whose record was approved and pinned before any learner reached it stays exactly as it is, because its slices already carry sources and no stop fires.

## Out of Scope

- Any change to what the step that pins sources checks, or to how it reads a record's approval. It already refuses an unapproved record and pins nothing.
- Writing the decision record on the learner's behalf. The session names what is owed and approves nothing.
- Planning the epic itself, and the boundary the learner reached to get here. #67 covers both.
- Changing where a lesson's theory comes from once sources are pinned.

## Open Questions

## Implementation Sequence

| Issue | blocked_by |
|---|---|
| #97 | none |
| #98 | #97 |
| #99 | #98 |
