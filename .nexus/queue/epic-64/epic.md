---
feature: "Roadmap Planning"
feature_path: docs/features/roadmap-planning
epic: "A roadmap carries epics nobody has planned yet"
slug: roadmap-carries-unplanned-epics
created: 2026-09-20
type: enhancement
complexity: M
complexity_drivers: [a shared resolution contract gains a second kind of member, three stories build on the member shape the first one establishes, a refusal other stages still depend on becomes conditional]
concepts: []
link: "#64"
record: "#75"
record_state: closed
---

# Epic: A roadmap carries epics nobody has planned yet

## Description

A roadmap is resolved from issue numbers today, and every member it holds has to be a planned epic. The moment one of those numbers names a stub, an epic identified but not yet planned, resolution stops. That is the right answer for a roadmap somebody must plan in full before anyone works through it. It is the wrong answer for a roadmap a learner is taught from while it is still growing, because the unplanned tail of an initiative is exactly the part that has not been written yet.

This epic makes a roadmap able to hold both kinds of member. A planned epic resolves as it does now, carrying its stories, their bodies and the edges between them. A stub resolves as a member that carries its own title and body and nothing else, because there is nothing else on it yet. The roadmap then says which of its members are stubs, and gives one order across both kinds, so a later reader can find the point where planned work runs out instead of inferring it.

Two refusals stand in the way, and both become conditional. Resolution refuses a stub by name. The query that can name a roadmap filters stubs out before it runs. Each refusal is kept for every other use, and relaxed only where a roadmap is being resolved to teach from.

## Success Metrics

- A roadmap naming planned epics and stubs together resolves and returns every member, where today it stops at the first stub.
- A reader of the resolved roadmap can tell each stub from a planned epic without going back to the issue graph.
- Re-resolving an unchanged roadmap gives the same members in the same order every time.

## Personas

This repository has no `docs/product/context.md`, so there is no canonical persona set to point at. Two actors appear below. The **delivery lead** names the roadmap and reads what comes back. The **learner** is taught from the workbook that roadmap produces.

## Smallest Usable Version

A stub resolves as a roadmap member with no stories; The resolved roadmap says which members are stubs; One order spans planned epics and stubs

## User Stories

### Story #71: A stub resolves as a roadmap member with no stories

**As a** delivery lead, **I want** a roadmap to accept an epic nobody has planned yet, **so that** I can teach from work that is still growing.

## Acceptance Criteria

- [ ] **Given** a roadmap named from an issue that is a stub, **when** the roadmap is resolved to teach from, **then** resolution succeeds and that issue is one of the roadmap's members.
- [ ] **Given** that member, **when** a reader opens the resolved roadmap, **then** the member carries the title and the body of the issue it came from.
- [ ] **Given** that member, **when** a reader counts its stories, **then** it has none, and the roadmap holds no story belonging to it.
- [ ] **Given** a roadmap naming planned epics and stubs together, **when** it is resolved, **then** each planned member still carries its stories, their bodies and the edges between them.

## Notes

Resolution stops on the first member it cannot read today, and that behaviour is kept for every failure other than this one. A roadmap that quietly omits a member the lead asked for cannot be told apart from a complete one.

### Story #72: The resolved roadmap says which members are stubs

**As a** delivery lead, **I want** the resolved roadmap to say which of its members are stubs, **so that** everything reading it afterwards knows where planned work runs out.

## Acceptance Criteria

- [ ] **Given** a resolved roadmap, **when** any member is read, **then** the roadmap says whether that member is a planned epic or a stub, and it says so for every member.
- [ ] **Given** a reader holding a resolved roadmap, **when** they ask which members are stubs, **then** the answer comes from the roadmap alone and needs no further read of the issue graph.
- [ ] **Given** a roadmap whose members are all planned, **when** it is resolved, **then** its members, its stories and their order are what they were before this change.

### Story #73: One order spans planned epics and stubs

**As a** delivery lead, **I want** one order covering planned epics and stubs alike, **so that** the point where the plan runs out is a position in that order rather than a guess.

## Acceptance Criteria

- [ ] **Given** a roadmap holding planned epics and stubs, **when** it is resolved, **then** it gives one order over all of its members.
- [ ] **Given** a stub that planned work waits on, **when** the roadmap is resolved, **then** the stub sits before that work in the order.
- [ ] **Given** an unchanged issue graph, **when** the same roadmap is resolved twice, **then** both resolutions give the same members in the same order.
- [ ] **Given** a roadmap whose members are all planned, **when** it is resolved, **then** the order over those members is the order it had before this change.

### Story #74: A backlog query can return stubs

**As a** delivery lead, **I want** the query that names a roadmap to return stubs as well, **so that** a growing roadmap can be named by one search instead of by listing every issue on it.

## Acceptance Criteria

- [ ] **Given** a query that names a roadmap to teach from, **when** it runs, **then** the stubs it matches come back as members instead of being filtered out.
- [ ] **Given** a query that enumerates epics for planned work, **when** it runs, **then** stubs are still kept out of it.
- [ ] **Given** a query matching more members than one roadmap may hold, **when** it runs, **then** it is refused before any member is read.

## Assumptions

- Conditional means the stage that resolves a roadmap to teach from admits a stub, and the refusal stands everywhere else.
- The resolver that refuses a stub ships from an installed package rather than from this repository, so this epic works around that refusal rather than editing it.
- A stub carries a title and a body, and nothing a roadmap could read as a story or an edge between stories.
- The limit on how many members one roadmap may hold counts a stub the same as a planned epic.
- A roadmap whose members are all stubs still resolves; what to do with such a roadmap is decided by the phases that read it.

## Out of Scope

- What the planning chain does with a roadmap that holds stubs: extraction, the rewrite, the coverage check and the approval gate. #66 covers it.
- Resolving one initiative number to the epics and stubs beneath it. #65 covers it.
- Planning a stub during a teaching session. #67 covers it.
- Any change to how a roadmap of fully planned epics resolves today.

## Open Questions

## Implementation Sequence

| Issue | blocked_by |
|---|---|
| #71 | none |
| #72 | #71 |
| #73 | #71 |
| #74 | #71 |
