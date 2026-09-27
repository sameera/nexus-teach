---
title: "Close Record: An unplanned epic is planned in whichever of three ways the learner picks"
epic: "#111"
feature: "Teaching Sessions"
date: 2026-09-27
nexus_version: 0.74.1
analyze: ran 2026-09-27 @ e0dfe452798c2d5ac0c826285505be3c60f3008e
range:
  - repo: github.com/sameera/nexus-teach
    base: 8adb4e0b72b163e33f336bcdfdaacc6e7fdab655
    head: e642a0c90e1e532667a4f44ea30c57a3b2137bbb
---

# Close Record: An unplanned epic is planned in whichever of three ways the learner picks

## Key Decisions

- **One question line, printed by both stops.** `notFullySpecified()` in `src/planning-boundary.ts` is the one sentence the teaching session prints at the planning boundary and `extract` prints on a roadmap with nothing planned. The learner meets the same three choices in the same words wherever an unplanned epic appears. Refuted alternative: let each command body word its own question, which lets the two drift apart.
- **The CLI stays a stop; the command body asks and plans.** `extract` still exits 1 on a roadmap with no planned member, and the teaching session still ends with the boundary verdict. The three-way question, the `/nxs.epic` run and the re-plan live in `nxsx.teach-plan.md` and `nxsx.teach.md`. No code plans an epic.
- **An unplanned epic is no longer a refusal in planning.** `epic-not-planned` is gone from the planning phase's refusal list. The epic resolves as an unplanned member, and a roadmap of only unplanned members goes to the new "Nothing planned yet" step.
- **The first unplanned epic in roadmap order is the one asked about.** `firstUnplannedMember()` follows the roadmap's own member order. Picking a different epic is out of scope.
- **The re-plan passes the workbook name explicitly.** Planning an epic can change its title, and a roadmap named from a changed title is a different workbook with no interview. Refuted alternative: derive the name from the title again, which would lose the recorded interview.
- **The planning brief is still written at the boundary, whatever the learner picks.** The session writes it before the question is asked, so it cannot know the answer. On an in-session choice the brief is a leftover note that nothing reads.
- **The fresh-session choice exists to keep the lesson's context small.** Planning in-session loads the planning phase's material into the teaching session.

## Deviation Rationale

No decision record exists for this epic. These deviations are measured against the epic's own promise: once the learner picks "let the agent plan it", they are asked nothing until the next lesson is ready, unless a gate refuses.

- **`nxsx.teach-plan` asks for the suite and grading commands on the agent path.** A workbook with no approved plan needs both commands at its first approval, and the planning phase forbids inferring them. So the agent path asks the learner for both right after the choice. Why: this was not intended. It is a gap to fix, deferred to #117.
- **`nxsx.teach` may ask for the roadmap input on the agent path.** The re-plan must re-run planning with the input the roadmap was first planned from (`--epic` or `--initiative`). The command body works it out from the plan's epics and asks the learner when it cannot tell. Why: this was not intended. It is a gap to fix, deferred to #118.

## Deferred Scope

Deferred items filed as epic stub issues:

- #117 — The agent plans a workbook's first epic without asking the learner for its commands
- #118 — The agent re-plans a workbook without asking the learner which roadmap it came from

## Process Lesson

Recorded in: `docs/delivery/lessons/2026-09-27-asks-nothing-meets-existing-gates.md`
