---
feature: "Roadmap Planning"
feature_path: docs/features/roadmap-planning
epic: "A concept an unplanned epic will introduce is not scaffolded"
slug: unplanned-concept-not-scaffolded
created: 2026-09-21
type: enhancement
complexity: M
complexity_drivers: [the concepts an unplanned epic will introduce must be known from its title and body alone, the rewrite and the coverage check both change what they count as background, the gate gains one more thing to show]
concepts: []
link: "#88"
record: "#105"
record_state: closed
---

# Epic: A concept an unplanned epic will introduce is not scaffolded

## Description

A roadmap can hold epics nobody has planned yet. The plan covers the planned members and records the unplanned ones past the planning boundary. The rewrite still decides what to scaffold by asking which concepts no planned story introduces. A concept that an unplanned epic will introduce passes that test, so the plan inserts a scaffold for it.

That scaffold teaches the learner theory for work they are about to build. When the unplanned epic is planned later, the concept gains a story that introduces it, and the plan has already taught it once as background. The learner reads the same concept twice, once without the work that makes it concrete.

This epic stops that. A concept an unplanned epic will introduce is no longer treated as background. It is not scaffolded, the plan is not refused over it, and the reviewer at the gate sees which unplanned epic the concept waits on.

## Success Metrics

- On a roadmap with an unplanned epic, the plan holds no scaffold for a concept that epic will introduce.
- A reviewer at the gate can name, for each such concept, the unplanned epic it waits on.
- A roadmap whose members are all planned produces the same plan it produces today.

## Personas

This repository has no `docs/product/context.md`. The **delivery lead** runs the planning chain, the **reviewer** reads the gate, and the **learner** works through the approved plan.

## Smallest Usable Version

The rewrite does not scaffold a concept an unplanned epic will introduce

## User Stories

### Story #104: The rewrite does not scaffold a concept an unplanned epic will introduce

**As a** delivery lead, **I want** the plan to leave a concept to the unplanned epic that will introduce it, **so that** the learner is not taught the theory for work they are about to build.

#### Acceptance Criteria

- [ ] **Given** a learner slice that assumes a concept no planned story introduces and an unplanned epic will introduce, **when** the plan is rewritten, **then** no scaffold is inserted for that concept.
- [ ] **Given** the same roadmap, **when** the gate prints and the reviewer approves, **then** neither step refuses the plan because of that concept.
- [ ] **Given** the same roadmap, **when** the gate prints, **then** the reviewer sees that concept named beside the unplanned epic it waits on.
- [ ] **Given** a concept that no member of the roadmap, planned or unplanned, will introduce, **when** the plan is rewritten, **then** it is scaffolded as it is today.
- [ ] **Given** a roadmap whose members are all planned, **when** the plan is rewritten twice, **then** both runs produce the plan produced before this change.

#### Notes

How the concepts an unplanned epic will introduce are known is a design decision for the decision record. The unplanned epic's title and body are the only material it carries.

## Assumptions

- An unplanned epic's title and body are enough to say which concepts it will introduce.
- When the unplanned epic is planned later, the existing re-approval path teaches the concept through the story that introduces it.
- A concept only a handed-off story would introduce is still reported as a gap, as it is today.

## Out of Scope

- Planning the unplanned epic during a teaching session. #67 covers it.
- Removing a scaffold from a plan that was approved before this change.

## Open Questions

## Implementation Sequence

| Issue | blocked_by |
|---|---|
| #104 | none |
