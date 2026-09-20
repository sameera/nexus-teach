---
title: "Close Record: A roadmap carries epics nobody has planned yet"
epic: #64
feature: "Roadmap Planning"
date: 2026-09-20
nexus_version: 0.61.0
analyze: ran 2026-09-20 @ cc1636c62b149a5e3a6fcb63802fb6ca2b30c7cd
record: #75
record_hash: fa95ac5c50e1324287db05b72bd79c908c239908a766c497c1f80355e4184b53
range:
  - repo: github.com/sameera/nexus-teach
    base: 474d096e67334433b579ed18d6af3c21cc06a680
    head: bfeac465b032b00980a496ad8af2692890046f52
---

# Close Record: A roadmap carries epics nobody has planned yet

## Key Decisions

- **The derived-and-uncommitted invariant is held by `.gitignore`, not by convention.** Record #75's
  invariant 14 says the resolved roadmap stays derived and uncommitted, but not what holds it there.
  The implementation added `.nexus/tmp/` to `.gitignore` in the same change. The reason is that the
  resolver's output directory now carries an unplanned member's whole issue body, which reads like
  material worth keeping, and an invariant only a reviewer enforces is one commit away from being
  false. Refuted viable alternative: leave it to review, on the evidence that nothing had committed
  the directory in the time it already existed — defensible, and it keeps the diff to the epic's own
  surface, but the entry costs one line and the first accidental commit costs the invariant.

- **The member order emits a blocker immediately before the first member waiting on it, in one pass,
  with no chain to follow.** Record #75 decided an unplanned member is pulled ahead of the planned
  work that waits on it; it did not say where among several waiters it lands. The implementation
  places it directly before the lowest-numbered waiter and sorts multiple blockers ascending. One
  pass is provably enough rather than merely convenient: every edge runs from an unplanned member to
  a planned one, and an unplanned member waits on nothing, so no chain can exist — which is also
  what makes a member-level cycle unconstructible. Refuted viable alternative: a general topological
  sort over the member graph, which would survive the edge rule widening later; rejected because it
  would carry a cycle-refusal path for cycles the edge rule makes impossible, and code for an
  unreachable state cannot be tested.

- **The diagnostic-name coupling is pinned by a spec that drives the installed resolver with only
  `gh` faked.** Record #75 raised this as an ADDRESS risk and asked for a test exercising the
  installed resolver rather than a substitute. `src/roadmap-cli.spec.ts` fakes the `gh` runner alone
  and lets the real `@nexus/epic-resolve` package raise `epic-not-planned`, with the fixture
  carrying the `needs-refinement` label the shared publishing resolver falls back to. Refuted viable
  alternative: assert on the diagnostic string constant directly — cheaper and more obviously
  aimed at the coupling, but it pins this repository's copy of the name instead of the installed
  package's behaviour, so it would keep passing through exactly the upstream rename it exists to
  catch.

- **`EpicResolver` was deleted rather than kept beside `MemberResolver`.** Record #75 decided the
  seam widens from resolving an epic to resolving a member, and that the relaxation lives in the
  wiring rather than the assembly; it did not say whether the narrower type survives. The
  implementation removed it and moved the `ResolveEpicResult` import out of `src/roadmap.ts` into
  `src/workbook-cli.ts`, so the assembly module can no longer name the shared resolver's result type
  at all. That absence is what enforces the second decision — assembly cannot reach for the
  resolver's markdown or react to its refusals, rather than being asked in a comment not to.

## Deviation Rationale

None. The close-from-diff pass over `474d096e`…`bfeac465`, checked against record #75's chosen
approach and all 14 of its invariants, found no divergence: the relaxation keys on the resolver's
own `epic-not-planned` diagnostic and names no label, it sits behind the single teach-from call
site, `members` replaced `epics` outright rather than joining it, `orderMembers` reads only edges
with an unplanned endpoint, the member-count check still runs on the named numbers before any fetch
and counts both kinds alike, and `excludeUnplanned` defaults to on and is dropped only on the
teach-from path. The cap raise from ten to twenty-five is authorized by the record rather than by a
story, as the record itself states. This is a matched implementation, not an unexamined one.

## Waived Stories

none

## Deferred Scope

none. The epic's out-of-scope items are already filed and were not deferred by this close: #66
(the planning chain's handling of a roadmap holding unplanned members), #65 (resolving one
initiative number to the epics and stubs beneath it) and #67 (planning a stub during a teaching
session).

## Process Lesson

Recorded in: `docs/delivery/lessons/2026-09-20-roadmap-carries-unplanned-epics.md`
