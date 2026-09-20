---
title: "Close Record: An initiative resolves to the epics and stubs beneath it"
epic: "#65"
feature: "Roadmap Planning"
date: 2026-09-20
nexus_version: 0.61.0
analyze: ran 2026-09-20 @ 8bd97c825cf7448f8126b7e20f4643f11b3dae8e
record: "#82"
record_hash: 08f405a407280ec23203d95e0582dd28b57051d14be79100ef1c53ab39c27ee9
range:
  - repo: github.com/sameera/nexus-teach
    base: ec58cde1239c2dd12dd9f22c45b5daead7fc96ae
    head: c3ba6fe6569a5f0ac677a1cc4062fbf25ed7fd47
---

# Close Record: An initiative resolves to the epics and stubs beneath it

## Key Decisions

- **The new refusal is named to read as a sibling of the refusals already there.** Record #82 required a diagnostic distinct from the roadmap's existing empty-set refusal and did not name it. The implementation named it so that it sits beside the existing empty and cap refusals as one family, rather than reading as a refusal from somewhere else in the system. The lead who meets it has already met the other two.
- **The third input mode is spelled the same way the epic mode is.** It takes an issue number in the same shape, through the same number-parsing helper that mode already used, and it joins the same mutual exclusion the epic and query modes are in. Nothing about naming a roadmap by an initiative is a new idiom for the lead to learn. The alternative was a mode selected by the shape of the number, which record #82 had already refused for a stronger reason: an initiative is not distinguishable from a bug or a chore by anything the installed package reads.
- **A title that cannot be read reuses the not-found refusal the epic mode already raises.** When the lead gives no name, the initiative's title is read to default the roadmap's name, and that read can fail. It fails under the same diagnostic a missing epic issue raises rather than a third not-found name. The two failures are the same fact for the lead: the number they gave names no issue that can be read. A third name for it would make the refusal list longer without making any refusal clearer.
- **The title is read before the member cap is checked, and that ordering is accepted rather than optimised.** For an initiative with no explicit name and more children than a roadmap may hold, the title read happens and is then thrown away when the cap refuses. It costs one read of the initiative, never a read of a child, so the saving the cap exists for is intact. Ordering it the other way would mean resolving the roadmap before knowing what to call it, which puts the workbook's identity downstream of the work it names. Invariant 8 of record #82 already exempts the title read from the cap-check ordering, so this is the record's own position rather than a departure from it.
- **The test fixture was generalised from one epic to a graph of issues.** The existing fake answered for a single epic and its stories. An initiative's children cannot be expressed in that shape at all, so the fixture became a small graph that can state a parent, children and labels for any issue, with the old single-epic fake kept as a thin wrapper so no existing test was rewritten. This was not required by record #82. It is what makes the four new behaviours testable without a network, which is how the rest of this suite already works.

## Deviation Rationale

None. The shipped code matches record #82 in full: all six key decisions and all eight invariants are satisfied, and both ADDRESS risks materialised exactly as the record described them and were accepted on the terms it set.

## Deferred Scope

none

## Process Lesson

Recorded in: `docs/delivery/lessons/2026-09-20-initiative-resolves-to-members.md`
