---
feature: "Roadmap Planning"
feature_path: docs/features/roadmap-planning
epic: "An initiative resolves to the epics and stubs beneath it"
slug: initiative-resolves-to-members
created: 2026-09-20
type: enhancement
complexity: M
complexity_drivers: [one new way of naming a roadmap feeds the resolution path that already exists, three refusal stories all build on the expansion the first story establishes, the children of an initiative have to be classified before a roadmap can hold them]
concepts: []
link: "#65"
record: "#82"
record_state: closed
---

# Epic: An initiative resolves to the epics and stubs beneath it

## Description

A roadmap is named today by listing the issue number of every epic it holds, or by a search expression that returns those numbers. Both work, and both make the lead restate something the issue graph already knows. An initiative is an issue whose children are exactly the epics of a body of work, so the lead who names ten numbers is copying a list that already exists one level up.

This epic makes one initiative issue number name a whole roadmap. Resolution reads the children of that initiative and treats them as the set of numbers a roadmap is built from, so every rule a roadmap already applies to a named set applies to them unchanged. A child that is a planned epic resolves with its stories, as it does now. A child that is an epic nobody has planned yet resolves as a member with a title and a body and no stories, which is what the epic before this one made possible. "An epic nobody has planned yet" and the word "stub" in the titles below name the same thing. The longer phrase is used in the body and in every message a lead reads, because "stub" already names a slice of a teaching plan in this codebase and one word for two things makes a refusal unreadable.

Three refusals come with it, because an initiative can fail to name a roadmap in ways a list cannot. It can have no children at all. It can have more children than a roadmap may hold. It can have a child that is not an epic of either kind. Each of these is refused before a roadmap is written, and each refusal names what is wrong, so the lead fixes the initiative rather than guessing why an empty or partial roadmap came back.

## Success Metrics

- A roadmap that today is named by listing ten epic numbers is named instead by the one initiative issue number above them, and resolves to the same ten members.
- Every member the roadmap holds when it is named by an initiative is the same member, of the same kind, that it holds when the children are named directly.
- An initiative that cannot name a roadmap is refused before a roadmap is written, and the refusal names which initiative or which child is the problem.

## Personas

This repository has no `docs/product/context.md`, so there is no canonical persona set to point at. One actor appears below. The **delivery lead** names the roadmap and reads what comes back, whether that is a resolved roadmap or a refusal.

## Smallest Usable Version

An initiative issue number resolves to its sub-issues

## User Stories

### Story #78: An initiative issue number resolves to its sub-issues

- **story_type:** user
- **size:** M

**As a** delivery lead, **I want** to name a roadmap by the one issue number of the initiative above it, **so that** I do not restate a list of epics the issue graph already holds.

## Acceptance Criteria

- [ ] **Given** an initiative whose children are epics, some planned and some not, **when** a roadmap is resolved from that one issue number, **then** the roadmap holds one member for each of those children.
- [ ] **Given** the same set of children, **when** the roadmap is resolved from the initiative and then from the children named directly, **then** the two roadmaps hold the same members, each stating the same kind.
- [ ] **Given** an unchanged issue graph, **when** a roadmap is resolved from the same initiative twice, **then** it holds the same members in the same order both times.
- [ ] **Given** an issue number that names an epic rather than an initiative, **when** a roadmap is resolved from it, **then** it resolves exactly as it does today.

## Notes

The children of the initiative become the set of numbers a roadmap is built from, so ordering, member kind and every existing refusal apply to them without a second copy of any rule.

### Story #79: An initiative with no children is refused

- **story_type:** user
- **size:** S

**As a** delivery lead, **I want** an initiative with nothing beneath it to be refused, **so that** I am not handed an empty roadmap that reads as a complete one.

## Acceptance Criteria

- [ ] **Given** an initiative with no children, **when** a roadmap is resolved from its issue number, **then** resolution is refused and no roadmap is written.
- [ ] **Given** that refusal, **when** the lead reads it, **then** it names the initiative by issue number and says the initiative has nothing beneath it.
- [ ] **Given** an initiative every one of whose children is an epic nobody has planned yet, **when** a roadmap is resolved from its issue number, **then** it resolves and is not refused.

### Story #80: A child that is neither an epic nor a stub is refused by name

- **story_type:** user
- **size:** S

**As a** delivery lead, **I want** a child beneath the initiative that is not an epic of either kind to stop the whole resolution, **so that** a roadmap never quietly drops something the initiative says belongs to it.

## Acceptance Criteria

- [ ] **Given** an initiative one of whose children is neither a planned epic nor an epic nobody has planned yet, **when** a roadmap is resolved from its issue number, **then** resolution is refused and no roadmap is written.
- [ ] **Given** that refusal, **when** the lead reads it, **then** it names the offending child by issue number and says what about it cannot be part of a roadmap.
- [ ] **Given** an initiative with more than one such child, **when** resolution is refused, **then** nothing partial is left behind and the lead can re-run once the initiative is corrected.

### Story #81: The epic cap is checked against the children before any child is fetched

- **story_type:** system
- **size:** S

**As a** delivery lead, **I want** an initiative with more children than a roadmap may hold to be refused before anything beneath it is read, **so that** an oversized roadmap costs one read rather than dozens.

## Acceptance Criteria

- [ ] **Given** an initiative with more children than a roadmap may hold, **when** a roadmap is resolved from its issue number, **then** resolution is refused and not one of those children is read.
- [ ] **Given** that refusal, **when** the lead reads it, **then** it says how many members a roadmap may hold and that the set must be narrowed before re-running.
- [ ] **Given** an initiative with exactly as many children as a roadmap may hold, **when** a roadmap is resolved from its issue number, **then** every child resolves as a member.
- [ ] **Given** children of both kinds, **when** they are counted against the limit, **then** an epic nobody has planned yet counts the same as a planned one.

## Assumptions

- An initiative names its children as GitHub sub-issues, and a roadmap reads them there and nowhere else.
- An initiative carries no epic classification, so the number naming one is not a number a roadmap could already resolve as an epic.
- The children are expanded into a set of numbers before a roadmap is assembled, so every rule a roadmap already applies to a named set applies to them unchanged.
- A child that is an epic nobody has planned yet resolves as it does today, because the epic that made a roadmap hold such a member has already landed.
- One initiative number names a whole roadmap on its own, and is never combined with other numbers in the same roadmap.

## Out of Scope

- Any change to how a roadmap named by a list of epic numbers, or by a search expression, resolves today.
- What the planning chain does with a roadmap that holds epics nobody has planned yet. #66 covers it.
- Planning one of those epics during a teaching session. #67 covers it.
- Reading past a child of an initiative, such as an initiative nested beneath an initiative.
- Changing how many members one roadmap may hold.

## Open Questions

## Implementation Sequence

| Issue | blocked_by |
|---|---|
| #78 | none |
| #79 | #78 |
| #80 | #78 |
| #81 | #78 |
