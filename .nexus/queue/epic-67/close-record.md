---
title: "Close Record: A stub is planned when the learner reaches it"
epic: "#67"
feature: "Teaching Sessions"
date: 2026-09-20
nexus_version: 0.66.0
analyze: ran 2026-09-20 @ c5c4e573a2f2d59c91e2ef29c111acd23c767256
record: "#95"
record_hash: 50e45ead3a09f91de4f0e87e5cf0ca788f52cde41c72c07912614f1f322c9402
range:
  - repo: github.com/sameera/nexus-teach
    base: a5ea936c208d3f3f448b7f4f042f410f48542dab
    head: bea350eead91be2c0b9e90c6cf002422cc1a12cc
---

# Close Record: A stub is planned when the learner reaches it

## Key Decisions

- **The verdict carries the brief's path, and carries null when the brief could not be written.** The record settled that a refused write reports the refusal beside the verdict rather than replacing it, and left open what the verdict itself says about the file. It carries the path, so a caller naming the brief does not re-derive where the learner folder put it, and the null is the same value the refusal path already reports on. A caller therefore reads one field rather than pairing a verdict with a search through the skipped list.

- **A workspace that cannot be read is said so, in place of a repository.** The record decided the brief names where the epic lives, resolved the way roadmap resolution resolves it, and did not say what happens when that resolution fails. It answers with a third state rather than falling back to the workbook's repository, and the brief prints that the checkout declares a workspace it could not read and that the learner should run the planning command wherever the roadmap's epics are filed. A fallback would have printed a repository that is confidently wrong, which is the failure the whole decision exists to prevent. Refuted alternative: fall back to the workbook's repository, which is right in every single-repo checkout and needs no third state. It lost because the only checkouts that can reach the failure are the ones where the fallback is wrong.

- **The planning entry point is read from the constant that already names it.** The brief tells the learner to run the planning chain again, and named it by repeating the literal. It now reads the constant `phase-references` exports. Two spellings of one command name is one rename away from a brief that sends the learner to a verb that no longer exists.

## Deviation Rationale

- **The workspace branch is tested, where the record accepted that it would not be (#95).** The record's first ADDRESS risk named the repository the brief states, settled it by naming both repositories labelled, and then accepted that the workspace branch would go unexercised because this repository is a single-repo checkout. That acceptance is what shipped first, and the branch was wrong: it named the hub's checkout directory where an owner/repo identity belongs, so a workspace run would have told the learner to plan the epic in a local folder. The conformance gate caught it, and the fix reads the canonical remote identity instead. Four tests now cover the branch, the first of which fails against the folder-name version. A hub resolves from a manifest alone, so the case cost a temporary directory and a two-line file — much less than the record's acceptance implied, and the acceptance was made without anyone checking that price.

## Deferred Scope

none

## Process Lesson

Recorded in: `docs/delivery/lessons/2026-09-20-address-risk-that-names-an-untested-branch.md`
