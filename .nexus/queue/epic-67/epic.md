---
feature: "Teaching Sessions"
feature_path: docs/features/teaching-sessions
epic: "A stub is planned when the learner reaches it"
slug: stub-planned-when-learner-reaches-it
created: 2026-09-20
type: enhancement
complexity: M
complexity_drivers: [the session chain gains a new terminal state beside the one that says the workbook is finished, a second personal record joins the handoff prompt under the learner folder, the end-to-end path crosses the session, the planning chain and the approval gate]
concepts: []
link: "#67"
record: "#95"
record_state: closed
---

# Epic: A stub is planned when the learner reaches it

## Description

A plan written from a roadmap that is still growing covers the epics somebody has planned and records the rest as the epics it did not plan. An epic nobody has planned yet is a stub, and the plan records it past the planning boundary as a number and a title. Those two names are the same thing throughout this epic: the stub is what the learner plans, and the entry past the boundary is how the plan holds it until they do. A learner works through that plan slice by slice and eventually finishes the last one. Today the session tells them the workbook is finished, which is wrong on a roadmap that has more work recorded on it than the plan ever covered. The learner is told there is nothing left at the exact point where the next thing to do is to plan the next epic.

This epic makes that point a beginning rather than an end. A session that runs out of taught slices while the plan still records epics past the planning boundary names the first of those epics and hands the learner a brief for planning it. The brief is what makes the learner meet the decision rather than be handed its result: planning an epic is where somebody decides what the work is, and a learner who sits through that decision meets the reason the stories they are about to be taught look the way they do.

The session plans nothing itself. It names what to plan, says what the learner decides while planning it, and says how the plan extends afterwards. The learner plans the epic through the planning command outside the session, then runs the planning chain again; the approval gate carries every taught slice forward unchanged and plans the newly planned epic's stories after them. A learner who does none of that has changed nothing: the session wrote no lesson, no page and no plan, so the workbook is exactly as it was.

## Success Metrics

- A session that reaches the end of a plan which records epics past the planning boundary names the epic to plan next, where today it reports the workbook finished.
- A learner who has never planned an epic can plan the named one from the brief alone, without being told what to do by anyone else.
- A workbook whose plan covered three epics of a five-epic roadmap teaches the fourth epic's slices after one planning round and one re-approval, with every lesson written before that round left byte for byte unchanged.
- A session that reaches the planning boundary twice over an unchanged repository reports the same epic both times and leaves the committed workbook untouched both times.

## Personas

This repository has no `docs/product/context.md`, so there is no canonical persona set to point at. The **learner** is who every story here is written from: they run the session, read the brief, plan the epic and are taught from what they planned. The **delivery lead** owns the planning command the brief names, and is the role the learner steps into for one sitting.

## Smallest Usable Version

A session that reaches the planning boundary names the epic to plan next; The learner is handed a brief for planning that epic; The newly planned epic extends the plan and keeps every taught lesson

## User Stories

### Story #92: A session that reaches the planning boundary names the epic to plan next

**As a** learner, **I want** the session to end with a verdict that planning is owed when I run out of taught slices, **so that** I know the workbook is waiting on a planning decision rather than finished.

- **story_type:** user
- **size:** M

## Acceptance Criteria

- [ ] **Given** a workbook whose every slice is taught and finished and whose plan records epics past the planning boundary, **when** a session runs, **then** its verdict is that planning is owed on the first recorded epic, named by its number and its title, rather than that the workbook is finished.
- [ ] **Given** that same workbook, **when** a session runs, **then** the report says how many epics sit past the boundary and that the named one is the one to plan next.
- [ ] **Given** a workbook whose plan records no epics past the planning boundary, **when** every slice is taught and finished, **then** the session reports the workbook finished, word for word as it does today.
- [ ] **Given** a session that named an epic to plan next, **when** it runs again over an unchanged repository, **then** it reaches the same verdict and names the same epic.

## Notes

The plan records an epic past the boundary as a number and a title and nothing else, so those two are everything this story has to name it by.

### Story #93: The learner is handed a brief for planning that epic

**As a** learner, **I want** a brief that tells me what planning this epic asks of me, **so that** I make the planning decision myself instead of being handed somebody else's answer.

- **story_type:** user
- **size:** M

## Acceptance Criteria

- [ ] **Given** a session whose verdict is that planning is owed, **when** it runs, **then** it leaves a brief on disk as a personal record, naming the epic to plan, its title, the repository it lives in, and the command that plans it.
- [ ] **Given** that brief, **when** the learner reads it, **then** it names what they decide while planning the epic and what they do afterwards to extend the plan over it.
- [ ] **Given** a session that reached the planning boundary, **when** it runs, **then** no lesson, no page and no committed plan under the workbook changes.
- [ ] **Given** the same plan, **when** a session runs twice, **then** the second brief is identical to the first and neither run reads anything outside the repository to write it.

## Notes

The brief is a personal record, like the prompt a handed-off slice produces, so it can never appear as drift against the rendered lessons.

### Story #94: The newly planned epic extends the plan and keeps every taught lesson

**As a** learner, **I want** the epic I just planned to become the next slices I am taught, **so that** planning it was worth the sitting it cost.

- **story_type:** user
- **size:** S

## Acceptance Criteria

- [ ] **Given** a learner who has planned the epic the brief named, **when** they run the planning chain again and approve the plan, **then** that epic's stories become slices after every slice already taught, and no lesson written before is changed.
- [ ] **Given** that extended plan, **when** the next session runs, **then** it teaches the first slice of the newly planned epic instead of naming the boundary again.
- [ ] **Given** a roadmap that still holds epics nobody has planned, **when** the extended plan is approved, **then** it records those epics past the boundary, and a session names the next of them once the new slices are taught.

## Notes

The re-approval path already carries the taught slices forward and derives the boundary again from the roadmap it is approving. This story is what proves the two halves meet across a real sitting.

## Assumptions

- The learner plans the epic outside the session, through the planning command the brief names. The session files no issue and moves no version-control state.
- An epic past the boundary carries a number and a title in the plan and nothing else, so the brief is rendered from those two and never from a live read of the issue.
- A learner who reaches the boundary is willing to spend that sitting planning rather than being taught, because the alternative is a workbook with nothing left in it.

## Out of Scope

- Writing the decision record for the epic the learner just planned, and pinning the sources its slices need. #68 covers it.
- Planning the epic on the learner's behalf. The session names what to plan and files nothing.
- Any change to how a roadmap resolves, how the planning chain runs, or how the approval gate carries a taught prefix forward.
- Choosing which epic past the boundary to plan. The plan records them in the roadmap's order and the first one is the next one.

## Open Questions

## Implementation Sequence

| Issue | blocked_by |
|---|---|
| #92 | none |
| #93 | #92 |
| #94 | #93 |
