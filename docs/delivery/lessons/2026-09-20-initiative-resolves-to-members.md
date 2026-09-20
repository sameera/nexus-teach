---
date: 2026-09-20
epic: "An initiative resolves to the epics and stubs beneath it"
source: "#65"
---

# Lesson: An invariant that forbids a read can hide a default nobody chose

**Estimate versus actual.** Sized M on four stories, one M and three S. It shipped as one pull
request with one commit per story, passed conformance on the first analyze run with zero findings at
every severity, needed no fix round, and closed with no deviation from its decision record. The M
held, for the same reason it held on #64: the record settled the open questions before anyone
started typing. That trade is now observed twice in this area and can be planned on.

**The lesson worth carrying.** Record #82's first draft carried an invariant reading, in effect,
that this stage never reads any signal off the initiative issue itself. It was written to keep the
classification rule in the installed package, which is right. It also, silently, forbade reading the
initiative's title. That mattered, because a roadmap's name is not decoration: it is the workbook
slug the interview is keyed on, and `resolveRoadmap` defaults it from the lowest-numbered member's
title. So the invariant as drafted did not leave naming undecided. It decided it, in the worst
available direction: a workbook the lead named by an initiative would have been slugged after
whichever child epic happened to carry the lowest issue number, and that slug could move between
runs as lower-numbered children were added.

Nothing in the pipeline would have caught it. The epic's acceptance criteria say nothing about
naming, so the epic gate had nothing to check. The razor checker measures scope, and naming is not
scope. Analyze checks the code against the criteria and the invariants, and the code would have
satisfied both. It was caught only by reading the draft invariants against the code they constrain,
rather than against the epic they came from, and asking what existing behaviour each "never reads X"
turns off. One round back to the architect cost about a minute and produced a sixth key decision, a
restated invariant 2 and a new invariant 8.

**The habit that prevents it.** When a record writes an invariant of the form "this stage never
reads X", go and find every existing default that reads X today. Each one is a behaviour the
invariant silently reassigns. Either the record decides where it goes, or the implementer decides at
the keyboard and nobody reviews it. The general shape is that a prohibition is also a decision about
everything it prohibits, and the record only looks complete because prohibitions read like
constraints rather than like choices.

**Decomposition.** The same shape as #64 and it should keep being used: one story establishes the
seam everything else needs (#78, the expansion), and the three refusals (#79, #80, #81) all block on
it and are otherwise additive. Four stories, one pull request, one commit each. Three of the four
refusals turned out to need no new code at all beyond a test, because the expansion hands its numbers
to machinery that already refuses correctly. That is worth predicting next time: when a new input
mode feeds an existing pipeline, most of its refusal stories are tests rather than code, and sizing
them as S is right.

**Tooling friction worth knowing.** `utils/implement-epic.sh` defaults `TEST_CMD` to
`npx nx run-many -t test --all`. This repository has no nx; its suite is `pnpm test`. The default is
only reached inside a fix round, so an epic that passes analyze on the first run — as this one did —
never touches it and the wrong default stays invisible. The next epic here that needs a fix round
would have had every round fail on a command that cannot run, with the failure looking like a test
failure rather than a configuration one. Run it as `TEST_CMD='pnpm test' utils/implement-epic.sh <n>`
in this repository.

**Still carried forward from #64.** This work does not reach a released build before #66, for the
reason record #75 gives: every phase after resolution iterates stories, so an unplanned member
contributes nothing to extraction, the draft, the rewrite, the coverage check or the committed plan,
and nothing refuses. #65 resolves initiatives whose tails are mostly unplanned, so it makes that
window wider rather than narrower. The constraint is still readable only in prose, in record #75 and
now here.
