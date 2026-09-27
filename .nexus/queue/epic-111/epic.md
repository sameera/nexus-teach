---
feature: "Teaching Sessions"
feature_path: docs/features/teaching-sessions
epic: "An unplanned epic is planned in whichever of three ways the learner picks"
slug: unplanned-epic-three-ways-to-plan
created: 2026-09-26
type: enhancement
complexity: S
complexity_drivers: [both paths run the existing planning command and differ only in who answers its questions, the re-plan and its carry-forward already exist, most of the change is command wording plus the one refusal in the planning phase]
concepts: []
link: "#111"
---

# Epic: An unplanned epic is planned in whichever of three ways the learner picks

## Description

A roadmap that is still growing holds epics nobody has planned yet. Today two places stop on one. The planning phase refuses a roadmap whose members are all unplanned, so the learner must plan the first epic before any workbook can be planned. The teaching session reaches the end of the planned slices and hands the learner a brief, and the learner plans the next epic outside the session. Both stops are hard: the learner cannot move on until they plan an epic by hand.

This epic replaces both stops with one question. When either place reaches an epic nobody has planned, it says that the next epic to be built is not fully specified. It then asks the learner how that epic gets planned. There are three answers. The learner can plan it now in this session, with the planning command asking the questions. The agent can plan it now in this session, answering every question the planning command asks with its own judgment, then re-plan the workbook and approve the new plan without checking back. Or the learner can close this session, plan the epic in a fresh one, and resume teaching afterwards, so a long planning conversation does not crowd out the lesson.

## Success Metrics

- A roadmap whose epics are all unplanned produces an approved plan in one sitting, where today the planning phase refuses it.
- A learner who picks the judgment path is asked nothing between choosing it and the next lesson being ready, unless a gate refuses the new plan.
- Every time the session or the planning phase reaches an unplanned epic, it asks the same three-way question, and every answer leads either to a planned epic or to an unchanged workbook.

## Personas

This repository has no `docs/product/context.md`, so there is no canonical persona set to point at. The **learner** is who every story here is written from.

## Smallest Usable Version

The session asks how an unplanned epic gets planned; Planning starts from a roadmap with no planned epic

## User Stories

### Story #112: The session asks how an unplanned epic gets planned

- **story_type:** user
- **size:** S

**As a** learner, **I want** the session to ask me how the next unplanned epic gets planned when I reach it, and then plan it that way, **so that** reaching an unplanned epic does not stop my teaching.

#### Acceptance Criteria

- [ ] **Given** every planned slice is taught and the plan records an epic nobody has planned, **when** the session runs, and on every later unplanned epic it reaches, **then** it says that the next epic to be built is not fully specified, names that epic by number and title, and offers exactly three choices: plan it here, let the agent plan it, or plan it in a fresh session
- [ ] **Given** the learner picks plan it here, **when** the session continues, **then** it runs `/nxs.epic <n>` and the learner answers every question the command asks, and the re-planned workbook is then shown to the learner at the approval gate
- [ ] **Given** the learner picks let the agent plan it, **when** the session continues, **then** it runs `/nxs.epic <n>`, the agent answers every question that command asks and approves its gate as ticked, and the agent re-plans the workbook and approves the new plan, all without asking the learner
- [ ] **Given** a gate refuses while the agent is planning on the learner's behalf, **when** the refusal is reported, **then** the session stops, names the refusal and asks the learner rather than working around it
- [ ] **Given** the learner picks plan it in a fresh session, **when** the session stops, **then** it writes the planning brief the session writes today and tells the learner to close this session, run `/nxs.epic <n>` in a new one, and then resume teaching

### Story #113: Planning starts from a roadmap with no planned epic

- **story_type:** user
- **size:** S

**As a** learner, **I want** to start planning a workbook from a roadmap whose epics are all unplanned, **so that** I do not have to plan the first epic by hand before the workbook exists.

#### Acceptance Criteria

- [ ] **Given** a roadmap whose members are all unplanned epics, **when** the planning phase would stop with nothing to plan, **then** it does not stop, and instead asks the same three-way question about the first unplanned epic in roadmap order
- [ ] **Given** the first epic was planned through either in-session choice, **when** planning continues, **then** the plan is drafted from the newly planned epic, with the interview answers reused and not asked again
- [ ] **Given** the learner picks plan it in a fresh session, **when** planning stops, **then** it tells the learner to plan the epic in a new session and run the planning phase again, and the workbook and interview are left as they are

## Assumptions

- Planning an unplanned epic through the planning command gives it the same stories, gates and issues whether the learner or the agent answers its questions.
- The re-plan after an epic is planned uses the approval gate's existing carry-forward, so already-taught slices and their lessons stay byte for byte unchanged.
- "Lesson segment" means one lesson: the theory and exercise for one slice.

## Out of Scope

- Remembering the learner's answer and applying it to later unplanned epics without asking.
- Choosing a different epic than the first one past the planning boundary.
- Changing how the planning command itself asks, sizes or files anything.
- Writing the decision record for the newly planned epic. #68 covers it.

## Open Questions

## Implementation Sequence

| Issue | blocked_by |
|---|---|
| #112 | none |
| #113 | #112 |
