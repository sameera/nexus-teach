# Features

One folder per feature. Each holds that feature's navigation index (`README.md`), linking the epic
issues delivered under it, plus any durable feature-level notes.

The four features here divide the project the same way the concept store's domain registry divides
the concept pages, and they carry the same four names. `docs/features/` is the human-facing half —
what shipped, and under which issue. `docs/domains.md` is the machine-facing half — where a concept
page files, and in what order the atlas renders it.

## The backlog

Deferred scope does not live here. An **epic stub** — a functional goal identified but not yet
planned — is an open GitHub issue carrying the single `needs-refinement` label, so the whole
cross-feature backlog is one query:

**[Open epic stubs](https://github.com/sameera/nexus-teach/issues?q=is%3Aissue+is%3Aopen+label%3Aneeds-refinement)**
— `is:issue is:open label:needs-refinement`

That link is the authoritative inventory of unplanned work across every feature; the feature a stub
belongs to is recorded in its issue body, not as a label. Promote one with `/nxs.epic <issue-number>`,
which plans that same issue in place.

Ask for the query form rather than spelling the label out, so a rename renames the queries too:

```bash
nexus config backlog-query --form search
nexus config backlog-query --form exclude
```

## Feature index

| Feature                                                    | What it covers                                                                     |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [Interactive Exercises](interactive-exercises/README.md)   | The widgets a lesson declares, and the answer-checking behind them.                |
| [Roadmap Planning](roadmap-planning/README.md)             | Turning a resolved roadmap into an approved plan of slices.                        |
| [Teaching Sessions](teaching-sessions/README.md)           | One sitting: what it verifies, writes, drills, and where it pauses.                |
| [Workbook Rendering](workbook-rendering/README.md)         | The committed store, the pages rendered into it, and the surface they are read on.  |

A feature folder appears here once it has an epic; the folder itself is created at that feature's
first epic filing.

## How this list came to be

This repository was a single feature of [Nexus](https://github.com/sameera/nexus) —
**Roadmap-Driven Learning**, turning a planned roadmap into hands-on lessons a learner works
through, with the theory each exercise needs placed immediately before it. Nexus epic
[#691](https://github.com/sameera/nexus/issues/691) moved the stage out into this repository, and
the one feature came with it, still wrapping everything.

A feature that contains the whole project describes nothing. So the level was removed: the nine
epics that were filed under Roadmap-Driven Learning are now filed under the four features above,
and the initiative that named them is
[#8](https://github.com/sameera/nexus-teach/issues/8), open here.

Two of those nine were missing from the old list and are restored — *Ordering, splitting, scaffolds
and the coverage check* and *The compressed pages a learner returns to*.

**The epics were renumbered.** They were transferred from `sameera/nexus` into this repository and
took new numbers here. A concept page's decision log still cites the Nexus number, because a
decision log records what was true when the decision was made and is never rewritten. Each epic
below names both numbers, so a `#457` in a decision log resolves. GitHub also redirects the old URL
to the new issue.

Four numbers in the decision logs are **not** teaching epics and stay in Nexus: `#15`, `#669`,
`#673` (the theme-token lineage, which arrived with a surface Nexus already had) and `#691` (the
move itself).
