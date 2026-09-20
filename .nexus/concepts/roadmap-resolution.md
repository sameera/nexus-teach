---
title: "Roadmap Resolution"
aliases: ["resolving a roadmap", "unplanned epic refusal", "teach-from resolution", "fail-closed resolution", "what a named number becomes"]
touches: ["roadmap-members", "roadmap-naming", "workbook-store"]
domain: "roadmap-planning"
last_updated_by: "#65"
status: active
verification: verified
---

# Roadmap Resolution

Every issue number a roadmap was named by goes to the shared epic resolver unchanged, and exactly one of that resolver's refusals, the one it raises for an epic identified but not planned, becomes an unplanned member instead of an error. Every other refusal fails the whole resolution and writes nothing. Which numbers arrive here, and how many, is settled before resolution starts.

## How It Works

Reacting to the resolver's own refusal keeps one definition of unplanned in the system, and it inherits that resolver's whole boundary: the check that a number really is an epic runs first, so a story number or a decision-record number is still refused. Only for an unplanned member is the issue read a second time, for the title and body it carries.

That reaction lives in the one place a roadmap is resolved to teach from, so nothing else in this repository and no other reader of the resolver can reach it.

The same boundary answers a question naming cannot. A number that names nothing an epic can be built from is refused here by the resolver itself, whether the lead listed it, a search returned it, or it came from the children of an initiative. Resolution never learns which of those it was.

A roadmap whose members are all unplanned still resolves, and the phase that reads it decides what to do with it.

## Key Invariants

1. Resolution stays fail-closed: the one named refusal for an unplanned epic becomes a member, and every other refusal fails the whole resolution with nothing written.
2. This stage never names the marker that identifies an unplanned epic, and keeps no second rule for deciding that a member is unplanned.
3. The check that a named number really is an epic runs before the unplanned check, so a story number or a decision-record number is still refused for a roadmap.
4. A number that is not an epic of either kind is refused by the shared resolver's own diagnostic, reused as it is written, whichever way the roadmap was named.

## Integration Points

- [roadmap-members](roadmap-members.md) — the ordered list this produces, and the one place each member's kind is recorded.
- [roadmap-naming](roadmap-naming.md) — settles which issue numbers reach this stage, and how many, before any of them is read.
- [workbook-store](workbook-store.md) — the workbook created once resolution succeeds.

## Decision Log

### 2026-09-20 — #64 — An unplanned member is recognised by the resolver's own refusal

A roadmap taught from has to hold the epics nobody has planned yet, and the shared resolver refuses exactly those by name. That refusal was neither edited nor weakened. It still fires, and the one place this repository resolves a roadmap to teach from catches that single diagnostic and reads the issue itself. Reacting to the refusal inherits the resolver's whole boundary, so there is one definition of unplanned in the system and a repository that renames the marker renames this behaviour with it. The exclusion of unplanned epics became a parameter of the search rather than a fixed part of it, on by default, because the exclusion is correct for every search that enumerates epics for planned work and wrong only here. The limit on members rose from ten to twenty-five and still counts both kinds alike: the old limit was sized on the expensive kind of member, a planned epic costs dozens of issue-graph calls where an unplanned one costs two, and a real initiative tail is mostly unplanned. Weighting the two kinds against the limit was refused, because weighting needs each member's kind, which needs reading every member, which moves the refusal past the work the limit exists to prevent. Refuted alternative: classify each named issue here first, reading the marker through the shared configuration, then route unplanned epics one way and planned epics to the resolver. It is more direct, with no refusal-shaped control flow and no second read of the issue. It lost on duplication, because this stage would then own a second copy of the check that a number really is an epic, and that copy drifts against the package that keeps changing it. Refuted alternative: add an option to the shared resolver upstream and pass it from here, which is where the relaxation belongs and would couple nothing to a diagnostic name. It lost on release coupling, because this work would then wait on a release and a version floor where the local form ships against the installed version now. The upstream option is the intended replacement, so the coupling is a known temporary shape.

### 2026-09-20 — #65 — Naming split out, leaving this page to say what a named number becomes

This page held two concepts and had run out of room to hold them: how a roadmap's member set is named, and what each named number becomes. A third way of naming a roadmap, one initiative issue number standing for the epics beneath it, forced the separation. Naming moved to its own page and took the member limit, the search rules and the rule that settles the roadmap's own name with it, because each of those is a property of the named set rather than of any one member. What stayed is the part that reads a number: the call to the shared resolver, the one refusal that becomes an unplanned member, and the ordering that puts the epic check before the unplanned check. The seam is the one the implementation itself used, which is why it holds: naming produces a plain set of numbers, and nothing inside resolution knows how that set was named. That is also why an initiative's children needed no new rule here. A child that is not an epic of either kind meets the same refusal a number the lead typed by hand meets, worded the same way, and a child that is an epic nobody has planned yet becomes an unplanned member exactly as it does when named directly. The shared refusal's closing sentence is written for a different caller and does not literally fit a child of an initiative. Rewording it for this caller was refused, because it would mean keeping a second copy of the question "is this an epic" in this repository to buy one sentence, and the lead already gets the substance: which issue is wrong, and that it is not filed as an epic.
