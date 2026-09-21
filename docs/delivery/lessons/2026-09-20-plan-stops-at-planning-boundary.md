---
date: 2026-09-20
epic: "The plan stops at the planning boundary and shows it"
source: "#66"
---

# Lesson: A record that names the open decision and both options gets it decided, not discovered

**Estimate versus actual.** Sized M on three stories. It shipped as one pull request with one commit
per story, passed conformance on the first analyze run with zero findings at every severity and 12
of 12 acceptance criteria met, needed no fix round, and closed with no deviation from record #89.
Stage 1 took 7.4 minutes; the whole script, implementation through certification, took about eleven.
That is the third M in a row in this area that held for the same stated reason — the record settled
the open questions before anyone started typing — and the pattern is now dependable enough to plan
on rather than to keep remarking on.

**The lesson worth carrying.** Record #89's ADDRESS risks did something the previous records in this
area did not: the first one named an open decision, gave both options in one sentence each, and said
"decide one of two things before building". It did not describe a risk and leave the shape of the
answer to whoever hit it. The implementation therefore arrived at that point with a choice to make
rather than a problem to notice, and the choice — approval refuses a draft that has no slice for a
story the roadmap now holds — went in as one guard in a function that already re-reads every drafted
story, in the same commit as the story it belongs to. It is the only thing in the diff that no
acceptance criterion asked for, and analyze correctly reported it as informational scope drift
rather than as a finding, because the record had authorised exactly it.

Contrast the failure mode this avoids. An ADDRESS risk phrased as "the plan can claim a boundary
that is not the complement of what it covers" and nothing more is a risk the implementer meets at
the keyboard, half a story late, with the choice between shipping the window and widening the
story's scope unilaterally. Both are bad and neither gets reviewed. The difference is one extra
sentence in the record naming the two options.

**The habit.** When a record raises an ADDRESS risk, finish it with the decision it forces and the
options that answer it. A risk without a named decision is a note; a risk with two named options is
a gate the implementation passes through. The test for whether a risk is written well enough: could
a reader who has never seen the epic take the decision from the record alone? Both of #89's risks
passed that test, and both were resolved in the shipped code — the first by the approval refusal, the
second by reading the boundary back through `readUnplanned` with a round-trip test through a teaching
session.

**Decomposition.** One story establishes the boundary and the two that follow read it (#85, then #86
and #87), which is the same shape #64 and #65 used and it keeps working. Worth noting for sizing:
#85 was mostly a refusal plus a helper — `hasPlannedMember` and `nothingPlannedYet` are twenty-two
lines of `roadmap.ts` — because the resolved roadmap already stated every member's kind. The epic's
own framing said this ("this epic does not compute the planning boundary"), and when a record opens
by naming what the epic does *not* build, the stories under it size down accordingly. That is a
signal to read for at planning time, not a surprise at implementation.

**Tooling friction, carried over and still unfixed.** The #65 lesson recorded that
`utils/implement-epic.sh` defaults `TEST_CMD` to `npx nx run-many -t test --all` and that this
repository's suite is `pnpm test`. This run did not set it either, and again it did not matter,
because the conformance loop went clean on the first pass and the default is only reached inside a
fix round. That is now twice the wrong default has been invisible for the same reason. Writing the
lesson did not fix it, because nothing in the tooling reads lessons — the next epic here that needs a
fix round will still see every round fail on a command that cannot run, and the failure will still
look like a test failure. Either run it as `TEST_CMD='pnpm test' utils/implement-epic.sh <n>` or put
the value somewhere the script reads.

**The window from #64 and #65 closes here.** Both of those lessons carried forward the same
constraint: the resolver handled unplanned members, but every phase after it iterated stories, so an
all-unplanned or mostly-unplanned roadmap produced no refusal and no diagnostic — it simply planned
nothing and said so nowhere. That is what this epic answers. Extraction refuses when no member is
planned, the committed plan records what it did not cover, and the gate tells the reviewer how much
of the roadmap the plan is. The prose-only constraint in records #75 and #82 no longer needs to be
carried by a lesson; it is in the code and under test.
