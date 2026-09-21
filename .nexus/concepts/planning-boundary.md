---
title: "Planning Boundary"
aliases: ["planning boundary", "where planning stops", "unplanned list", "partial plan", "epics the plan did not cover", "how much of the roadmap the plan covers", "nothing planned yet"]
touches: ["roadmap-members", "story-concept-extraction", "plan-draft", "plan-approval-gate", "teaching-plan", "plan-re-approval"]
domain: "roadmap-planning"
last_updated_by: "#66"
status: active
verification: verified
---

# Planning Boundary

A roadmap that still holds epics nobody has planned yet is planned as far as planned work goes, and says where that point is. The phases that read stories run over the planned members alone, the committed plan lists the members it did not plan in the roadmap's own order, and the approval gate tells the reviewer how much of the roadmap the plan covers. A fully planned roadmap produces the committed plan and the print it produced before a boundary could exist.

## How It Works

The kind each member states is the only input. An empty story list answers nothing, because a planned epic whose stories were all withdrawn contributes none either.

No phase carries the boundary forward. Approval reads it from the roadmap it is approving against, and the gate's print is handed it beside the facts it already receives. It is never written onto the draft, because the gate records a fingerprint of the draft it printed, and a second kind of entry there would change that fingerprint on every mixed roadmap.

A roadmap with no planned member stops the chain at extraction. The workbook and the recorded interview are left in place, because the roadmap is still growing.

## Key Invariants

1. Every phase reads the kind the roadmap states for a member, and none infers it from an absent story list.
2. The recorded boundary is the set of the roadmap's members that contributed no slice, in the roadmap's own member order.
3. An entry carries an issue number and a title and nothing else: no lesson, branch, pinned state, concept, source or dependency edge.
4. An entry never enters the teaching order, the reading order, the drift comparison or a handoff prompt, and a plan carried through a teaching session comes out still holding its boundary.
5. A roadmap whose members are all planned records no list at all rather than an empty one, and its gate print is unchanged.
6. A roadmap with no planned member stops at extraction, before any story is read, and no draft is written.
7. Approval refuses a draft that has no slice for a story the roadmap holds, so what the plan says it did not plan is exactly the complement of what it covers.

## Integration Points

- [roadmap-members](roadmap-members.md) — states each member's kind, which is the only thing any phase here reads to decide whether a member is planned.
- [story-concept-extraction](story-concept-extraction.md) — the first phase that reads stories, and where a roadmap with nothing planned on it stops.
- [plan-draft](plan-draft.md) — holds slices only, so the fingerprint the gate records over it is what it was before a boundary could exist.
- [plan-approval-gate](plan-approval-gate.md) — prints the boundary last, immediately before the reviewer decides, and refuses a draft missing a slice for a story the roadmap holds.
- [teaching-plan](teaching-plan.md) — the committed plan this list is written into, after its slices.
- [plan-re-approval](plan-re-approval.md) — derives the list again from the roadmap it is approving, so a member planned since the last approval leaves the boundary.

## Decision Log

### 2026-09-20 — #66 — The plan records where planning stopped, and every reader takes it from what it already holds

A roadmap a learner is taught from is still growing, so part of it is routinely unplanned, and until now the chain simply planned less and said so nowhere. A reader could not tell a roadmap that was planned in full from one that ran out halfway, because both produced a plan that named only slices. The boundary is therefore written down rather than left to be inferred from what is absent. It is recorded as a list beside the slices rather than as slices of a new kind, because the teaching order, the home page, the drift check and the handoff prompt all read slices, and each would have needed a rule for skipping one kind of slice. An entry carries a number and a title alone, because an unplanned member is never taught, so a pinned state on it would only give the workbook a way to stall over an epic the plan never covered. Approval refuses a draft that has no slice for a story the roadmap now holds, which is what makes the recorded list the true complement of the slices rather than merely the members the draft happened to miss. Refuted alternative: record the unplanned members on the draft, so the gate and approval read one artifact instead of each reading the roadmap. It is better for single-sourcing, and a competent engineer would reach for it. It lost on the fingerprint the gate records over the draft it printed: putting the boundary there changes that fingerprint on every mixed roadmap, which weakens the one value that proves the reviewer approved what they read. Refuted alternative: model each unplanned member as a slice carrying nothing, which every existing reader would surface with no change and which preserves the roadmap's order for free. It lost on what it costs those readers, because a reader that missed the skip rule would put an epic nobody has planned into the learner's teaching order. Refuted alternative: always write the list, empty when nothing sits past the boundary, so a reader can tell a boundary-aware plan from an older one. It lost because absent and empty say the identical thing to every reader of the plan, and because an unchanged committed artifact on a fully planned roadmap is what this work had to deliver.
