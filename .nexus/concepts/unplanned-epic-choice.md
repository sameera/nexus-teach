---
title: "Unplanned Epic Choice"
aliases: ["three ways to plan", "not fully specified", "plan it here", "let the agent plan it", "plan it in a fresh session", "agent plans on the learner's behalf", "unplanned first epic"]
touches: ["planning-boundary", "planning-brief", "plan-re-approval", "workbook-name", "roadmap-members", "teaching-session"]
domain: "roadmap-planning"
last_updated_by: "#111"
status: active
verification: verified
---

# Unplanned Epic Choice

When the planning phase or a teaching session reaches an epic nobody has planned, it says that the next epic to be built is not fully specified and asks the learner how that epic gets planned. There are exactly three answers: the learner plans it here, the agent plans it here, or the learner plans it in a fresh session. Both places print the same question line.

## How It Works

The planning phase asks when a roadmap has no planned member. The session asks at the planning boundary, and again at every later boundary.

The code only stops and prints the question. The command wording asks it and runs the planning command for the epic. On the learner's path, the learner answers every question that command asks. On the agent's path, the agent answers them, approves each gate, re-plans the workbook and approves the new plan. On the fresh-session path nothing runs. The learner closes this session, plans the epic in a new one, and resumes.

The re-plan runs the planning phase again with the workbook's name given explicitly. Planning an epic can change its title, and a name taken from a changed title would be a different workbook with no interview.

Two gaps remain on the agent's path. A workbook with no approved plan still asks the learner for its suite and grading commands. A session re-plan asks for the roadmap's original input when the agent cannot work it out.

## Key Invariants

1. Every stop at an unplanned epic asks the same three-way question. An earlier answer is never reused, and the agent never picks a choice for the learner.
2. The epic asked about is the first unplanned one in the roadmap's order, or the first one the plan records past the boundary.
3. No code plans an epic. The refusal and the boundary verdict stay stops, and only the command wording runs the planning command.
4. On the agent's path, a gate that refuses stops the run. The refusal is reported, the learner is asked, and the agent never works around it.
5. The re-plan passes the workbook's name explicitly, reuses the recorded interview, and asks no interview question.
6. The fresh-session choice leaves the workbook and its interview as they are.
7. The session writes the planning brief before it asks, whatever the learner then picks.

## Integration Points

- [planning-boundary](planning-boundary.md) — supplies the epic asked about, from a roadmap with nothing planned or from the list the plan records past the boundary.
- [planning-brief](planning-brief.md) — written before the question is asked; the fresh-session choice points the learner at it.
- [plan-re-approval](plan-re-approval.md) — the approval a session re-plan runs through, so the taught slices are carried forward unchanged.
- [workbook-name](workbook-name.md) — given explicitly on the re-plan, because a name taken from the epic's changed title would be another workbook.
- [roadmap-members](roadmap-members.md) — the member order that picks the first unplanned epic when nothing on the roadmap is planned.
- [teaching-session](teaching-session.md) — ends its boundary verdict with this question, and may plan the epic and re-plan within the same sitting.

## Decision Log

### 2026-09-27 — #111 — Both stops at an unplanned epic ask one three-way question

A learner who reached an unplanned epic used to hit a hard stop in two places. The planning phase refused a roadmap with nothing planned, and the session ended at the planning boundary with a brief. Either way the learner had to plan the epic by hand before going on. Both places now ask how the epic gets planned, and one function prints the question line for both, so the two cannot drift apart. The command line still stops, and the command wording asks and plans, so no code plans an epic. The re-plan passes the workbook's name explicitly, because planning an epic can change its title. The fresh-session choice exists to keep the lesson's context small. On the agent's path the learner is still asked for the suite and grading commands on a first approval, and for the roadmap input when the session cannot tell it. Both are known gaps, deferred to #117 and #118. Refuted alternative: let each command body word its own question, which is simpler to write but lets the two wordings drift apart. Refuted alternative: derive the workbook name from the epic's title again on the re-plan, which needs no extra argument but loses the recorded interview when the title changed.
