# Teaching concept store (machine-consumable)

The **machine knowledge surface** for the teaching stage — distilled concept pages, one concept per
file, that inform planning, design and contributor ramp-up. Same schema, same rules and the same
validator as the [Nexus](https://github.com/sameera/nexus) store these pages came from; they moved
here with the stage in Nexus epic #677.

## Rules

- **Consumer is the machine, not the human.** Volume is legitimate here. Human-facing,
  judgment-forcing artifacts belong in `docs/`, never here. Human orientation lives in the generated
  atlas, `docs/concepts.md` — machine-written, human-consumed, DERIVED.
- **Grep-native, no topology.** Pages are readable markdown keyed by concept slug. No graph engine,
  no embeddings. Retrieval is search / list / read.
- **Git-tracked, not derived.** These pages hold distilled *judgment* (the "why") that cannot be
  regenerated from code. The derived half is regenerated and never hand-edited: the
  `.nexus/anchors/` sidecars and the `docs/concepts.md` atlas.
- **The distiller is the single producer.** Pages are written and updated only via a reviewed
  distillation pull request (`/nxs.distill`), never hand-authored except for deliberate manual
  curation.

## An edge stops at the repository boundary

A `touches:` edge names a page in this store. Three pages arrived here having named a Nexus page —
the decision record, the record digest, workspace resolution, the pipeline-store exclusion and the
portable tooling — and those edges were dropped, because a store cannot hold an edge whose other end
is somewhere else and a dead edge reads as though the interaction lapsed. It did not: each of those
pages keeps a retired forwarding entry in the Nexus store, so the relationship is findable from that
side. The arrival entry in each page's decision log says which edge it lost and why.

## Validate

This repository is a Nexus adopter, so the pipeline's own verbs check this store:

```bash
nexus validate-concepts
nexus check-atlas
```
