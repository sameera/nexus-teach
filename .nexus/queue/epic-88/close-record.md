---
title: "Close Record: A concept an unplanned epic will introduce is not scaffolded"
epic: "#88"
feature: "Roadmap Planning"
date: 2026-09-21
nexus_version: 0.62.0
analyze: ran 2026-09-21 @ c7f6a569ef68cb16e5483e990af65a8204964087
record: "#105"
record_hash: 86daffd1a59f95200fe8d548ff642baa77e4af889b71e0ebdef8db0c691a02ef
range:
  - repo: github.com/sameera/nexus-teach
    base: 67a7f52aebfdb71117072d74136501ebacab05bc
    head: de58e32418c906767186ca8499396489861f1ffe
---

# Close Record: A concept an unplanned epic will introduce is not scaffolded

## Key Decisions

- **The rewrite stops too, not only the draft, when an unplanned epic has no list read from its current text.** Record #105 says a missing list stops "the pass". The code applies that to `workbook rewrite` as well as `workbook draft`. An epic's list is kept against a digest of its title and body, so an epic edited after the draft has no current list at rewrite time. Reading that as "introduces nothing" would bring the scaffold back without the reviewer seeing it, which is the failure the record's no-fallback decision rejects. Refuted alternative: let the rewrite reuse the last list read, whatever the epic now says. That keeps planning moving after a small body edit, but the waiting list would then describe text that no longer exists, and the gate's fresh check would disagree with the draft.
- **"Introduces nothing" is an explicit `nothing: true`, and a bare empty list is refused.** This makes the record's "an explicit 'introduces nothing' answer is accepted" checkable in code: a thin body gets a declared empty answer, and a silent empty return reads as a failed extraction.
- **What an epic assumes is accepted, checked, then dropped, not refused.** The extractor can hand back the story-shaped list it is used to. The `assumes` entries are held to the same shape rules and then discarded, because an unplanned epic's assumptions cannot change the current plan.
- **Every new output key appears only when the roadmap holds an unplanned member.** `extractEpics`, `checkedEpics`, `missingEpics`, a proposed identifier's `epics`, and the verdict's `waiting` are all omitted otherwise. This keeps invariant 8 true byte for byte: a fully planned roadmap prints, drafts and fingerprints exactly as before.
- **The merge keeps the first story-proposed name in each group, and code enforces it.** `applyMerge` no longer trusts the merge agent's first entry when that entry is an epic's name. For a group where every name came from a story, this is the same as the old first-entry rule, so fully planned roadmaps are unchanged.

## Deviation Rationale

None. The shipped code matches record #105's decisions and invariants 1–15. The two scope notes the conformance review raised (the rewrite also stops on a missing epic list; the listing gains epic keys only when an unplanned member exists) extend the record's stated intent and are recorded above as key decisions. They are not contradictions. The record's one ADDRESS risk (thin epic bodies over-claiming) shipped with the over-claim and under-claim fixtures it asked for.

## Deferred Scope

none

## Process Lesson

Recorded in: `docs/delivery/lessons/2026-09-21-unplanned-concept-not-scaffolded.md`
