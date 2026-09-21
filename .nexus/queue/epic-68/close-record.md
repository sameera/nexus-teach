---
title: "Close Record: The decision record is written before the lesson needs it"
epic: "#68"
feature: "Teaching Sessions"
date: 2026-09-21
nexus_version: 0.66.0
analyze: ran 2026-09-21 @ 48980af03f76354dbcbbbd326dcfbf3bde3c4645
record: "#100"
record_hash: 4978c7bff6310260d0129c766645b2cde123495e463ae9b8e067d640195bb5cd
range:
  - repo: github.com/sameera/nexus-teach
    base: bea350eead91be2c0b9e90c6cf002422cc1a12cc
    head: 342c2a3bcdf46b79c461d6d8d452e93e5003754e
---

# Close Record: The decision record is written before the lesson needs it

## Key Decisions

- **The stop asks the step that pins sources rather than restating what it would answer.** The record required that the session's stop and that step can never disagree about one epic, and left open how. The check calls the step itself and reads whether it reports it is waiting, instead of re-deriving "no record, or a record nobody approved" beside it. Invariant 3 is then met by construction: there is one implementation of the question, so a change to what counts as an approved record moves both at once. Refuted alternative: re-derive the condition in the session from the same resolved epic, which reads more directly and does not call a stage built for a different purpose. It lost because two implementations of one rule are exactly what the invariant forbids, and nothing would have failed if they had drifted.

- **The record lookup is exported from the command line rather than built again inside the session.** The session is handed the record's existence and approval, the way it is handed the story reader, and the lookup that supplies them is the one the pinning command already uses. No story asked for that export. It is what invariant 5 leaves once the session is forbidden to fetch anything itself, and the operator-facing strings it emits are byte-identical to the ones it replaced, so the promise that nothing about the pinning step changes still holds.

- **The gate sits after the arm that re-opens a written lesson, so placement decides invariant 2 rather than a condition.** The arm that re-opens a lesson whose exercise is unfinished returns before the check is reached. A slice that already carries a written lesson is therefore never re-gated because the gate is never reached, not because it tests for a written lesson. A learner part-way through an exercise cannot be stranded behind a stop that nothing they do to the exercise could clear.

## Deviation Rationale

- **Invariant 18 of record #100 is looser than the code, and the code is right (#100).** It reads that the stop clears "when and only when the slice carries pinned sources". An approved decision record with nothing pinned also clears it, and it must: invariant 3 ties the stop to what the pinning step reports, and that step answers "waiting" only for an absent or unapproved record. Story #97's second acceptance criterion says the same thing from the learner's side, requiring a slice with no sources but an approved record to be taught exactly as it is today. The "and only when" clause would, read strictly, put the stop back on absent sources — the outage this epic's whole design exists to avoid. The wording is corrected on the record thread at close; no code changed.

## Deferred Scope

none

## Process Lesson

Recorded in: `docs/delivery/lessons/2026-09-21-invariant-that-outran-its-own-design.md`
