---
date: 2026-09-20
epic: "A roadmap carries epics nobody has planned yet"
source: "#64"
---

# Lesson: A dense record spends its cost at planning, not at close

**Estimate versus actual.** Sized M on four stories. It shipped as one pull request with one commit
per story, passed conformance on the first analyze run with zero critical and zero high findings,
and closed with no deviation from its decision record. The M held.

The reason it held is worth naming, because it is repeatable. Record #75 carried eight key decisions
and fourteen invariants, and several of those decisions settle questions that would otherwise have
been answered mid-implementation: where the relaxation lives, whether the old numbers list survives
beside the new member list, what the member order does when planned and unplanned members mix, and
whether the cap changes. An epic of this shape with a thinner record does not come in at M — it
comes in at M plus the rework of whichever of those four got decided wrong at the keyboard. The next
epic in this area should expect the same trade: a long record is not overhead against an M, it is
what makes the M true.

**Decomposition.** Story #71 established the member shape and #72, #73 and #74 all blocked on it.
That is the right shape and it should be copied: one story fixes the type everything else reads, and
the rest become additive. It also meant the whole epic could ship as a single pull request with one
commit per story, rather than four pull requests serializing on each other's review.

**What the next epic here should do differently.**

Record #75 renumbered invariants that existing code comments already cited. Two docblocks in
`src/roadmap.ts` were rewritten by this epic and kept bare pointers — `(invariant 13)`,
`(invariant 12)` — that numbered against the earlier record, so beside the new prose they read as
#75's numbering and were wrong. Analyze caught it as a low finding; nothing else would have. The
habit that prevents it is already the repository's convention in other modules: write
`(record #NNN, invariant N)`, never a bare number. When an epic renumbers invariants, the bare
citations in the files it touches are part of its surface.

**Sequencing to carry forward.** This epic deliberately does not reach a released build before #66,
because every phase after resolution iterates stories and would silently omit an unplanned member
from extraction, the draft, the rewrite, the coverage check and the committed plan. That constraint
lives only in the record's prose. It is not readable from the code, no test asserts it, and #65
waits on the same sequence. Whoever cuts the next release in this area has to know it; this lesson
is one of the few places it is written down outside record #75.

**Tooling friction worth knowing.** The epic's branch was rebase-merged, so the four commits on main
have different identities from the four the analyze receipt stamped, with identical trees. A local
`/nxs.close` reads that as four unanalyzed commits and asks for a waiver it does not need. Closing
through `/nxs.close --pr <N>` compares the receipt against the pull request head by full SHA and
reports clean. After a rebase-merge, close through the pull request.
