---
title: "Close Record: The plan stops at the planning boundary and shows it"
epic: #66
feature: "Roadmap Planning"
date: 2026-09-20
nexus_version: 0.62.0
analyze: ran 2026-09-20 @ 97cba17fdc4bf732d86a93a6d783dbc7e2cc9d91
record: #89
record_hash: 5c4ea921b18ee8eb3c8abd40fbe9a5bbad9a4e0c6174cc91ba14993567ef4e8b
range:
  - repo: github.com/sameera/nexus-teach
    base: bd27da130a47d1e6841f8dd59bb1a2594a9bc4a7
    head: 2ecb1ed1026c1ae151dee9c3bd5c18ee7fcd0b66
---

# Close Record: The plan stops at the planning boundary and shows it

## Key Decisions

- **The first ADDRESS risk on record #89 was closed by refusing, not by accepting the window.**
  Record #89 left one decision open for implementation to take: either approval refuses when a
  planned member of the roadmap it is approving against contributed no slice to the draft, or the
  window is accepted and written down. Implementation took the refusal. `approvePlan` now compares
  the roadmap's story list against the stories the draft holds slices for and refuses a draft that
  is missing one, naming each. The reason is what the boundary is for: the committed plan does not
  merely omit the members it did not plan, it *states* them, and a statement that a set of epics was
  not planned is false the moment a member planned after the draft was written sits in neither the
  slices nor the list. The check costs nothing new to reach — approval already re-reads every
  drafted story against the live issue graph in the same pass. The refuted alternative is the
  record's own second option, accepting the window and documenting it. It is cheaper and adds no
  refusal to a path that already carries several, and a competent engineer could have chosen it on
  the grounds that the window is narrow. It loses because the cost of the window is not an omission
  a reader can notice; it is a committed file asserting something untrue, read later by the session
  that plans the next member.

- **The nothing-planned refusal is stated twice, at the CLI gate and inside `draftFromExtractions`.**
  Invariant 4 places the refusal at extraction, before any story is read, and `runExtract` carries
  it. `draftFromExtractions` repeats it. The reason is reachability: the drafting function is called
  by paths that did not come through `runExtract`, and on an all-unplanned roadmap it would
  otherwise write an empty draft that is indistinguishable from a planned roadmap whose extractions
  all failed. The refuted alternative is to rely on the single gate the invariant names, which is
  the record's own argument against multiplying control points, and is what a reader of invariant 4
  would expect the code to look like. It loses because this is not a second control point with a
  second condition — it is the same condition, computed by the same `hasPlannedMember` call, giving
  the same `nothingPlannedYet` message. Nothing can drift between the two, and the weaker version
  lets an empty draft exist.

- **The boundary is derived at the gate by the same call approval uses, not passed from one to the
  other.** `runGate` and `approvePlan` each call `unplannedMembers(roadmap)` on the roadmap they
  hold. Nothing carries the reviewer's boundary forward into approval. That is what makes the
  recomputation-on-re-approval decision in record #89 true by construction rather than by
  discipline: there is no stored list for a re-approval to carry forward, so a member planned since
  the last approval leaves the boundary and enters the slices without any code path needing to know
  that it should.

## Deviation Rationale

None. The shipped code matches record #89's chosen approach and all eleven of its invariants; the
conformance pass at `97cba17` recorded 0 critical, 0 high, 0 medium, 0 low, with 12 of 12 acceptance
criteria met across stories #85, #86 and #87. The two additions above resolve the record's own
ADDRESS risks rather than departing from anything it decided.

## Deferred Scope

Deferred items filed as epic stub issues:

- #88 — the coverage check still scaffolds a concept an epic nobody has planned yet will introduce,
  so the plan teaches the learner theory for work they are about to build.

## Process Lesson

Recorded in: `docs/delivery/lessons/2026-09-20-plan-stops-at-planning-boundary.md`
