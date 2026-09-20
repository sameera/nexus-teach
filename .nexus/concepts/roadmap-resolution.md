---
title: "Roadmap Resolution"
aliases: ["resolving a roadmap", "roadmap name", "member limit", "search that names a roadmap", "unplanned epic refusal", "teach-from resolution", "fail-closed resolution"]
touches: ["roadmap-members", "workbook-store"]
domain: "roadmap-planning"
last_updated_by: "#64"
status: active
verification: verified
---

# Roadmap Resolution

A roadmap is resolved from a list of issue numbers, or from one search that names them, into the members it holds. Every number goes to the shared epic resolver unchanged, and exactly one of that resolver's refusals, the one it raises for an epic identified but not planned, becomes an unplanned member instead of an error. Every other refusal fails the whole resolution and writes nothing.

## How It Works

Reacting to the resolver's own refusal keeps one definition of unplanned in the system, and it inherits that resolver's whole boundary: the check that a number really is an epic runs first, so a story number or a decision-record number is still refused. Only for an unplanned member is the issue read a second time, for the title and body it carries.

That reaction lives in the one place a roadmap is resolved to teach from, so nothing else in this repository and no other reader of the resolver can reach it.

A search that names a roadmap keeps unplanned epics in. Every other search enumerating epics for planned work leaves them out, which is the default.

A roadmap whose members are all unplanned still resolves, and the phase that reads it decides what to do with it.

## Key Invariants

1. Resolution stays fail-closed: the one named refusal for an unplanned epic becomes a member, and every other refusal fails the whole resolution with nothing written.
2. This stage never names the marker that identifies an unplanned epic, and keeps no second rule for deciding that a member is unplanned.
3. The check that a named number really is an epic runs before the unplanned check, so a story number or a decision-record number is still refused for a roadmap.
4. The limit on how many members one roadmap may hold runs on the named numbers before anything is fetched and counts both kinds alike; a search asks for one row past that limit and refuses on the count.
5. Including unplanned epics means the exclusion term is not applied. It never means the search is inverted to match unplanned epics only.
6. The learner's search expression stays untrusted input, passed as distinct arguments and never assembled into a shell string, with or without the exclusion term.
7. A roadmap takes its name from its lowest-numbered member's title, whichever kind that member is.

## Integration Points

- [roadmap-members](roadmap-members.md) — the ordered list this produces, and the one place each member's kind is recorded.
- [workbook-store](workbook-store.md) — the workbook created once resolution succeeds, whose slug is the name taken from the lowest-numbered member.

## Decision Log

### 2026-09-20 — #64 — An unplanned member is recognised by the resolver's own refusal

A roadmap taught from has to hold the epics nobody has planned yet, and the shared resolver refuses exactly those by name. That refusal was neither edited nor weakened. It still fires, and the one place this repository resolves a roadmap to teach from catches that single diagnostic and reads the issue itself. Reacting to the refusal inherits the resolver's whole boundary, so there is one definition of unplanned in the system and a repository that renames the marker renames this behaviour with it. The exclusion of unplanned epics became a parameter of the search rather than a fixed part of it, on by default, because the exclusion is correct for every search that enumerates epics for planned work and wrong only here. The limit on members rose from ten to twenty-five and still counts both kinds alike: the old limit was sized on the expensive kind of member, a planned epic costs dozens of issue-graph calls where an unplanned one costs two, and a real initiative tail is mostly unplanned. Weighting the two kinds against the limit was refused, because weighting needs each member's kind, which needs reading every member, which moves the refusal past the work the limit exists to prevent. Refuted alternative: classify each named issue here first, reading the marker through the shared configuration, then route unplanned epics one way and planned epics to the resolver. It is more direct, with no refusal-shaped control flow and no second read of the issue. It lost on duplication, because this stage would then own a second copy of the check that a number really is an epic, and that copy drifts against the package that keeps changing it. Refuted alternative: add an option to the shared resolver upstream and pass it from here, which is where the relaxation belongs and would couple nothing to a diagnostic name. It lost on release coupling, because this work would then wait on a release and a version floor where the local form ships against the installed version now. The upstream option is the intended replacement, so the coupling is a known temporary shape.
