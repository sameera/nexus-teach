---
title: "Coverage Check"
aliases: ["coverage verdict", "coverage gap", "clean verdict", "focus boundary gap", "gap names the handed-off story", "plan with gaps"]
touches: ["plan-rewrite", "plan-draft", "scaffold-slice", "prior-knowledge-declaration", "focus-marking", "story-concept-extraction", "plan-approval-gate", "waiting-concept"]
domain: "roadmap-planning/ordering"
last_updated_by: "#88"
status: active
verification: verified
---

# Coverage Check

The last pass of the rewrite checks the finished plan and names every gap, not only the first. A gap is a learner slice assuming a concept that no earlier learner slice introduces and the learner did not declare. The plan is written whatever the verdict and carries it, but a plan with any gap does not go to approval.

## How It Works

A gap is a bug in the plan, and the check catches it before any lesson is written. Two readings are deliberately not gaps. A concept no story on the roadmap introduces is background the plan teaches for itself. A concept an earlier learner slice already introduced is covered, whatever order produced that.

When the missing concept is one only a handed-off story would introduce, the gap names that story. Such a gap says the focus boundary is in the wrong place, because a learner slice assumes something the plan decided the learner will not build. A handed-off stub carries no concepts, so the check reads that story's checked list and joins it to the kept identifiers through the names the merge folded away.

Scaffolds already remove most late-introduction gaps. The check still looks for them, so it holds for whatever sequence it is handed. A verdict that is not clean makes the command fail after writing the plan, so the planning session stops in code rather than on instruction. The gate then refuses the draft a second time, and recomputes the verdict rather than trusting the one recorded, because the draft is a file an agent can write.

## Key Invariants

1. The check runs last, over the finished plan, and names every gap.
2. A learner slice assuming a concept that no earlier learner slice introduces, and the learner did not declare, is a gap.
3. A concept no story on the roadmap introduces is not a gap.
4. A gap whose concept only a handed-off story introduces names that story.
5. The plan is written whatever the verdict, and the verdict travels with it.
6. ~~A plan whose verdict is not clean stops the planning pass before approval.~~ A plan whose verdict is not clean, absent, or contradicted by a fresh check stops the planning pass and is refused again at the gate.
7. The check reads no story text; a handed-off story's concepts come from its checked list.

## Integration Points

- [plan-rewrite](plan-rewrite.md) — the pass sequence this check ends, run over the order it produced.
- [plan-draft](plan-draft.md) — where the verdict is recorded, beside the slices it judges.
- [scaffold-slice](scaffold-slice.md) — removes late-introduction gaps, and never covers a gap this check must report.
- [prior-knowledge-declaration](prior-knowledge-declaration.md) — the declared concepts this check counts as satisfied wherever a slice assumes them.
- [focus-marking](focus-marking.md) — the boundary a gap naming a handed-off story says is drawn in the wrong place.
- [story-concept-extraction](story-concept-extraction.md) — the handed-off story's checked list, the only record of what that story would introduce.
- [plan-approval-gate](plan-approval-gate.md) — runs this check again over the draft's slices before printing and again before writing, and names every gap in its refusal.
- [waiting-concept](waiting-concept.md) — the third kind of unreached assumption, recorded with the verdict and recomputed like a gap.

## Decision Log

### 2026-09-12 — #457 — Every gap is named, the plan is still written, and the command fails

A gap is diagnosed by reading the plan, because the reviewer needs to see which slice assumes what and where its introducer went. So the rewritten plan is written with its verdict, and the command then fails so the session stops without relying on its instructions. A gap from a handed-off story is reported rather than scaffolded, because it means the focus boundary is wrong, and a scaffold would teach theory for work the learner is not building. The check keeps looking for concepts no earlier slice introduces, even though scaffolds remove that case whenever dependency edges are supplied, because the check must not depend on the scaffold pass having run. Refuted alternative: write nothing when coverage fails, as the draft write does for incomplete input. That keeps one rule for writes, but here the input is complete and the plan itself is the finding, so discarding the plan discards the evidence.

### 2026-09-13 — #458 — The refusal is code that recomputes, at the gate and again at the write

A recorded verdict was the only thing standing between a plan with a gap and a reviewer, and the draft is a file an agent can write — so a hand-set clean verdict was the cheapest way around the gate. The refusal now recomputes coverage over the draft's own slices, in the step that prints the gate and again in the step that writes the approval, and refuses three cases the same way: no verdict at all, a verdict naming a gap, and a recorded verdict a fresh check contradicts. Every gap is named, and nothing in the committed workbook is written. Refuted alternative: trust the recorded verdict alone, which is simpler and keeps one source of truth; it lost because a code refusal that a hand edit defeats is an instruction with extra steps. This entry also records the reciprocal link from plan-approval-gate.

### 2026-09-19 — #691 — Moved here from the Nexus repository

The teaching stage now ships as a package of its own, and this page came with it, decision log and all. Nothing it asserts changed; the store it is asserted in did. The Nexus repository keeps a retired forwarding entry under this slug, so a reader who greps the old name is told where the page went rather than finding nothing.

### 2026-09-21 — #88 — A third reading that is not a gap: waiting on an unplanned epic

An assumption nothing in the plan reaches is now sorted three ways: a gap, a concept waiting on an unplanned epic, or background. A waiting concept never makes the verdict unclean. It is recorded with the verdict, beside its epic and the slice that assumes it, and only when the list holds one, so a fully planned roadmap's draft is unchanged byte for byte. The gate and approval recompute the list and refuse a recorded one a fresh check contradicts, on the same terms as a gap, because the draft is a file an agent can write. Invariant 3 stands as written, because a waiting concept is not a gap; the waiting case is described on its own page, since this page sits at the word cap. This entry also records the reciprocal link from waiting-concept.
