---
title: "Waiting Concept"
aliases: ["concept left to an unplanned epic", "waits on an unplanned epic", "waiting list", "deferred concept", "not scaffolded because an epic will introduce it"]
touches: ["scaffold-slice", "coverage-check", "plan-approval-gate", "story-concept-extraction", "concept-vocabulary-merge", "planning-boundary"]
last_updated_by: "#88"
status: active
verification: verified
domain: "roadmap-planning/ordering"
---

# Waiting Concept

A waiting concept is one a learner slice assumes, that no planned story introduces, and that an epic nobody has planned yet will introduce. The plan does not scaffold it and does not count it as a gap. It leaves the concept to that epic, so the learner meets the theory beside the work that makes it concrete.

## How It Works

Each unplanned epic on the roadmap is read once for the concepts it will introduce. The rewrite then holds back a scaffold only where it would otherwise have scaffolded the concept as background. A concept a planned learner story introduces too late is still scaffolded. A concept a handed-off story introduces is still a gap that names that story.

When several unplanned epics introduce the concept, the first one in roadmap member order is named. That is the epic the learner is told to plan next.

The coverage verdict records each waiting concept with its epic and the slice that assumes it. The list appears only when it holds a concept, so a fully planned roadmap's draft is unchanged. The gate prints each waiting concept under its epic and names the assuming slice. That slice is taught before the concept is, and the reviewer can choose to plan the epic first.

## Key Invariants

1. A concept is waiting only when a learner slice assumes it, the learner did not declare it, the taught part did not introduce it, no planned story introduces it, and an unplanned epic will introduce it.
2. A waiting concept gets no scaffold and is never a gap.
3. A concept a handed-off story introduces stays a gap, even when an unplanned epic also introduces it.
4. A waiting concept names the first unplanned epic in member order that introduces it.
5. The waiting list is recorded with the coverage verdict, and the gate and approval refuse a recorded list that a fresh check contradicts.
6. A waiting concept is never written into the committed plan.
7. A roadmap whose members are all planned has no waiting list, and its draft, verdict and gate print are unchanged.

## Integration Points

- [scaffold-slice](scaffold-slice.md) — the background case a waiting concept replaces; every other scaffold rule keeps its precedence.
- [coverage-check](coverage-check.md) — sorts each unreached assumption into a gap, a waiting concept or background, and records the waiting list.
- [plan-approval-gate](plan-approval-gate.md) — prints each waiting concept under its epic and recomputes the list before printing and approving.
- [story-concept-extraction](story-concept-extraction.md) — reads each unplanned epic once and supplies the concepts it will introduce.
- [concept-vocabulary-merge](concept-vocabulary-merge.md) — lets an epic's names join only as aliases of planned names, so a waiting concept carries a planned identifier.
- [planning-boundary](planning-boundary.md) — the block at the gate a waiting concept is printed inside, under the epic it waits on.

## Decision Log

### 2026-09-21 — #88 — A concept an unplanned epic will introduce waits on that epic

A scaffold for such a concept taught the learner theory for work they were about to build, away from the work that makes it concrete. The story that should introduce the concept would then only assume it. So the concept is left to the epic and shown at the gate instead. The deferral holds even though the assuming lesson then runs without the concept, because the learner reaches the planning boundary only after the last planned slice. The gate names the assuming slice so the reviewer can plan the epic first. The waiting list is recorded with the verdict rather than derived at the gate, because the scaffold decision lives on the draft. A list derived fresh after an epic body was edited could disagree with the draft, and the concept would then be neither taught nor shown. Refuted alternative: defer only when the waiting epic comes before the assuming slice's own epic in member order, and scaffold otherwise. That avoids most lessons on an untaught concept. It lost because it keeps the scaffold in the common case, which is the case this work exists to remove. Refuted alternative: derive the waiting list at the gate from the roadmap. That adds nothing to the draft, but it lost on the silent disagreement described above.
