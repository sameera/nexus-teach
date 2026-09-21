---
feature: "Roadmap Planning"
feature_path: docs/features/roadmap-planning
epic: "The plan stops at the planning boundary and shows it"
slug: plan-stops-at-planning-boundary
created: 2026-09-20
type: enhancement
complexity: M
complexity_drivers: [three phases of one chain each gain a boundary they did not have, the committed plan gains a second kind of entry that a later epic reads, both later stories build on the boundary the first one establishes]
concepts: []
link: "#66"
record: "#89"
record_state: closed
---

# Epic: The plan stops at the planning boundary and shows it

## Description

A roadmap a learner is taught from now holds two kinds of member. A planned epic carries its stories, their bodies and the edges between them. An epic nobody has planned yet carries a title and a body and nothing else. Resolution handles both. The planning chain that runs after resolution does not: every phase in it was written when a roadmap was a set of planned epics, so each one assumes that every member has stories to read.

Four phases make that assumption in four different places, and this epic answers three of them. Extraction reads each story once, and an epic with no stories gives it nothing to read. The rewrite orders what extraction produced, and a member that produced none has nothing in the order. The coverage check decides what to teach for itself by asking which concepts no story on the roadmap introduces, and that question means something different when part of the roadmap has not been written yet; it is left as it stands here, and changing it is deferred. The approval gate prints the whole plan, and on a roadmap that is still growing the plan is no longer the whole roadmap.

This epic makes the chain run to a boundary instead of running to an end. The phases that read stories run over the planned members alone. The plan that comes out records the members it did not plan, in the roadmap's own order, so the point where planning stops is written down rather than inferred from what is missing. The gate then tells the reviewer how much of the roadmap the plan covers, so they approve a plan they know is partial rather than one they read as whole.

## Success Metrics

- A roadmap holding planned epics and epics nobody has planned yet produces an approved plan, where today the chain stops at the first member with no stories.
- A reader of the committed plan can name every epic the plan did not cover, and the order they sit in, without going back to the issue graph.
- A reviewer at the gate is told how much of the roadmap the plan covers before they approve it.
- Re-running the chain on an unchanged mixed roadmap produces the same slices in the same order.

## Personas

This repository has no `docs/product/context.md`, so there is no canonical persona set to point at. Two actors appear below. The **delivery lead** names the roadmap, runs the planning chain and reads the plan it writes. The **reviewer** reads the gate and approves or declines the plan. The **learner** works through the plan once it is approved, and is who the boundary is recorded for, but no story here is written from their side.

## Smallest Usable Version

Extraction and the rewrite run over the planned members alone; The committed plan records the unplanned members in roadmap order; The approval gate shows the boundary and what sits past it

## User Stories

### Story #85: Extraction and the rewrite run over the planned members alone

**As a** delivery lead, **I want** the planning chain to run on a roadmap that holds epics nobody has planned yet, **so that** I can plan the part that is written instead of waiting for the rest to be written.

## Acceptance Criteria

- [ ] **Given** a roadmap whose members are a mix of planned epics and epics nobody has planned yet, **when** the lead runs extraction, **then** every story of every planned member is listed for extraction and no member without stories is listed.
- [ ] **Given** that same roadmap, **when** the vocabulary is printed for the merge, **then** it holds only identifiers proposed from the planned members' stories.
- [ ] **Given** that same roadmap, **when** the draft is written and rewritten, **then** the draft holds one slice for each planned member's story and no slice naming a member that has none.
- [ ] **Given** a roadmap whose every member is an epic nobody has planned yet, **when** the lead runs extraction, **then** the chain stops, says there is nothing to plan yet, and writes no draft.

## Notes

The chain today stops at the first member it cannot read stories from, so the observable change is that it finishes.

- **story_type:** user
- **size:** M

### Story #86: The committed plan records the unplanned members in roadmap order

**As a** delivery lead, **I want** the written plan to name the epics it did not plan, in the roadmap's own order, **so that** the point where the plan stops is recorded rather than worked out from what is absent.

## Acceptance Criteria

- [ ] **Given** a roadmap holding both kinds of member, **when** the plan is written, **then** it holds exactly one entry per member that has no stories, each carrying that member's issue number and title.
- [ ] **Given** that plan, **when** those entries are read in the order the file holds them, **then** they sit in the roadmap's own member order.
- [ ] **Given** that plan, **when** one of those entries is read, **then** it carries no slice, no concept and no source.
- [ ] **Given** a roadmap whose members all have stories, **when** the plan is written, **then** it holds no such entries and is otherwise unchanged from the plan that roadmap produces today.

## Notes

- **story_type:** system
- **size:** S

### Story #87: The approval gate shows the boundary and what sits past it

**As a** reviewer, **I want** the gate to tell me where the plan stops and which epics sit past that point, **so that** I approve a plan I know is partial instead of one I read as the whole roadmap.

## Acceptance Criteria

- [ ] **Given** a plan whose roadmap holds members with no stories, **when** the gate prints, **then** it names each of those members by issue number and title, in roadmap order, after the last slice.
- [ ] **Given** that print, **when** the reviewer reads it, **then** it states how many of the roadmap's members the plan covers, and that the members it named above are the ones it did not plan.
- [ ] **Given** that plan, **when** the reviewer approves it, **then** the plan is written, and approval is not refused on account of the members it did not plan.
- [ ] **Given** a plan whose roadmap members all have stories, **when** the gate prints, **then** the print is unchanged from what it prints today.

## Notes

- **story_type:** user
- **size:** S

## Assumptions

- A roadmap already states each member's kind, so this epic reads that statement rather than working the kind out from an empty story list.
- An epic nobody has planned yet carries a title and a body and no stories, so there is nothing on it for extraction to read.
- The plan covers every member that has stories, wherever that member sits in the roadmap's order, and the planning boundary is the set of members that have none.
- A learner who reaches the boundary plans the next unplanned member during a teaching session, so this epic only has to record where the boundary is.
- A reviewer still argues a teaching step down at the gate one at a time, so a step this epic leaves in place is not the last word on it.

## Out of Scope

- Planning an unplanned member during a teaching session. #67 covers it.
- Writing the decision record for an epic planned that way, and pinning the sources its slices need. #68 covers it.
- Extending an approved plan over a member that was planned after approval. The re-approval path already owns that.
- Any change to how a roadmap resolves, how it is named, or how it states each member's kind. #64 and #65 delivered that.
- Any change to how a roadmap whose members all have stories is planned today.

## Open Questions

## Implementation Sequence

| Issue | blocked_by |
|---|---|
| #85 | none |
| #86 | #85 |
| #87 | #86 |
